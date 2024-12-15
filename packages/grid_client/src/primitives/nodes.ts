import { SortBy, SortOrder } from "@threefold/gridproxy_client";
import { Client as RMBClient } from "@threefold/rmb_direct_client";
import { QueryClient } from "@threefold/tfchain_client";
import { TFChainError } from "@threefold/tfchain_client";
import { BaseError, GridClientError, GridClientErrors, RequestError, ValidationError } from "@threefold/types";
import { default as PrivateIp } from "private-ip";
import urlJoin from "url-join";

import { RMB } from "../clients";
import { Graphql } from "../clients/graphql/client";
import { Features, formatErrorMessage } from "../helpers";
import { send, sendWithFullResponse } from "../helpers/requests";
import { convertObjectToQueryString } from "../helpers/utils";
import { FarmFilterOptions, FilterOptions, MachineModel, NodeStatus } from "../modules/models";
import { WorkloadTypes } from "../zos";

interface FarmInfo {
  name: string;
  farmId: number;
  twinId: number;
  pricingPolicyId: number;
  certificationType: string;
  stellarAddress: string;
  dedicated: boolean;
  publicIps: PublicIps[];
}
interface PublicIps {
  id: string;
  ip: string;
  contract_id: number; // Added to match the one in the farm interface || TODO: Should we replace the whole http requests to be done with the gridProxy.
  gateway: string;
}

interface NodeInfo {
  version: number;
  id: string;
  nodeId: number;
  farmId: number;
  farmName: string;
  twinId: number;
  gridVersion: number;
  uptime: number;
  created: number;
  farmingPolicyId: number;
  inDedicatedFarm: boolean;
  updatedAt: string;
  total_resources: NodeResources;
  used_resources: NodeResources;
  location: {
    country: string;
    city: string;
  };
  publicConfig: PublicConfig;
  status: string;
  certificationType: string;
  dedicated: boolean;
  hasGPU: boolean;
  extraFee: number;
  rentedByTwinId: number;
  rentContractId: number;
  serialNumber?: string;
  healthy: boolean;
  rentable: boolean;
  rented: boolean;
  price_usd: number;
  features: string[];
}
interface PublicConfig {
  domain: string;
  gw4: string;
  gw6: string;
  ipv4: string;
  ipv6: string;
}

interface NodeResources {
  cru: number;
  sru: number;
  hru: number;
  mru: number;
  ipv4u: number;
}
interface NodeCapacity {
  capacity: {
    total_resources: NodeResources;
    used_resources: NodeResources;
  };
}
interface RMBNodeCapacity {
  total: NodeResources;
  used: NodeResources;
}
enum DiskTypes {
  SSD = "ssd",
  HDD = "hdd",
}
export interface StoragePool {
  type: DiskTypes;
  size: number;
  used: number;
}
class Nodes {
  gqlClient: Graphql;
  rmb: RMB;
  constructor(public graphqlURL: string, public proxyURL: string, rmbClient: RMBClient) {
    this.gqlClient = new Graphql(graphqlURL);
    this.rmb = new RMB(rmbClient);
  }

  async getNodeTwinId(node_id: number): Promise<number> {
    const body = `query getNodeTwinId($nodeId: Int!){
            nodes(where: { nodeID_eq: $nodeId }) {
            twinID
            }
        }`;
    return this.gqlClient
      .query(body, { nodeId: node_id })
      .then(response => {
        if (response["data"]["nodes"]["length"] === 0) {
          throw new ValidationError(`Couldn't find a node with id: ${node_id}.`);
        }
        return response["data"]["nodes"][0]["twinID"];
      })
      .catch(e => {
        (e as Error).message = formatErrorMessage(`Error getting node twin ID for ID ${node_id}`, e);
        throw e;
      });
  }

  async getAccessNodes(availableFor?: number): Promise<Record<string, unknown>> {
    const accessNodes = {};
    let nodes: NodeInfo[] = [];
    let page = 1;
    do {
      nodes = await this.filterNodes({
        accessNodeV4: true,
        accessNodeV6: true,
        availableFor,
        page,
      });
      for (const node of nodes) {
        const ipv4 = node.publicConfig.ipv4;
        const ipv6 = node.publicConfig.ipv6;
        const domain = node.publicConfig.domain;
        if (PrivateIp(ipv4.split("/")[0]) === false) {
          accessNodes[+node.nodeId] = {
            ipv4: ipv4,
            ipv6: ipv6,
            domain: domain,
          };
        }
      }
      page++;
    } while (nodes.length);
    if (Object.keys(accessNodes).length === 0) {
      throw new GridClientErrors.Nodes.InvalidResourcesError("Couldn't find any node with public config.");
    }
    return accessNodes;
  }

