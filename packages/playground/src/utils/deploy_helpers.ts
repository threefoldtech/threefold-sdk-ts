import { NetworkModel, type ZmachineData } from "@threefold/grid_client";

import { ProjectName } from "@/types";

import { generateName } from "./strings";

export function createNetwork(network: Network = {}): NetworkModel {
  const nw = new NetworkModel();
  nw.name = network.name || generateName({ prefix: "nw" });
  nw.ip_range = network.ipRange || "10.20.0.0/16";
  nw.addAccess = network.addAccess || false;
  nw.accessNodeId = network.accessNodeId;
  return nw;
}

export const mergeCaproverDeployments = (clusters: ZmachineData[][]) => {
  const vms: ZmachineData[] = [];

  for (const cluster of clusters) {
    let clusterLeader = null;
    const clusterWorkers: any[] = [];

    if (!Array.isArray(cluster)) {
      vms.push(cluster);
      continue;
    }

    for (const vm of cluster) {
      const isCaprover = String((vm as any).projectName)
        .toLowerCase()
        .includes(ProjectName.Caprover.toLowerCase());
      if (!isCaprover) {
        if (!vms.includes(vm)) {
          vms.push(vm);
        }
        continue;
      }

      if (vm.env["SWM_NODE_MODE"] === "leader") {
        clusterLeader = vm;
      } else if (vm.env["SWM_NODE_MODE"] === "worker") {
        clusterWorkers.push(vm);
      }

      if (clusterLeader) {
        (clusterLeader as any).workers = clusterWorkers;
        if (!vms.includes(clusterLeader)) {
          vms.push(clusterLeader);
        }
      }
    }
  }

  return vms;
};

export interface Network {
  name?: string;
  ipRange?: string;
  addAccess?: boolean;
  accessNodeId?: number;
}
