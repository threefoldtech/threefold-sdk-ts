import { GridClientConfig } from "../config";
import { expose } from "../helpers/expose";
import { validateInput } from "../helpers/validator";
import { FarmerBot, FarmerBotFindNodeModel } from "../high_level/farmerbot";
import { FarmInfo, NodeInfo, NodeResources, Nodes } from "../primitives/nodes";
import {
  CapacityPoolCheckModel,
  FarmFilterOptions,
  FarmHasFreePublicIPsModel,
  FarmIdFromFarmNameModel,
  FarmsGetModel,
  FilterOptions,
  NodeFreeResourcesModel,
  NodeIdFromContractIdModel,
  NodesByFarmIdModel,
  NodesGetModel,
} from "./models";

class Capacity {
  nodes: Nodes;

  /**
   * Capacity class handles operations related to capacity management.
   *
   * It provides methods to interact with farms and nodes, including filtering, counting, and checking capacity.
   * The class utilizes the Nodes class to perform these operations.
   *
   * @param {GridClientConfig} config - The configuration object for initializing the client.
   */
  constructor(public config: GridClientConfig) {
    this.nodes = new Nodes(config.graphqlURL, config.proxyURL, config.rmbClient);
  }

  /**
   * Retrieves a list of farms based on the provided options.
   *
   * This method calls the `getFarms` method of the `Nodes` class with the specified page and maxResult options.
   *
   * @param {FarmsGetModel} options - An optional object containing page and maxResult parameters for pagination.
   * @returns {Promise<FarmInfo[]>} A promise that resolves to an array of FarmInfo objects representing the farms.
   * @decorators
   * - `@expose`: Exposes the method for external use.
   * - `@validateInput`: Validates the input options.
   */
  @expose
  @validateInput
  async getFarms(options: FarmsGetModel = {}): Promise<FarmInfo[]> {
    return await this.nodes.getFarms(options.page, options.maxResult);
  }

  /**
   * Retrieves a list of nodes based on the provided options.
   *
   * This method calls the `getNodes` method of the `Nodes` class with the specified page and maxResult options.
   *
   * @param {NodesGetModel} options - An optional object containing page and maxResult parameters for pagination.
   * @returns {Promise<NodeInfo[]>} A promise that resolves to an array of NodeInfo objects representing the nodes.
   * @decorators
   * - `@expose`: Exposes the method for external use.
   * - `@validateInput`: Validates the input options.
   */
  @expose
  @validateInput
  async getNodes(options: NodesGetModel = {}): Promise<NodeInfo[]> {
    return await this.nodes.getNodes(options.page, options.maxResult);
  }

  /**
   * Retrieves all farms.
   *
   * This method internally calls the `getAllFarms` method of the `Nodes` class to fetch all farms.
   *
   * @returns {Promise<FarmInfo[]>} A promise that resolves to an array of FarmInfo objects representing all farms.
   * @decorators
   * - `@expose`: Exposes the method for external use.
   */
  @expose
  async getAllFarms(): Promise<FarmInfo[]> {
    return await this.nodes.getAllFarms();
  }

  /**
   * Retrieves all nodes.
   *
   * This method internally calls the `getAllNodes` method of the `Nodes` class to fetch all nodes.
   *
   * @returns {Promise<NodeInfo[]>} A promise that resolves to an array of NodeInfo objects representing all nodes.
   * @decorators
   * - `@expose`: Exposes the method for external use.
   */
  @expose
  async getAllNodes(): Promise<NodeInfo[]> {
    return await this.nodes.getAllNodes();
  }