  async getNodeIdFromContractId(contractId: number, substrateURL: string): Promise<number> {
    const tfclient = new QueryClient(substrateURL);
    return tfclient.contracts
      .get({ id: contractId })
      .then(contract => {
        if (!contract.contractType.nodeContract)
          throw new ValidationError(`Couldn't get node id for this contract ${contractId}. It's not a node contract.`);
        return contract.contractType.nodeContract.nodeId;
      })
      .catch(err => {
        //TODO add error handling in QueryClient/contracts
        throw new TFChainError({
          message: `Error getting node ID from contract ID ${contractId}: ${err}`,
        });
      });
  }

  _g2b(GB: number): number {
    return GB * 1024 ** 3;
  }

  async getFarms(page = 1, pageSize = 50, url = ""): Promise<FarmInfo[]> {
    let r: string;
    if (url) r = url;
    else r = this.proxyURL;

    return send("get", urlJoin(r, `/farms?page=${page}&size=${pageSize}`), "", {})
      .then(res => {
        return res;
      })
      .catch((err: Error) => {
        err.message = formatErrorMessage(`Error listing farms with page ${page} and size ${pageSize}`, err);
        throw err;
      });
  }

  async getAllFarms(url = ""): Promise<FarmInfo[]> {
    try {
      const farmsCount = await this.gqlClient.getItemTotalCount("farms", "(orderBy: farmID_ASC)");
      return await this.getFarms(1, farmsCount, url);
    } catch (err) {
      (err as Error).message = formatErrorMessage(`Error listing all farms`, err);
      throw err;
    }
  }

  async checkFarmHasFreePublicIps(farmId: number, farms: FarmInfo[] = null, url = ""): Promise<boolean> {
    if (!farms) {
      farms = await this.getAllFarms(url);
    }
    return farms
      .filter(farm => farm.publicIps.filter(ip => ip.contract_id === 0).length > 0)
      .map(farm => farm.farmId)
      .includes(farmId);
  }

  async getNodes(page = 1, pageSize = 50, url = ""): Promise<NodeInfo[]> {
    let r: string;
    if (url) r = url;
    else r = this.proxyURL;
    return send("get", urlJoin(r, `/nodes?page=${page}&size=${pageSize}`), "", {})
      .then(ret => {
        return ret;
      })
      .catch(e => {
        (e as Error).message = formatErrorMessage(`Error listing nodes with page ${page} and size ${pageSize}`, e);
        throw e;
      });
  }

  async getAllNodes(url = ""): Promise<NodeInfo[]> {
    try {
      const nodesCount = await this.gqlClient.getItemTotalCount("nodes", "(orderBy: nodeID_ASC)");
      return await this.getNodes(1, nodesCount, url);
    } catch (e) {
      (e as Error).message = formatErrorMessage(`Error listing all nodes`, e);
      throw e;
    }
  }

  async getNodesByFarmId(farmId: number, url = ""): Promise<NodeInfo[]> {
    let nodesCount = 0;
    try {
      nodesCount = await this.gqlClient.getItemTotalCount(
        "nodes",
        `(where: {farmID_eq: ${farmId}}, orderBy: nodeID_ASC)`,
      );
    } catch (e) {
      (e as Error).message = formatErrorMessage(`Error getting total nodes count`, e);
      throw e;
    }
    let r: string;
    if (url) r = url;
    else r = this.proxyURL;

    return send("get", urlJoin(r, `/nodes?farm_id=${farmId}&size=${nodesCount}`), "", {})
      .then(res => {
        if (res) return res;
        else throw new ValidationError(`The farm with id ${farmId}: doesn't have any nodes.`);
      })
      .catch(e => {
        (e as Error).message = formatErrorMessage(`Error getting nodes by farm ID ${farmId}`, e);
        throw e;
      });
  }

  async getNode(nodeId, url = ""): Promise<NodeInfo> {
    let r: string;
    if (url) r = url;
    else r = this.proxyURL;

    return send("get", urlJoin(r, `/nodes?node_id=${nodeId}`), "", {})
      .then(ret => {
        if (ret.length !== 0) return ret[0];
      })
      .catch(e => {
        (e as Error).message = formatErrorMessage(`Error getting node with ID ${nodeId}`, e);
        throw e;
      });
  }

