import { GridClientErrors } from "@threefold/types";
import { Addr } from "netaddr";

import { RMB } from "../clients/rmb/client";
import { GridClientConfig } from "../config";
import { events } from "../helpers/events";
import { Operations, TwinDeployment } from "../high_level/models";
import { DeploymentFactory } from "../primitives/deployment";
import { Network } from "../primitives/network";
import { ZNetworkLight } from "../primitives/networklight";
import { Nodes } from "../primitives/nodes";
import { Deployment } from "../zos/deployment";
import { Workload, WorkloadTypes } from "../zos/workload";

class HighLevelBase {
  nodes: Nodes;
  rmb: RMB;

  constructor(public config: GridClientConfig) {
    this.nodes = new Nodes(this.config.graphqlURL, this.config.proxyURL, this.config.rmbClient);
    this.rmb = new RMB(config.rmbClient);
  }

  _filterWorkloads(
    deployment: Deployment,
    names: string[],
    types: WorkloadTypes[] = [
      WorkloadTypes.ip,
      WorkloadTypes.ipv4, // TODO: remove deprecated
      WorkloadTypes.zmachine,
      WorkloadTypes.zmachinelight,
      WorkloadTypes.zmount,
      WorkloadTypes.volume,
      WorkloadTypes.zdb,
      WorkloadTypes.qsfs,
      WorkloadTypes.gatewayfqdnproxy,
      WorkloadTypes.gatewaynameproxy,
      WorkloadTypes.zlogs,
    ],
  ): [Workload[], Workload[]] {
    let deletedMachineWorkloads: Workload[] = [];
    if (names.length === 0) {
      deletedMachineWorkloads = deployment.workloads.filter(
        item => item.type === WorkloadTypes.zmachine || item.type === WorkloadTypes.zmachinelight,
      );
    }

    if (names.length !== 0 && types.includes(WorkloadTypes.zmachine)) {
      const Workloads = deployment.workloads.filter(item => item.type === WorkloadTypes.zmachine);
      for (const workload of Workloads) {
        if (!names.includes(workload.name)) {
          continue;
        }
        for (const mount of workload.data["mounts"]) {
          names.push(mount.name);
        }

        const toRemoveZlogs = deployment.workloads.filter(item => {
          const x = item.type === WorkloadTypes.zlogs;
          const y = (item.data as any)["zmachine"] === workload.name;
          return x && y;
        });

        names.push(...toRemoveZlogs.map(x => x.name));

        names.push(workload.data["network"].public_ip);
        deletedMachineWorkloads.push(workload);
      }
    }

    if (names.length !== 0 && types.includes(WorkloadTypes.zmachinelight)) {
      const Workloads = deployment.workloads.filter(item => item.type === WorkloadTypes.zmachinelight);
      for (const workload of Workloads) {
        if (!names.includes(workload.name)) {
          continue;
        }
        for (const mount of workload.data["mounts"]) {
          names.push(mount.name);
        }

        const toRemoveZlogs = deployment.workloads.filter(item => {
          const x = item.type === WorkloadTypes.zlogs;
          const y = (item.data as any)["zmachine-light"] === workload.name;
          return x && y;
        });

        names.push(...toRemoveZlogs.map(x => x.name));

        names.push(workload.data["network-light"].public_ip);
        deletedMachineWorkloads.push(workload);
      }
    }

    const remainingWorkloads: Workload[] = [];
    for (const workload of deployment.workloads) {
      if (workload.type === WorkloadTypes.network || workload.type === WorkloadTypes.networklight) {
        remainingWorkloads.push(workload);
        continue;
      }
      if (!types.includes(workload.type)) {
        remainingWorkloads.push(workload);
        continue;
      }
      if (names.length !== 0 && !names.includes(workload.name)) {
        remainingWorkloads.push(workload);
      }
    }
    return [remainingWorkloads, deletedMachineWorkloads];
  }

