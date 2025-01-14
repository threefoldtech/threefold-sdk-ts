import type { Pagination } from "../builders/abstract_builder";
import { CertificationType, FarmsBuilder, FarmsQuery } from "../builders/public_api";
import { resolvePaginator } from "../utils";
import { AbstractClient } from "./abstract_client";

export interface PublicIp {
  id: string;
  ip: string;
  farm_id: string;
  contract_id: number;
  gateway: string;
}

export interface Farm {
  name: string;
  farmId: number;
  twinId: number;
  pricingPolicyId: number;
  certificationType: CertificationType;
  stellarAddress: string;
  dedicated: boolean;
  publicIps: PublicIp[];
}

export class FarmsClient extends AbstractClient<FarmsBuilder, FarmsQuery> {
  constructor(uri: string) {
    super({
      uri,
      Builder: FarmsBuilder,
    });
  }

  public async list(queries: Partial<FarmsQuery> = {}) {
    const res = await this.builder(queries).build("/farms");
    return resolvePaginator<Farm[]>(res);
  }

  public async listAll(queries: Partial<FarmsQuery> = {}) {
    const { count } = await this.list({
      ...queries,
      size: 50,
      page: 1,
      retCount: true,
    });
    const promises: Promise<Pagination<Farm[]>>[] = [];
    const pages = Math.ceil(count! / 50);
    for (let i = 0; i < pages; i++) {
      promises.push(this.list({ ...queries, size: 50, page: i + 1 }));
    }
    const farms = await Promise.all(promises);
    return farms.map(node => node.data).flat(1);
  }
}