  async getNodeFreeResources(nodeId: number, source: "proxy" | "zos" = "proxy", url = ""): Promise<NodeResources> {
    if (source == "zos") {
      const node_twin_id = await this.getNodeTwinId(nodeId);

      return this.rmb
        .request([node_twin_id], "zos.statistics.get", "")
        .then(res => {
          const node: RMBNodeCapacity = res;
          const ret: NodeResources = {
            cru: 0,
            mru: 0,
            hru: 0,
            sru: 0,
            ipv4u: 0,
          };

          ret.cru = +node.total.cru;
          ret.mru = +node.total.mru - +node.used.mru;
          ret.sru = +node.total.sru - +node.used.sru;
          ret.hru = +node.total.hru - +node.used.hru;

          return ret;
        })
        .catch(e => {
          (e as Error).message = formatErrorMessage(`Error getting node ${nodeId}`, e);
          throw e;
        });
    }

    let r: string;
    if (url) r = url;
    else r = this.proxyURL;

    return send("get", urlJoin(r, `/nodes/${nodeId}`), "", {})
      .then(res => {
        const node: NodeCapacity = res;
        const ret: NodeResources = { cru: 0, mru: 0, hru: 0, sru: 0, ipv4u: 0 };
        ret.cru = +node.capacity.total_resources.cru;
        ret.mru = +node.capacity.total_resources.mru - +node.capacity.used_resources.mru;
        ret.sru = +node.capacity.total_resources.sru - +node.capacity.used_resources.sru;
        ret.hru = +node.capacity.total_resources.hru - +node.capacity.used_resources.hru;

        return ret;
      })
      .catch(e => {
        if (e instanceof RequestError && e.statusCode == 404) {
          throw new ValidationError(`Node: ${nodeId} is not found`);
        }
        if (e instanceof BaseError) {
          (e as Error).message = formatErrorMessage(`Couldn't get Node with ID ${nodeId}.`, e);
          throw e;
        }
        throw new GridClientError(`Couldn't get Node with ID ${nodeId} due to ${e}`);
      });
  }

  /**
   * Sets the features of the node according to filter options.
   *
   * @param options - An object containing filter options to set the node's features.
   * @returns A string array representing the node's features.
   */
  getFeaturesFromFilters(options: FilterOptions = {}): string[] {
    const features: string[] = options.features || [];
    if (options.publicIPs) {
      features.push(Features.ipv4);
    }
    if (options.hasIPv6) {
      features.push(Features.ip);
    }
    if (options.wireguard) {
      features.push(Features.wireguard);
    }
    if (options.mycelium) {
      features.push(Features.mycelium);
    }
    if (options.planetary) {
      features.push(Features.yggdrasil);
    }

    if (options.gateway) {
      features.push(WorkloadTypes.gatewayfqdnproxy);
      features.push(WorkloadTypes.gatewaynameproxy);
    }

    return features;
  }

  async filterNodes(options: FilterOptions = {}, url = ""): Promise<NodeInfo[]> {
    let nodes: NodeInfo[] = [];
    url = url || this.proxyURL;
    options.features = this.getFeaturesFromFilters(options);
    const query = this.getNodeUrlQuery(options);
    nodes = await send("get", urlJoin(url, `/nodes?${query}`), "", {});
    if (nodes.length) {
      nodes = nodes.filter(n => !(options.nodeExclude && options.nodeExclude?.includes(n.nodeId)));
    }
    return nodes;
  }
  async filterFarms(options: FilterOptions = {}, url = ""): Promise<FarmInfo[]> {
    let farms: FarmInfo[] = [];
    url = url || this.proxyURL;
    const query = this.getFarmUrlQuery(options);
    farms = await send("get", urlJoin(url, `/farms?${query}`), "", {});
    return farms;
  }

  /**
   * Retrieves the count of available farms with optional filter options.
   *
   * @param options - An object containing filter options to refine the farm count.
   * @param url - (Optional) The URL to send the request to. If not provided, it defaults to the proxy URL defined in the class.
   * @returns A Promise that resolves to the count of available farms as a number.
   * @throws Error if there is an issue with the HTTP request or response.
   */
  async getFarmsCount(options: FilterOptions = {}, url = ""): Promise<number> {
    const _options = { ...options };
    url = url || this.proxyURL;
    _options.ret_count = true;
    _options.page = 1;
    const query = this.getFarmUrlQuery(_options);
    return +(await sendWithFullResponse("get", urlJoin(url, `/farms?${query}`), "", {})).headers["count"];
  }