  async _deleteMachineNetwork(
    deployment: Deployment,
    remainingWorkloads: Workload[],
    deletedMachineWorkloads: Workload[],
    node_id: number,
  ): Promise<[TwinDeployment[], Workload[], number[], string[], Network | ZNetworkLight | null]> {
    const twinDeployments: TwinDeployment[] = [];
    const deletedNodes: number[] = [];
    const deletedIps: string[] = [];
    const deploymentFactory = new DeploymentFactory(this.config);
    let network: Network | ZNetworkLight | null = null;
    let deletedIp;
    let contract_id;

    let numberOfIps;
    for (const workload of deletedMachineWorkloads) {
      if (!network) {
        const networkName = workload.data["network"].interfaces[0].network;
        const networkIpRange = Addr(workload.data["network"].interfaces[0].ip).mask(16).toString();
        if (workload.type === WorkloadTypes.zmachinelight) {
          network = new ZNetworkLight(networkName, networkIpRange, this.config);
        } else {
          network = new Network(networkName, networkIpRange, this.config);
        }
        await network.load();
      }
      const machineIp = workload.data["network"].interfaces[0].ip;
      events.emit("logs", `Deleting ip: ${machineIp} from node: ${node_id}, network ${network.name}`);
      deletedIp = network.deleteReservedIp(node_id, machineIp);
      if (remainingWorkloads.length === 0) {
        twinDeployments.push(new TwinDeployment(deployment, Operations.delete, 0, 0, "", network));
      }
      numberOfIps = network.getNodeReservedIps(node_id).length;
      if (numberOfIps !== 0) {
        console.log(`network ${network.name} still has ${numberOfIps} ip(s) reserved`);
        deletedIps.push(deletedIp);
        continue;
      }
      if (network instanceof Network) {
        const hasAccessPoint = network.hasAccessPoint(node_id);
        if (hasAccessPoint && network.nodes.length !== 1) {
          console.log(
            `network ${network.name} still has access point:${hasAccessPoint} and number of nodes ${network.nodes.length}`,
          );
          deletedIps.push(deletedIp);
          continue;
        }
      }
      contract_id = await network.deleteNode(node_id);

      if (contract_id === deployment.contract_id) {
        if (remainingWorkloads.length === 1) {
          twinDeployments.push(new TwinDeployment(deployment, Operations.delete, 0, 0, "", network));
          remainingWorkloads = [];
        } else {
          remainingWorkloads = remainingWorkloads.filter(item => item.name !== network?.name);
          deletedIps.push(deletedIp);
          deletedNodes.push(node_id);
        }
      } else {
        // check that the deployment doesn't have another workloads
        for (let d of network.deployments) {
          d = await deploymentFactory.fromObj(d);
          if (d.contract_id !== contract_id) {
            continue;
          }
          if (d.workloads.length === 1) {
            twinDeployments.push(new TwinDeployment(d, Operations.delete, 0, 0, "", network));
          } else {
            d.workloads = d.workloads.filter(item => item.name !== network?.name);
            twinDeployments.push(new TwinDeployment(d, Operations.update, 0, 0, "", network));
          }
        }
      }
      // in case of the network got more accesspoints on different nodes this won't be valid
      if (
        network instanceof Network &&
        network.nodes.length === 1 &&
        network.getNodeReservedIps(network.nodes[0].node_id).length === 0
      ) {
        const contract_id = await network.deleteNode(network.nodes[0].node_id);
        for (let d of network.deployments) {
          d = await deploymentFactory.fromObj(d);
          if (d.contract_id !== contract_id) {
            continue;
          }
          if (d.workloads.length === 1) {
            twinDeployments.push(new TwinDeployment(d, Operations.delete, 0, 0, "", network));
          } else {
            d.workloads = d.workloads.filter(item => item.name !== network?.name);
            twinDeployments.push(new TwinDeployment(d, Operations.update, 0, 0, "", network));
          }
        }
      }
    }
    return [twinDeployments, remainingWorkloads, deletedNodes, deletedIps, network];
  }

  async _delete(
    deployment: Deployment,
    names: string[],
    types: WorkloadTypes[] = [
      WorkloadTypes.ip,
      WorkloadTypes.ipv4, // TODO: remove deprecated
      WorkloadTypes.zmachine,
      WorkloadTypes.zmachinelight,
      WorkloadTypes.zmount,
      WorkloadTypes.volume,
      WorkloadTypes.zdb,
      WorkloadTypes.qsfs,
      WorkloadTypes.gatewayfqdnproxy,
      WorkloadTypes.gatewaynameproxy,
      WorkloadTypes.zlogs,
    ],
  ): Promise<TwinDeployment[]> {
    if (types.includes(WorkloadTypes.network) || types.includes(WorkloadTypes.networklight)) {
      throw new GridClientErrors.Workloads.WorkloadDeleteError("Network workload can't be deleted.");
    }
    let twinDeployments: TwinDeployment[] = [];
    const node_id = await this.nodes.getNodeIdFromContractId(deployment.contract_id, this.config.substrateURL);
    const deploymentFactory = new DeploymentFactory(this.config);

    const numberOfWorkloads = deployment.workloads.length;
    deployment = await deploymentFactory.fromObj(deployment);
    const filteredWorkloads = this._filterWorkloads(deployment, names, types);
    let remainingWorkloads = filteredWorkloads[0];
    const deletedMachineWorkloads = filteredWorkloads[1];

    if (remainingWorkloads.length === 0 && deletedMachineWorkloads.length === 0) {
      twinDeployments.push(new TwinDeployment(deployment, Operations.delete, 0, 0, ""));
    }
    const [newTwinDeployments, newRemainingWorkloads, deletedNodes, deletedIps, network] =
      await this._deleteMachineNetwork(deployment, remainingWorkloads, deletedMachineWorkloads, node_id);
    twinDeployments = twinDeployments.concat(newTwinDeployments);
    remainingWorkloads = newRemainingWorkloads;
    if (
      network instanceof Network &&
      remainingWorkloads.length !== 0 &&
      remainingWorkloads.length < numberOfWorkloads
    ) {
      for (const deleteNode of deletedNodes) {
        await network!.deleteNode(deleteNode);
      }
      for (const deleteIp of deletedIps) {
        network!.deleteReservedIp(node_id, deleteIp);
      }
      deployment.workloads = remainingWorkloads;
      twinDeployments.push(new TwinDeployment(deployment, Operations.update, 0, 0, "", network!));
    }
    return twinDeployments;
  }
}

export { HighLevelBase };
