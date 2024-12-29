import { CertificationType, GatewayBuilder, GatewaysQuery, NodeStatus } from "../builders/public_api";
import { assertId, resolvePaginator } from "../utils";
import { AbstractClient } from "./abstract_client";
import type { Farm } from "./farms";
import type { Twin } from "./twins";

export interface Resources {
  cru: number;
  sru: number;
  hru: number;
  mru: number;
}
export interface Location {
  country: string;
  city: string;
  longitude: number;
  latitude: number;
}
export interface PublicConfig {
  domain: string;
  gw4: string;
  gw6: string;
  ipv4: string;
  ipv6: string;
}

export interface PublicIps {
  total: number;
  used: number;
  free: number;
}

export interface NodeStats {
  system: Resources & { ipv4u: number };
  total: Resources & { ipv4u: number };
  used: Resources & { ipv4u: number };
  users: {
    deployments: number;
    workloads: number;
    last_deployment_timestamp: number;
  };
}

export interface GPUCard {
  id: string;
  vendor: string;
  device: string;
  contract: number;
  updated_at: number;
}

export interface DMI {
  bios: {
    vendor: string;
    version: string;
  };
  baseboard: {
    manufacturer: string;
    product_name: string;
  };
  processor: [
    {
      version: string;
      thread_count: string;
    },
  ];
  memory: [
    {
      manufacturer: string;
      type: string;
    },
  ];
}

export interface GridNode {
  id: string;
  nodeId: number;
  farmId: number;
  farmName: string;
  twinId: number;
  country: string;
  region: string;
  gridVersion: number;
  city: string;
  uptime: number;
  created: number;
  farmingPolicyId: number;
  updatedAt: number;
  total_resources: Resources;
  used_resources: Resources;
  location: Location;
  publicConfig: PublicConfig;
  status: NodeStatus;
  certificationType: CertificationType;
  dedicated: boolean;
  rentContractId: number;
  rentedByTwinId: number;
  farm: Farm;
  publicIps: PublicIps;
  twin: Twin;
  stats: NodeStats;
  num_gpu: number;
  healthy: boolean;
  rentable: boolean;
  rented: boolean;
  dmi: DMI;
  speed: {
    upload: number;
    download: number;
  };
  price_usd: number;
  extraFee: number;
  gpus: GPUCard[];
}

export class GatewaysClient extends AbstractClient<GatewayBuilder, GatewaysQuery> {
  constructor(uri: string) {
    super({
      uri,
      Builder: GatewayBuilder,
    });
  }

  public async list(queries: Partial<GatewaysQuery> = {}) {
    const res = await this.builder(queries).build("/gateways");
    return resolvePaginator<GridNode[]>(res);
  }

  public async byId(nodeId: number): Promise<GridNode> {
    assertId(nodeId);
    const res = await this.builder({}).build(`/gateways/${nodeId}`);
    return res.json();
  }
}