  async getNodesCount(options: FilterOptions = {}, url = ""): Promise<number> {
    const _options = { ...options };
    url = url || this.proxyURL;
    _options.ret_count = true;
    _options.page = 1;
    const query = this.getNodeUrlQuery(_options);
    return +(await sendWithFullResponse("get", urlJoin(url, `/nodes?${query}`), "", {})).headers["count"];
  }

  /**
   * Get farm id from farm name.
   * It returns 0 in case the farm name is not found.
   * @param  {string} name
   * @returns {Promise<number>}
   */
  async getFarmIdFromFarmName(name: string, farms: FarmInfo[] = null, url = ""): Promise<number> {
    if (!farms) {
      farms = await this.getAllFarms(url);
    }
    const filteredFarms = farms.filter(f => String(f.name).toLowerCase() === name.toLowerCase());
    if (filteredFarms.length === 0) {
      return 0; // not found
    }
    return filteredFarms[0].farmId;
  }

  getNodeUrlQuery(options: FilterOptions = {}) {
    const params = {
      total_cru: options.cru || "",
      free_mru: Math.ceil(this._g2b(options.mru)) || "",
      free_sru: Math.ceil(this._g2b(options.sru)) || "",
      free_hru: Math.ceil(this._g2b(options.hru)) || "",
      free_ips: options.publicIPs ? 1 : "",
      ipv4: options.accessNodeV4,
      ipv6: options.accessNodeV6,
      has_ipv6: options.hasIPv6,
      certification_type: options.certified ? "Certified" : "",
      farm_ids: options.farmId ? [options.farmId] : options.farmIds,
      farm_name: options.farmName,
      country: options.country,
      city: options.city,
      dedicated: options.dedicated,
      available_for: options.availableFor,
      status: options.status ? options.status : NodeStatus.up,
      page: options.page,
      size: options.size,
      has_gpu: options.hasGPU,
      rented_by: options.rentedBy,
      rentable: options.rentable,
      randomize: options.randomize,
      ret_count: options.ret_count,
      region: options.region,
      healthy: options.healthy,
      sort_by: SortBy.FreeCRU,
      sort_order: SortOrder.Desc,
      features: options.features,
    };

    if (options.gateway) {
      params["ipv4"] = true;
      params["ipv6"] = true;
      params["domain"] = true;
    }
    return convertObjectToQueryString(params);
  }

  getFarmUrlQuery(options: FarmFilterOptions = {}) {
    const params = {
      node_total_cru: options.nodeCRU || "",
      node_free_mru: Math.ceil(this._g2b(options.nodeMRU)) || "",
      node_free_sru: Math.ceil(this._g2b(options.nodeSRU)) || "",
      node_free_hru: Math.ceil(this._g2b(options.nodeHRU)) || "",
      free_ips: options.publicIp ? 1 : "",
      certification_type: options.certificationType,
      farm_name: options.farmName,
      country: options.country,
      dedicated: options.dedicated,
      node_available_for: options.availableFor,
      node_has_ipv6: options.nodeHasIPv6,
      node_status: "up",
      page: options.page,
      size: options.size,
      twin_id: options.ownedBy,
      node_has_gpu: options.nodeHasGPU,
      node_rented_by: options.nodeRentedBy,
      node_certified: options.nodeCertified,
      farm_id: options.farmId,
      randomize: options.randomize,
      ret_count: options.ret_count,
      region: options.region,
    };

    return convertObjectToQueryString(params);
  }

  async nodeHasResources(nodeId: number, options: FilterOptions): Promise<boolean> {
    const resources = await this.getNodeFreeResources(nodeId, "zos");
    if (
      (options.mru && options.mru > 0 && resources.mru < this._g2b(options.mru)) ||
      (options.sru && options.sru > 0 && resources.sru < this._g2b(options.sru)) ||
      (options.hru && options.hru > 0 && resources.hru < this._g2b(options.hru))
    ) {
      return false;
    }
    return true;
  }

