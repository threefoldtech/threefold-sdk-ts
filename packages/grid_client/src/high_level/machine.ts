import { GridClientErrors, ValidationError } from "@threefold/types";
import { Addr } from "netaddr";

import { events } from "../helpers/events";
import { calculateRootFileSystem } from "../helpers/root_fs";
import { randomChoice, zeroPadding } from "../helpers/utils";
import { validateHexSeed } from "../helpers/validator";
import { DiskModel, MyceliumNetworkModel, QSFSDiskModel } from "../modules/models";
import { qsfs_zdbs } from "../modules/qsfs_zdbs";
import {
  DeploymentFactory,
  DiskPrimitive,
  Network,
  Nodes,
  PublicIPPrimitive,
  VMLightPrimitive,
  VMPrimitive,
  ZlogsPrimitive,
} from "../primitives/index";
import { ZNetworkLight } from "../primitives/networklight";
import { QSFSPrimitive } from "../primitives/qsfs";
import { Mount, ZdbGroup } from "../zos";
import { Deployment } from "../zos/deployment";
import { Workload, WorkloadTypes } from "../zos/workload";
import { HighLevelBase } from "./base";
import { Operations, TwinDeployment } from "./models";

class VMHL extends HighLevelBase {
  async create(
    name: string,
    nodeId: number,
    flist: string,
    cpu: number,
    memory: number,
    rootfs_size: number,
    disks: DiskModel[],
    publicIp: boolean,
    publicIp6: boolean,
    planetary: boolean,
    mycelium: boolean,
    myceliumSeed: string,
    network: Network | ZNetworkLight,
    myceliumNetworkSeeds: MyceliumNetworkModel[] = [],
    entrypoint: string,
    env: Record<string, unknown>,
    contractMetadata: string,
    metadata = "",
    description = "",
    qsfsDisks: QSFSDiskModel[] = [],
    qsfsProjectName = "",
    addAccess = false,
    accessNodeId = 0,
    ip = "",
    corex = false,
    solutionProviderId: number,
    zlogsOutput?: string,
    gpus: string[] = [],
  ): Promise<[TwinDeployment[], string]> {
    if (!rootfs_size) {
      rootfs_size = calculateRootFileSystem({
        CPUCores: cpu,
        RAMInMegaBytes: memory,
      });
    }
    const nodeInfo = await this.nodes.getNode(nodeId);
    // Checks if the node is a zos4 node
    const isZOS4 = nodeInfo.features.some(item => item.includes("zmachine-light") || item.includes("network-light"));
    const deployments: TwinDeployment[] = [];
    const workloads: Workload[] = [];
    let totalDisksSize = rootfs_size;

    // disks
    const diskMounts: Mount[] = [];
    const disk = new DiskPrimitive();
    for (const d of disks) {
      totalDisksSize += d.size;
      workloads.push(disk.create(d.size, d.name, "", description));
      diskMounts.push(disk.createMount(d.name, d.mountpoint));
    }

    if (!(await this.nodes.nodeHasResources(nodeId, { sru: totalDisksSize, mru: memory / 1024 }))) {
      throw new GridClientErrors.Nodes.InvalidResourcesError(
        `Node ${nodeId} doesn't have enough resources: sru=${totalDisksSize}, mru=${memory / 1024} .`,
      );
    }

    const twinId = this.config.twinId;
    if (!(await this.nodes.nodeAvailableForTwinId(nodeId, twinId))) {
      throw new GridClientErrors.Nodes.UnavailableNodeError(
        `Node ${nodeId} is not available for user with twinId: ${twinId}, maybe it's rented by another user or node is dedicated. use capacity planning with availableFor option.`,
      );
    } else {
      // If Available for twinId (dedicated), check it's not in grace period
      if (nodeInfo.rentContractId !== 0) {
        const contract = await this.config.tfclient.contracts.get({ id: nodeInfo.rentContractId });
        if (contract && contract.state.gracePeriod) {
          throw new GridClientErrors.Nodes.UnavailableNodeError(
            `Can't deploy on node: ${nodeId}, its rent contract in grace period.`,
          );
        }
      }
    }

    // qsfs disks
    const qsfsPrimitive = new QSFSPrimitive();
    for (const d of qsfsDisks) {
      // the ratio that will be used for minimal_shards to expected_shards is 3/5
      const qsfsZdbsModule = new qsfs_zdbs(this.config);
      if (qsfsProjectName) {
        qsfsZdbsModule.config.projectName = qsfsProjectName;
      }
      const qsfsZdbs = await qsfsZdbsModule.getZdbs(d.qsfs_zdbs_name);
      if (qsfsZdbs.groups.length === 0 || qsfsZdbs.meta.length === 0) {
        throw new ValidationError(
          `Couldn't find a qsfs zdbs with name ${d.qsfs_zdbs_name}. Please create one with qsfs_zdbs module.`,
        );
      }
      let minimalShards = Math.ceil((qsfsZdbs.groups.length * 3) / 5);
      let expectedShards = qsfsZdbs.groups.length;
      if (d.minimal_shards) {
        minimalShards = d.minimal_shards;
        if (minimalShards >= qsfsZdbs.groups.length) {
          throw new ValidationError("Minimal shards can't be more than the number of zdbs in qsfs_zdbs deployment.");
        }
      }
      if (d.expected_shards) {
        expectedShards = d.expected_shards;
        if (expectedShards > qsfsZdbs.groups.length) {
          throw new ValidationError("Expected shards can't be more than the number of zdbs in qsfs_zdbs deployment.");
        }
      }
      const groups = new ZdbGroup();
      groups.backends = qsfsZdbs.groups;
      const qsfsWorkload = qsfsPrimitive.create(
        d.name,
        minimalShards,
        expectedShards,
        d.prefix,
        qsfsZdbs.meta,
        [groups],
        d.encryption_key,
        d.cache,
        32,
        "zdb",
        0,
        0,
        "AES",
        "snappy",
        JSON.stringify({ qsfs_zdbs_name: d.qsfs_zdbs_name, qsfs_size: groups.backends[0]["size"] }),
      );
      workloads.push(qsfsWorkload);
      diskMounts.push(disk.createMount(d.name, d.mountpoint));
    }

    // ipv4
    // Reject the deployment if the node is a zos4 node, as it doesn't support ipv4.
    let ipName = "";
    let publicIps = 0;
    if (publicIp || publicIp6) {
      if (isZOS4) {
        throw new GridClientErrors.Farms.InvalidResourcesError(`Zmachine Light doesn't support public ips.`);
      }
      const ip = new PublicIPPrimitive();
      ipName = `${name}_pubip`;
      workloads.push(ip.create(ipName, "", description, 0, publicIp, publicIp6));
      if (publicIp) {
        const node = await this.nodes.getNode(nodeId);
        const _farm = await this.config.tfclient.farms.get({ id: node.farmId });
        const freeIps = _farm.publicIps.filter(res => res.contractId === 0).length;
        if (freeIps < 1) {
          throw new GridClientErrors.Farms.InvalidResourcesError(
            `Farm ${_farm.id} doesn't have enough public IPs: requested IPs=1 for machine with name: ${name},
            , available IPs=${freeIps}.`,
          );
        }
        publicIps++;
      }
    }
    if (gpus && gpus.length > 0) {
      const nodeTwinId = await this.nodes.getNodeTwinId(nodeId);
      const gpuList = await this.rmb.request([nodeTwinId], "zos.gpu.list", "");
      if (gpuList.length <= 0) {
        throw new GridClientErrors.Nodes.InvalidResourcesError(`The selected node ${nodeId} doesn't have GPU card.`);
      }
      for (const g of gpus) {
        const found = gpuList.filter(item => item.id === g);
        if (found.length === 0) {
          throw new GridClientErrors.Nodes.GPUNotFoundError(
            `Couldn't find the GPU with id: "${g}" in node: ${nodeId}.`,
          );
        }
        if (found[0].contract !== 0) {
          throw new GridClientErrors.Nodes.GPULockedError(
            `This GPU: "${g}" is currently in use by another VM with contract id: ${found[0].contract}.`,
          );
        }
      }

      const node = await this.nodes.getNode(nodeId);
      if (node.rentedByTwinId !== this.config.twinId) {
        throw new GridClientErrors.Nodes.UnavailableNodeError(`This node ${nodeId} is not rented by the current user.`);
      }
    }

    // validate user ip subnet in case of no networks already
    let userIPsubnet;
    let accessNodeSubnet;
    if (ip) {
      userIPsubnet = network.ValidateFreeSubnet(Addr(ip).mask(24).toString());

      // If the node is not a zos4 node get accessNodeSubnet
      if (!isZOS4) {
        accessNodeSubnet = network.getFreeSubnet();
      }
    }
    // Set networkContractMetadata based on node's zos version
    let networkContractMetadata;
    if (!isZOS4) {
      networkContractMetadata = JSON.stringify({
        version: 3,
        type: "network",
        name: network.name,
        projectName: this.config.projectName,
      });
    } else {
      networkContractMetadata = JSON.stringify({
        version: 4,
        type: "network-light",
        name: network.name,
        projectName: this.config.projectName,
      });
    }

    const deploymentFactory = new DeploymentFactory(this.config);

    let access_net_workload;
    let wgConfig = "";
    let hasAccessNode = false;
    let accessNodes: Record<string, unknown> = {};
    if (!isZOS4 && network instanceof Network) {
      if (addAccess) {
        accessNodes = await this.nodes.getAccessNodes(this.config.twinId);
        for (const accessNode of Object.keys(accessNodes)) {
          if (network.nodeExists(Number(accessNode))) {
            hasAccessNode = true;
            break;
          }
        }
      }
      if (
        (!Object.keys(accessNodes).includes(nodeId.toString()) || nodeId !== accessNodeId) &&
        !hasAccessNode &&
        addAccess &&
        !isZOS4
      ) {
        const filteredAccessNodes: number[] = [];
        for (const accessNodeId of Object.keys(accessNodes)) {
          if (accessNodes[accessNodeId]["ipv4"]) {
            filteredAccessNodes.push(+accessNodeId);
          }
        }
        let access_node_id = randomChoice(filteredAccessNodes);
        if (accessNodeId) {
          if (!filteredAccessNodes.includes(accessNodeId))
            throw new GridClientErrors.Nodes.AccessNodeError(
              `Node ${accessNodeId} is not an access node or maybe it's down.`,
            );

          access_node_id = accessNodeId;
        }
        access_net_workload = await network.addNode(
          access_node_id,
          mycelium,
          description,
          accessNodeSubnet,
          myceliumNetworkSeeds,
        );
        wgConfig = await network.addAccess(access_node_id, true);
      }
    }
    // If node exits on network check if mycelium needs to be added or not
    if (network.nodeExists(nodeId)) {
      const deployment = await network.checkMycelium(nodeId, mycelium, myceliumNetworkSeeds);
      if (deployment) {
        deployments.push(new TwinDeployment(deployment, Operations.update, 0, 0, networkContractMetadata, network));
      }
    }

    const znet_workload = await network.addNode(nodeId, mycelium, description, userIPsubnet, myceliumNetworkSeeds);
    if (network instanceof Network && (await network.exists()) && (znet_workload || access_net_workload)) {
      // update network
      for (const deployment of network.deployments) {
        const d = await deploymentFactory.fromObj(deployment);
        for (const workload of d["workloads"]) {
          if (
            workload.type !== WorkloadTypes.network ||
            !Addr(network.ipRange).contains(Addr(workload.data["subnet"]))
          ) {
            continue;
          }

          workload.data = network.getUpdatedNetwork(workload["data"]);
          workload.version += 1;
          break;
        }
        deployments.push(new TwinDeployment(d, Operations.update, 0, 0, networkContractMetadata, network));
      }
      if (znet_workload) {
        const deployment = deploymentFactory.create([znet_workload], 0, networkContractMetadata, description, 0);
        deployments.push(
          new TwinDeployment(
            deployment,
            Operations.deploy,
            0,
            nodeId,
            networkContractMetadata,
            network,
            solutionProviderId,
          ),
        );
      }
    } else if (znet_workload) {
      // node not exist on the network

      if (!access_net_workload && !hasAccessNode && addAccess && network instanceof Network) {
        // this node is access node, so add access point on it
        wgConfig = await network.addAccess(nodeId, true);
        znet_workload["data"] = network.getUpdatedNetwork(znet_workload.data);
      }
      const deployment = deploymentFactory.create([znet_workload], 0, networkContractMetadata, description, 0);
      deployments.push(
        new TwinDeployment(
          deployment,
          Operations.deploy,
          0,
          nodeId,
          networkContractMetadata,
          network,
          solutionProviderId,
        ),
      );
    }
    if (access_net_workload && !isZOS4) {
      // network is not exist, and the node provide is not an access node
      const accessNodeId = access_net_workload.data["node_id"];
      access_net_workload["data"] = network.getUpdatedNetwork(access_net_workload.data);
      const deployment = deploymentFactory.create([access_net_workload], 0, networkContractMetadata, description, 0);
      deployments.push(
        new TwinDeployment(
          deployment,
          Operations.deploy,
          0,
          accessNodeId,
          networkContractMetadata,
          network,
          solutionProviderId,
        ),
      );
    }

    // vm
    // Initalize vm based on node's zos version
    let vm;
    if (!isZOS4) {
      vm = new VMPrimitive();
    } else {
      vm = new VMLightPrimitive();
    }
    let machine_ip;
    if (ip !== "") {
      machine_ip = network.validateUserIP(nodeId, ip);
    } else {
      machine_ip = network.getFreeIP(nodeId);
    }

    // Validate mycelium seed If provided, if not generate it.
    if (mycelium) {
      // Split machine_ip to get last 2 numbers to be used in mycelium hex seed
      const parts = machine_ip.split("/");
      const ipPart = parts[0];
      const ipNumbers = ipPart.split(".").map(part => parseInt(part, 10));
      const lastTwoNumbers = ipNumbers.slice(-2);

      if (myceliumSeed) {
        validateHexSeed(myceliumSeed, 6);
      } else {
        myceliumSeed = zeroPadding(6, lastTwoNumbers[0]) + zeroPadding(6, lastTwoNumbers[1]);
      }
    }

    events.emit("logs", `Creating a vm on node: ${nodeId}, network: ${network.name} with private ip: ${machine_ip}`);
    workloads.push(
      vm.create(
        name,
        flist,
        cpu,
        memory,
        rootfs_size,
        diskMounts,
        network.name,
        machine_ip,
        planetary,
        mycelium,
        myceliumSeed,
        ipName,
        entrypoint,
        env,
        "",
        description,
        0,
        corex,
        gpus,
      ),
    );

    if (zlogsOutput) {
      const zlogs = new ZlogsPrimitive();
      workloads.push(zlogs.create(name, zlogsOutput, "", description));
    }

    // deployment
    // NOTE: expiration is not used for zos deployment
    const deployment = deploymentFactory.create(workloads, 0, metadata, description, 0);

    deployments.push(
      new TwinDeployment(
        deployment,
        Operations.deploy,
        publicIps,
        nodeId,
        contractMetadata,
        network,
        solutionProviderId,
      ),
    );
    return [deployments, wgConfig];
  }

  async delete(deployment: Deployment, names: string[]) {
    return await this._delete(deployment, names, [
      WorkloadTypes.ip,
      WorkloadTypes.ipv4, // TODO: remove deprecated
      WorkloadTypes.zmount,
      WorkloadTypes.volume,
      WorkloadTypes.zmachine,
      WorkloadTypes.qsfs,
      WorkloadTypes.zlogs,
      WorkloadTypes.zmachinelight,
    ]);
  }
}

export { VMHL };
