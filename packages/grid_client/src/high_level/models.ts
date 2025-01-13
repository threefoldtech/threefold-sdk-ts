import { Contract } from "@threefold/tfchain_client";

import { Network } from "../primitives/network";
import { ZNetworkLight } from "../primitives/networklight";
import { Deployment } from "../zos/deployment";

enum Operations {
  deploy = "deploy",
  update = "update",
  delete = "delete",
}

class TwinDeployment {
  constructor(
    public deployment: Deployment,
    public operation: Operations,
    public publicIps: number,
    public nodeId: number,
    public metadata: string,
    public network: Network | null | ZNetworkLight = null,
    public solutionProviderId: number | null = null,
    public returnNetworkContracts = false,
  ) {}
}

class DeploymentResultContracts {
  created: Contract[];
  updated: Contract[];
  deleted: { contractId: number }[];
}

export { TwinDeployment, Operations, DeploymentResultContracts };
