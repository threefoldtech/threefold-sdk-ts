import { ContractsBuilder, ContractsQuery, ContractState, ContractType } from "../builders/public_api";
import { resolvePaginator } from "../utils";
import { AbstractClient } from "./abstract_client";

export interface ContractDetails {
  nodeId: number;
  deployment_data?: string;
  deployment_hash?: string;
  number_of_public_ips?: number;
}

export interface Contract {
  contract_id: number;
  twin_id: number;
  state: ContractState;
  created_at: number;
  type: ContractType;
  details: ContractDetails;
}

export class ContractsClient extends AbstractClient<ContractsBuilder, ContractsQuery> {
  constructor(uri: string) {
    super({
      uri,
      Builder: ContractsBuilder,
    });
  }

  public async list(queries: Partial<ContractsQuery> = {}) {
    const res = await this.builder(queries).build("/contracts");
    return resolvePaginator<Contract[]>(res);
  }
}
