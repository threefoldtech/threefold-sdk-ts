import { ValidationError } from "@threefold/types";

import { Client, QueryClient } from "./client";
import { checkConnection } from "./utils";

export interface SetPowerOptions {
  nodeId: number;
  power: boolean;
}

export interface Node {
  id: number;
  farmId: number;
  twinId: number;
  resources: NodeResources;
  location: NodeLocation;
  publicConfig: PublicConfig;
  created: number;
  farmingPolicyId: number;
  interfaces: NetworkInterfaceType[];
  certification: string;
  secureBoot: boolean;
  virtualized: boolean;
  serialNumber: string;
  connectionPrice: number;
}

interface NetworkInterfaceType {
  name: string;
  mac: string;
  ips: string[];
}

interface IPConfigInterface {
  ip: string;
  gw: string;
}
export interface PublicConfig {
  ip4: IPConfigInterface;
  ip6: IPConfigInterface;
  domain: string;
}

export interface NodeResources {
  hru: number;
  sru: number;
  cru: number;
  mru: number;
}

interface NodeLocation {
  city: string;
  country: string;
  latitude: number;
  longitude: number;
}

interface NodePublicConfigOptions {
  farmId: number;
  nodeId: number;
  publicConfig?: {
    ip4: {
      ip: string;
      gw: string;
    };
    ip6?: {
      ip: string;
      gw: string;
    } | null;
    domain?: string | null;
  } | null;
}
export interface QueryNodesGetOptions {
  id: number;
}

class QueryNodes {
  constructor(public client: QueryClient) {
    this.client = client;
  }

  @checkConnection
  async get(options: QueryNodesGetOptions): Promise<Node> {
    if (isNaN(options.id) || options.id <= 0) {
      throw new ValidationError("Invalid node id. Node id must be positive integer");
    }
    const res = await this.client.api.query.tfgridModule.nodes(options.id);
    return res.toPrimitive() as unknown as Node;
  }
}

class Nodes extends QueryNodes {
  constructor(public client: Client) {
    super(client);
  }

  @checkConnection
  async setPower(options: SetPowerOptions) {
    const powerTarget = options.power ? "Up" : "Down";

    const extrinsic = await this.client.api.tx.tfgridModule.changePowerTarget(options.nodeId, powerTarget);
    return this.client.patchExtrinsic<void>(extrinsic);
  }

  @checkConnection
  async addNodePublicConfig(options: NodePublicConfigOptions) {
    const extrinsic = this.client.api.tx.tfgridModule.addNodePublicConfig(
      options.farmId,
      options.nodeId,
      options.publicConfig,
    );
    return this.client.patchExtrinsic<void>(extrinsic);
  }
}

export { Nodes, QueryNodes };
