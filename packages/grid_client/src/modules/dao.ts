import { DaoProposals, ProposalVotes } from "@threefold/tfchain_client";

import { TFClient } from "../clients/tf-grid/client";
import { GridClientConfig } from "../config";
import { expose } from "../helpers/expose";
import { validateInput } from "../helpers/validator";
import { DaoVoteModel } from "./models";
class Dao {
  client: TFClient;

  /**
   * Represents a class that interacts with the `DAO` using a `TFClient` instance.
   *
   * @param {GridClientConfig} config - The configuration object for initializing the client.
   */
  constructor(public config: GridClientConfig) {
    this.client = config.tfclient;
  }

  /**
   * Asynchronously retrieves data from the `DAO` using the `TFClient` instance.
   *
   * @returns {Promise<Proposals>} A promise that resolves with the data retrieved from the `DAO`.
   * @decorators
   * - `@expose`: Exposes the method for external use.
   * - `@validateInput`: Validates the input options.
   */
  @expose
  @validateInput
  async get(): Promise<DaoProposals> {
    return await this.client.dao.get();
  }

  /**
   * Asynchronously submits a vote to the `DAO` using the provided options.
   *
   * @param {DaoVoteModel} options - The options for casting the vote, including `address`, `farmId`, `approval status`, and `hash`.
   * @returns {Promise<any>} A promise that resolves with the result of the vote submission.
   * @decorators
   * - `@expose`: Exposes the method for external use.
   * - `@validateInput`: Validates the input options.
   */
  @expose
  @validateInput
  async vote(options: DaoVoteModel): Promise<any> {
    return (await this.client.dao.vote(options)).apply();
  }

  /**
   * Asynchronously retrieves votes of specific proposal from the `DAO` using the `TFClient` instance.
   *
   * @returns {Promise<ProposalVotes>} A promise that resolves with the data retrieved from the `DAO`.
   * @decorators
   * - `@expose`: Exposes the method for external use.
   */
  @expose
  async getProposalVotes(hash: string): Promise<ProposalVotes> {
    return await this.client.dao.getVotesOfProposal(hash);
  }
}
export { Dao as dao };
