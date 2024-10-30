import moment from "moment";

import { Client, QueryClient } from "./client";
import { ExtrinsicResult } from "./types";
import { checkConnection, requireCouncil } from "./utils";
export interface DaoProposalDetails {
  threshold: number;
  ayes: AyesAndNayes[];
  nayes: AyesAndNayes[];
  vetos: number;
  end: moment.Moment;
  hash: string;
  action: string;
  description: string;
  link: string;
  ayesProgress: number;
  nayesProgress: number;
}
interface AyesAndNayes {
  farmId: number;
  weight: number;
}
interface DaoProposalRemark {
  args: { remark: string };
}
interface DaoProposalInfo {
  description: string;
  link: string;
}
interface DaoProposalVotes {
  ayes: AyesAndNayes[];
  nays: AyesAndNayes[];
  threshold: number;
  vetos: number;
  end: number;
}
export interface DaoProposals {
  active: DaoProposalDetails[];
  inactive: DaoProposalDetails[];
}
export interface DaoVoteOptions {
  farmId: number;
  hash: string;
  approve: boolean;
}

export interface DaoCloseOptions {
  hash: string;
  index: number;
}

export interface ProposalVotes {
  ayes: AyesAndNayes[];
  nays: AyesAndNayes[];
  ayesProgress: number;
  nayesProgress: number;
}

class QueryDao {
  constructor(public client: QueryClient) {
    this.client = client;
  }

  @checkConnection
  async get(): Promise<DaoProposals> {
    const hashesJson = await this.client.api.query.dao.proposalList();
    const hashes = hashesJson.toPrimitive() as string[];
    const activeProposals: DaoProposalDetails[] = [];
    const inactiveProposals: DaoProposalDetails[] = [];
    for await (const hash of hashes) {
      const daoProposal = await this.getDaoProposal(hash);
      const proposal = await this.getProposal(hash);
      const proposalVotes = await this.getProposalVotes(hash);

      const nowBlock: number = +(await this.client.api.query.system.number());
      const timeUntilEnd = (proposalVotes.end - nowBlock) * 6;
      if (proposal && daoProposal) {
        if (proposalVotes.end < nowBlock) {
          inactiveProposals.push({
            threshold: proposalVotes.threshold,
            ayes: proposalVotes.ayes, //[{farmId: number, weight: number}]
            nayes: proposalVotes.nays,
            vetos: proposalVotes.vetos,
            end: moment().add(timeUntilEnd, "second"),
            hash: hash,
            action: proposal.args.remark,
            description: daoProposal.description,
            link: daoProposal.link,
            ayesProgress: this.getProgress(proposalVotes.ayes, proposalVotes.nays, true),
            nayesProgress: this.getProgress(proposalVotes.ayes, proposalVotes.nays, false),
          });
        } else {
          activeProposals.push({
            threshold: proposalVotes.threshold,
            ayes: proposalVotes.ayes, //[{farmId: number, weight: number}]
            nayes: proposalVotes.nays,
            vetos: proposalVotes.vetos,
            end: moment().add(timeUntilEnd, "second"),
            hash: hash,
            action: proposal.args.remark,
            description: daoProposal.description,
            link: daoProposal.link,
            ayesProgress: this.getProgress(proposalVotes.ayes, proposalVotes.nays, true),
            nayesProgress: this.getProgress(proposalVotes.ayes, proposalVotes.nays, false),
          });
        }
      }
    }
    return { active: activeProposals, inactive: inactiveProposals };
  }
  @checkConnection
  async getVotesOfProposal(hash: string): Promise<ProposalVotes> {
    const { ayes, nays }: DaoProposalVotes = await this.getProposalVotes(hash);
    const ayesProgress = this.getProgress(ayes, nays, true);
    const nayesProgress = this.getProgress(ayes, nays, false);

    const proposal: ProposalVotes = {
      ayes,
      nays,
      ayesProgress,
      nayesProgress,
    };

    return proposal;
  }
  private getVotesWithWeights(votes: AyesAndNayes[]): number {
    return votes.reduce((total: number, vote: AyesAndNayes) => {
      return total + vote.weight;
    }, 0);
  }
  private getProgress(ayes: AyesAndNayes[], nayes: AyesAndNayes[], typeAye: boolean): number {
    const totalAyeWeight = ayes ? this.getVotesWithWeights(ayes) : 0;
    const totalNayeWeight = nayes ? this.getVotesWithWeights(nayes) : 0;
    const total = totalAyeWeight + totalNayeWeight;
    if (total > 0) {
      if (typeAye) {
        return (totalAyeWeight / total) * 100;
      }
      return (totalNayeWeight / total) * 100;
    }
    return 0;
  }
  @checkConnection
  private async getDaoProposal(hash: string): Promise<DaoProposalInfo> {
    const proposalJson = await this.client.api.query.dao.proposals(hash);
    const proposal: DaoProposalInfo = proposalJson.toPrimitive() as unknown as DaoProposalInfo;
    return proposal;
  }