  /**
   * Retrieves nodes using `FarmerBot` based on the provided filter options.
   *
   * This method utilizes the `FarmerBot` class to interact with farms and nodes,
   * checking capacity and finding suitable nodes based on the specified options.
   * If the provided options meet certain criteria, it calls the `FarmerBot` to find a node.
   *
   * @param {FilterOptions} options - An optional object containing filter options for nodes.
   * @returns {Promise<NodeInfo[]>} A promise that resolves to an array of NodeInfo objects representing the filtered nodes.
   */
  private async useFarmerBot(options?: FilterOptions): Promise<NodeInfo[]> {
    if (options) {
      const farmerbot = new FarmerBot(this.config);
      try {
        const pong = await farmerbot.pingFarm({ farmId: options.farmId! });
        if (pong && options.mru && options.sru && options.hru && options.hasGPU) {
          const nodeOptions: FarmerBotFindNodeModel = {
            farmId: options.farmId!,
            required_cru: options.cru,
            required_mru: Math.ceil(this.nodes._g2b(options.mru)) || 0,
            required_sru: Math.ceil(this.nodes._g2b(options.sru)) || 0,
            required_hru: Math.ceil(this.nodes._g2b(options.hru)) || 0,
            certified: options.certified,
            dedicated: options.dedicated,
            public_ips: options.publicIPs ? 1 : 0,
            public_config: options.accessNodeV4 || options.accessNodeV6 || options.gateway,
            node_exclude: options.nodeExclude,
            has_gpus: options.hasGPU ? 0 : 1,
          };
          const nodeId = await farmerbot.findNode(nodeOptions);
          return [await this.nodes.getNode(nodeId)];
        }
      } catch {
        console.log(`farmer bot is not responding for farm ${options.farmId}`);
      }
    }
    return [];
  }

  /**
   * Retrieves a list of nodes based on the provided filters.
   *
   * This method internally calls the `filterNodes` method of the `Nodes` class with the specified options.
   *
   * @param {FilterOptions} options - An optional object containing filter options for nodes.
   * @returns {Promise<NodeInfo[]>} A promise that resolves to an array of NodeInfo objects representing the filtered nodes.
   * @decorators
   * - `@expose`: Exposes the method for external use.
   * - `@validateInput`: Validates the input options.
   */
  @expose
  @validateInput
  async filterNodes(options?: FilterOptions): Promise<NodeInfo[]> {
    // Disabling farmer bot as some filters are not supported yet there.

    let nodes: NodeInfo[] = [];
    // if (options?.farmName) {
    //   options.farmId = await this.nodes.getFarmIdFromFarmName(options.farmName);
    // }
    // if (options?.farmId && !options.rentedBy) {
    //   nodes = await this.useFarmerBot(options)
    // }
    if (nodes.length <= 0) nodes = await this.nodes.filterNodes(options);
    return nodes;
  }

  @expose
  @validateInput
  getFeaturesFromFilters(options?: FilterOptions): string[] {
    let features: string[] = [];

    features = this.nodes.getFeaturesFromFilters(options);
    return features;
  }

  /**
   * Retrieves a list of farms based on the provided options.
   *
   * This method calls the `filterFarms` method of the `Nodes` class with the specified filter options.
   *
   * @param {FarmFilterOptions} options - An optional object containing filter options for farms.
   * @returns {Promise<FarmInfo[]>} A promise that resolves to an array of FarmInfo objects representing the filtered farms.
   * @decorators
   * - `@expose`: Exposes the method for external use.
   * - `@validateInput`: Validates the input options.
   */
  @expose
  @validateInput
  async filterFarms(options?: FarmFilterOptions): Promise<FarmInfo[]> {
    return await this.nodes.filterFarms(options);
  }

  /**
   * Retrieves the count of farms based on the provided filter options.
   *
   * This method internally calls the `getFarmsCount` method of the `Nodes` class with the specified filter options.
   *
   * @param {FarmFilterOptions} options - An optional object containing filter options for farms.
   * @returns {Promise<number>} A promise that resolves to the count of farms based on the provided filter options.
   * @decorators
   * - `@expose`: Exposes the method for external use.
   * - `@validateInput`: Validates the input options.
   */
  @expose
  @validateInput
  async getFarmsCount(options?: FarmFilterOptions): Promise<number> {
    return await this.nodes.getFarmsCount(options);
  }

  /**
   * Retrieves the count of nodes based on the provided options.
   *
   * This method calls the `getNodesCount` method of the `Nodes` class with the specified options.
   *
   * @param {FilterOptions} options - An optional object containing filter options for nodes.
   * @returns {Promise<number>} A promise that resolves to the count of nodes based on the provided options.
   * @decorators
   * - `@expose`: Exposes the method for external use.
   * - `@validateInput`: Validates the input options.
   */
  @expose
  @validateInput
  async getNodesCount(options?: FilterOptions): Promise<number> {
    return await this.nodes.getNodesCount(options);
  }