  async nodeAvailableForTwinId(nodeId: number, twinId: number): Promise<boolean> {
    return send("get", urlJoin(this.proxyURL, `/nodes/${nodeId}`), "", {})
      .then((node: NodeInfo) => {
        if (node.rentedByTwinId != twinId && (node.inDedicatedFarm || node.rentContractId != 0)) {
          return false;
        }
        return true;
      })
      .catch(e => {
        (e as Error).message = formatErrorMessage(
          `Error checking if node ${nodeId} is available for twin ${twinId}`,
          e,
        );
        throw e;
      });
  }

  /**
   * Allocates a disk of a given size to a list of disk pools.
   *
   * @param diskPools - An array of numbers representing the available disk space in each pool.
   * @param disk - The size of the disk to be allocated.
   * @returns A boolean value indicating whether the disk was successfully allocated or not.
   *          Returns true if the disk was allocated to a pool, false otherwise.
   */
  allocateDiskToPools(diskPools: number[], disk: number): boolean {
    for (const index in diskPools) {
      if (diskPools[index] >= disk) {
        diskPools[index] -= disk;
        return true;
      }
    }
    return false;
  }

  /**
   * Sorts an array of numbers in descending order.
   *
   * @param array - The array of numbers to be sorted in descending order.
   */
  sortArrayDesc(array: number[]): void {
    array.sort((a, b) => b - a);
  }

  /**
   * Fits disks into disk pools based on their sizes.
   *
   * @param disks - An array of disk sizes required to be fitted into the pool.
   * @param pool - An array representing the available disk space in the pool.
   * @param type - A DiskTypes enum value representing the type of disk being allocated.
   * @throws {Error} - If the required disk cannot be fitted into the pool.
   */
  fitDisksInDisksPool(disks: number[], pools: number[], type: DiskTypes): void {
    disks.forEach(disk => {
      if (!this.allocateDiskToPools(pools, disk)) {
        throw new Error(
          `Cannot fit the required ${type.toUpperCase()} disk with size ${(disk / 1024 ** 3).toFixed(2)} GB.`,
        );
      }
      this.sortArrayDesc(pools);
    });
  }

  /**
   * Verifies the storage pool capacity of a node for different disk types.
   *
   * @param ssdDisks - An array of SSD disk sizes required for the deployment.
   * @param hddDisks - An array of HDD disk sizes required for the deployment.
   * @param rootFileSystemDisks - An array of disk sizes required for the deployment's root file system.
   * @param nodeId - The ID of the node to be verified.
   * @returns {Promise<boolean>} - True if the node has enough capacity, otherwise false.
   * @throws {Error} - If there is an error in getting the node's information or if the required deployment can't be fitted.
   */
  async verifyNodeStoragePoolCapacity(
    ssdDisks: number[],
    hddDisks: number[],
    rootFileSystemDisks: number[],
    nodeId: number,
  ): Promise<boolean> {
    const ssdPools: number[] = [];
    const hddPools: number[] = [];

    try {
      const nodeTwinId = await this.getNodeTwinId(nodeId);
      ((await this.rmb.request([nodeTwinId], "zos.storage.pools", "")) as StoragePool[]).forEach(
        (disk: StoragePool) => {
          disk.type === DiskTypes.SSD ? ssdPools.push(disk.size - disk.used) : hddPools.push(disk.size - disk.used);
        },
      );
    } catch (e) {
      (e as Error).message = formatErrorMessage(`Error getting node ${nodeId}`, e);
      throw e;
    }

    this.sortArrayDesc(hddPools);
    this.sortArrayDesc(ssdPools);

    this.sortArrayDesc(rootFileSystemDisks);
    this.sortArrayDesc(ssdDisks);
    this.sortArrayDesc(hddDisks);

    try {
      this.fitDisksInDisksPool(ssdDisks, ssdPools, DiskTypes.SSD);
      this.fitDisksInDisksPool(hddDisks, hddPools, DiskTypes.HDD);
      this.fitDisksInDisksPool(rootFileSystemDisks, ssdPools, DiskTypes.SSD);
      return true;
    } catch (error) {
      throw new GridClientErrors.Nodes.DiskAllocationError(
        `${(error as Error).message}, on Node ${nodeId} with disk pools:
         SSD:  ${ssdPools.map(disk => (disk / 1024 ** 3).toFixed(2).toString() + "GB ")} 
         HDD:  ${hddPools.map(disk => (disk / 1024 ** 3).toFixed(2).toString() + "GB ")}
    Please select another Node.\n`,
      );
    }
  }

  // TODO : add get node by its node ID like the one in modules
}

export { Nodes, FarmInfo, NodeResources, NodeInfo, PublicIps, PublicConfig };