  @checkConnection
  private async getProposal(hash: string): Promise<DaoProposalRemark | undefined> {
    try {
      const proposalJson = await this.client.api.query.dao.proposalOf(hash);
      const proposalRemark: DaoProposalRemark = proposalJson.toPrimitive() as unknown as DaoProposalRemark;
      return proposalRemark;
    } catch (error) {
      console.warn("Couldn't decode a proposal");
    }
  }
  @checkConnection
  private async getProposalVotes(hash: string): Promise<DaoProposalVotes> {
    const votesJson = await this.client.api.query.dao.voting(hash);
    const proposalVotes: DaoProposalVotes = votesJson.toPrimitive() as unknown as DaoProposalVotes;
    return proposalVotes;
  }
}

export interface DaoProposeOptions<T> {
  proposal: ExtrinsicResult<T>;
  threshold: number;
  description: string;
  link: string;
  duration: number | null;
}

export interface DaoProposal {
  address: string;
  index: number;
  hash: string;
  threshold: number;
}

class Dao extends QueryDao {
  constructor(public client: Client) {
    super(client);
    this.client = client;
  }

  /**
   * Create a new dao proposal extrinsic.
   *
   * @param options - The options for creating a new proposal.
   * @param options.proposal - The proposed extrinsic call.
   * @param options.threshold - The minimum number of the farmers to vote on the proposal.
   * @param options.description - The proposal description.
   * @param options.link - The link to the proposal details.
   * @param options.duration - The duration for allowing the farmers to vote on the proposal.
   * @returns A promise that resolves to the created proposal extrinsic.
   */
  @checkConnection
  @requireCouncil
  async propose<T>(options: DaoProposeOptions<T>) {
    const extrinsic = await this.client.api.tx.dao.propose(
      options.threshold,
      options.proposal,
      options.description,
      options.link,
      options.duration,
    );
    return this.client.patchExtrinsic(extrinsic, {
      map: res => {
        const result: DaoProposal = {
          address: res?.[0],
          index: res?.[1],
          hash: res?.[2],
          threshold: res?.[3],
        };
        return result;
      },
    });
  }

  /**
   * Create a vote extrinsic on a dao proposal.
   *
   * @param options - The options for voting on a proposal.
   * @param options.hash - The proposal hash to vote on.
   * @param options.farmId - The farm id to vote on the proposal. This farm should has at least one node.
   * @param options.approve - A boolean to vote (with yes or no) on the proposal.
   * @returns A promise that resolves to an extrinsic for voting on a dao proposal.
   */
  @checkConnection
  async vote(options: DaoVoteOptions) {
    const extrinsic = this.client.api.tx.dao.vote(options.farmId, options.hash, options.approve);
    return this.client.patchExtrinsic(extrinsic);
  }

  /**
   * Create a close dao proposal extrinsic.
   *
   * @param options - The options for closing a proposal.
   * @param options.hash - The proposal hash to be closed.
   * @param options.index - The proposal index to be closed.
   * @returns A promise that resolves to an extrinsic for closing a dao proposal.
   */
  @checkConnection
  @requireCouncil
  async close(options: DaoCloseOptions) {
    const extrinsic = this.client.api.tx.dao.close(options.hash, options.index);
    return this.client.patchExtrinsic(extrinsic);
  }
}
export { Dao, QueryDao };