  /**
   * Checks if a farm has `free public IPs` based on the provided `farm ID`.
   *
   * This method internally calls the `checkFarmHasFreePublicIps` method of the `Nodes` class to verify if the farm has `free public IPs`.
   *
   * @param {FarmHasFreePublicIPsModel} options - An object containing the `farm ID` to check for `free public IPs`.
   * @returns {Promise<boolean>} A promise that resolves to true if the farm has `free public IPs`, otherwise false.
   * @decorators
   * - `@expose`: Exposes the method for external use.
   * - `@validateInput`: Validates the input options.
   */
  @expose
  @validateInput
  async checkFarmHasFreePublicIps(options?: FarmHasFreePublicIPsModel): Promise<boolean> {
    return await this.nodes.checkFarmHasFreePublicIps(options!.farmId);
  }

  /**
   * Retrieves nodes based on the provided `farm ID`.
   *
   * This method internally calls the `filterNodes` method of the `Nodes` class with the specified `farm ID`.
   *
   * @param {NodesByFarmIdModel} options - An object containing the `farm ID` for which to retrieve nodes.
   * @returns {Promise<NodeInfo[]>} A promise that resolves to an array of NodeInfo objects representing the nodes in the specified farm.
   * @decorators
   * - `@expose`: Exposes the method for external use.
   * - `@validateInput`: Validates the input options.
   */
  @expose
  @validateInput
  async getNodesByFarmId(options?: NodesByFarmIdModel): Promise<NodeInfo[]> {
    return await this.nodes.filterNodes({ farmId: options!.farmId });
  }

  /**
   * Retrieves the free resources of a node based on the provided `node ID`.
   *
   * This method internally calls the `getNodeFreeResources` method of the `Nodes` class to fetch the free resources of a node.
   *
   * @param {NodeFreeResourcesModel} options - An object containing the `node ID` for which to retrieve the free resources.
   * @returns {Promise<NodeResources>} A promise that resolves to an object representing the free resources of the node (`cru`, `sru`, `hru`, `mru`, `ipv4u`).
   * @decorators
   * - `@expose`: Exposes the method for external use.
   * - `@validateInput`: Validates the input options.
   */
  @expose
  @validateInput
  async getNodeFreeResources(options?: NodeFreeResourcesModel): Promise<NodeResources> {
    return await this.nodes.getNodeFreeResources(options!.nodeId);
  }

  /**
   * Retrieves the farm ID associated with a given farm name.
   *
   * This method internally calls the `getFarmIdFromFarmName` method of the `Nodes` class to fetch the `farm ID` based on the provided farm name.
   *
   * @param {FarmIdFromFarmNameModel} options - An object containing the farm name for which to retrieve the `farm ID`.
   * @returns {Promise<number>} A promise that resolves to the farm ID associated with the provided farm name.
   * @decorators
   * - `@expose`: Exposes the method for external use.
   * - `@validateInput`: Validates the input options.
   */
  @expose
  @validateInput
  async getFarmIdFromFarmName(options?: FarmIdFromFarmNameModel): Promise<number> {
    return await this.nodes.getFarmIdFromFarmName(options!.farmName);
  }

  /**
   * Checks the storage pool capacity of a node for different disk types.
   *
   * @param options - An object containing the required disk sizes and node ID for capacity pool check.
   * @param options.ssdDisks - An array of SSD disk sizes (in bytes) required for the node.
   * @param options.hddDisks - An array of HDD disk sizes (in bytes) required for the node.
   * @param options.rootfsDisks - An array of disk sizes (in bytes) required for the node's root file system.
   * @param options.nodeId - The ID of the node to be verified.
   * @returns {Promise<boolean>} - True if the node has enough capacity, otherwise false.
   * @throws {Error} - If there is an error in getting the node's information or if the required deployment can't be fitted.
   */
  @expose
  @validateInput
  async checkNodeCapacityPool(options: CapacityPoolCheckModel): Promise<boolean> {
    return await this.nodes.verifyNodeStoragePoolCapacity(
      options.ssdDisks,
      options.hddDisks,
      options.rootfsDisks,
      options.nodeId,
    );
  }

  /**
   * Retrieves the node ID associated with a given contract ID.
   *
   * @param options - An object containing the contract ID to retrieve the node ID for.
   * @param options.contractId - The contract ID for which to retrieve the node ID.
   * @returns {Promise<number>} - The node ID associated with the provided contract ID.
   */
  @expose
  @validateInput
  async getNodeIdFromContractId(options: NodeIdFromContractIdModel): Promise<number> {
    return await this.nodes.getNodeIdFromContractId(options.contractId, this.config.substrateURL);
  }
}

export { Capacity as capacity };
