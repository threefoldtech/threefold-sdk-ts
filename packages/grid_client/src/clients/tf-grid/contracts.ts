import GridProxyClient, {
  CertificationType,
  Contract,
  ContractsQuery,
  ContractState,
  ContractType,
} from "@threefold/gridproxy_client";
import {
  BillingInformation,
  ContractLock,
  ContractLockOptions,
  ContractPaymentState,
  Contracts,
  ExtrinsicResult,
  GetDedicatedNodePriceOptions,
  NodeContractUsedResources,
  SetDedicatedNodeExtraFeesOptions,
} from "@threefold/tfchain_client";
import { GridClientError } from "@threefold/types";
import { Decimal } from "decimal.js";

import { bytesToGB, formatErrorMessage } from "../../helpers";
import { calculator, ContractStates, currency } from "../../modules";
import { Graphql } from "../graphql/client";

export type DiscountLevel = "None" | "Default" | "Bronze" | "Silver" | "Gold";

export interface ListContractByTwinIdOptions {
  graphqlURL: string;
  twinId: number;
  stateList?: ContractStates[];
  type?: string;
  projectName?: string;
  nodeId?: number;
}

export interface ContractUsedResources {
  contract: GqlNodeContract;
  hru: number;
  sru: number;
  cru: number;
  mru: number;
}

export interface GqlBaseContract {
  id: string;
  gridVersion: string;
  contractID: string;
  twinID: string;
  state: string;
  createdAt: string;
  updatedAt: string;
  solutionProviderID: string;
}

export interface GqlNameContract extends GqlBaseContract {
  name: string;
}

export interface GqlNodeContract extends GqlBaseContract {
  nodeID: number;
  deploymentData: string;
  deploymentHash: string;
  numberOfPublicIPs: number;
  resourcesUsed: ContractUsedResources | undefined;
  parsedDeploymentData?: { type: string; name: string; projectName: string };
}

export interface GqlRentContract extends GqlBaseContract {
  nodeID: number;
}

export interface GqlContracts {
  nameContracts: GqlNameContract[];
  nodeContracts: GqlNodeContract[];
  rentContracts: GqlRentContract[];
}

export interface GqlConsumption extends GqlContracts {
  contractBillReports: GqlContractBillReports[];
}
export interface GqlDiscountPackage {
  contractBillReports: GqlContractBillReports[];
}

export interface GqlContractBillReports {
  id: string;
  contractID: number;
  discountReceived: DiscountLevel;
  amountBilled: number;
  timestamp: number;
}

export interface ListContractByAddressOptions {
  graphqlURL: string;
  accountId: string;
  stateList?: ContractStates[];
}

export interface ListMyContractOptions {
  graphqlURL: string;
  stateList?: ContractStates[];
  type?: string;
  projectName?: string;
  nodeId?: number;
}

export interface GetConsumptionOptions {
  graphqlURL: string;
  id: number;
}

export interface GetDiscountPackageOptions {
  graphqlURL: string;
  id: number;
}

export interface CancelMyContractOptions {
  graphqlURL: string;
}

export type LockDetails = { [key: number]: ContractLock };
export interface LockContracts {
  nameContracts: LockDetails;
  nodeContracts: LockDetails;
  rentContracts: LockDetails;
  totalAmountLocked: number;
}

export type OverdueDetails = { [key: number]: number };

export interface ContractsOverdue {
  nameContracts: OverdueDetails;
  nodeContracts: OverdueDetails;
  rentContracts: OverdueDetails;
  totalOverdueAmount: number;
}
export interface CalculateOverdueOptions {
  contractInfo: Contract;
  gridProxyClient: GridProxyClient;
}

/**
 * Represents the total cost associated with the provided contracts.
 *
 * @interface TotalContractsCost
 *
 * @property {number} ipsCost - Total cost for the provided amount for ips per mount in USD.
 * @property {Decimal} nuCost - The total unbilled amount of network usage (NU), represented as a Decimal Unit USD.
 * @property {Decimal} overdraft - The overdraft amount, the sum of `additionalOverdraft` and `standardOverdraft` represented as a Decimal as Unit TFT.
 */
interface TotalContractsCost {
  ipsCost: number;
  nuCost: number;
  overdraft: Decimal;
}

const SECONDS_ONE_HOUR = 60 * 60;

const HOURS_ONE_MONTH = 24 * 30;

const TFT_CONVERSION_FACTOR = 10 ** 7;

class TFContracts extends Contracts {
  async listContractsByTwinId(options: ListContractByTwinIdOptions): Promise<GqlContracts> {
    options.stateList = options.stateList || [ContractStates.Created, ContractStates.GracePeriod];
    const state = `[${options.stateList.join(", ")}]`;
    const gqlClient = new Graphql(options.graphqlURL);
    const opts = `(where: {twinID_eq: ${options.twinId}, state_in: ${state}}, orderBy: twinID_ASC)`;
    try {
      const nameContractsCount = await gqlClient.getItemTotalCount("nameContracts", opts);
      const nodeContractsCount = await gqlClient.getItemTotalCount("nodeContracts", opts);
      const rentContractsCount = await gqlClient.getItemTotalCount("rentContracts", opts);
      const body = `query getContracts($nameContractsCount: Int!, $nodeContractsCount: Int!, $rentContractsCount: Int!){
                nameContracts(where: {twinID_eq: ${options.twinId}, state_in: ${state}}, limit: $nameContractsCount) {
                  contractID
                  createdAt
                  name
                  solutionProviderID
                  state
                  twinID
                }
                nodeContracts(where: {twinID_eq: ${options.twinId}, state_in: ${state}}, limit: $nodeContractsCount) {
                  contractID
                  deploymentData
                  state
                  createdAt
                  nodeID
                  numberOfPublicIPs
                }
                rentContracts(where: {twinID_eq: ${options.twinId}, state_in: ${state}}, limit: $rentContractsCount) {
                  contractID
                  createdAt
                  nodeID
                  solutionProviderID
                  state
                  twinID
                }
              }`;
      const response = await gqlClient.query(body, {
        nodeContractsCount: nodeContractsCount,
        nameContractsCount: nameContractsCount,
        rentContractsCount: rentContractsCount,
      });

      return response["data"] as GqlContracts;
    } catch (err) {
      (err as Error).message = formatErrorMessage(`Error listing contracts by twin id ${options.twinId}.`, err);
      throw err;
    }
  }

  async listNodeContractsByTwinId(options: ListContractByTwinIdOptions): Promise<GqlNodeContract[]> {
    options.stateList = options.stateList || [ContractStates.Created, ContractStates.GracePeriod];
    const state = `[${options.stateList.join(", ")}]`;
    const gqlClient = new Graphql(options.graphqlURL);
    const opts = `(where: {twinID_eq: ${options.twinId}, state_in: ${state}}, orderBy: twinID_ASC)`;

    // filter contracts based on deploymentData
    let filterQuery = "";
    if (options.nodeId) {
      filterQuery += ` , nodeID_eq: ${options.nodeId}`;
    }
    if (options.type || options.projectName) {
      filterQuery += " , AND: [";

      if (options.type) {
        // eslint-disable-next-line no-useless-escape
        filterQuery += `{ deploymentData_contains: \"\\\"type\\\":\\\"${options.type}\\\"\" },`;
      }

      if (options.projectName) {
        // eslint-disable-next-line no-useless-escape
        filterQuery += `{ deploymentData_contains: \"\\\"projectName\\\":\\\"${options.projectName}\" }`;
      }

      filterQuery += "]";
    }

    try {
      const nodeContractsCount = await gqlClient.getItemTotalCount("nodeContracts", opts);
      const body = `query getContracts($nodeContractsCount: Int!){
                nodeContracts(where: {twinID_eq: ${options.twinId}, state_in: ${state}${filterQuery}}, limit: $nodeContractsCount) {
                  contractID
                  deploymentData
                  state
                  createdAt
                  nodeID
                  numberOfPublicIPs
                }
              }`;
      const response = await gqlClient.query(body, {
        nodeContractsCount,
      });

      return (response["data"] as GqlContracts).nodeContracts;
    } catch (err) {
      (err as Error).message = formatErrorMessage(`Error listing contracts by twin id ${options.twinId}.`, err);
      throw err;
    }
  }
  /**
   * Get contract discount package
   * @param {GetDiscountPackageOptions} options
   * @returns {Promie<DiscountLevel>}
   */
  async getDiscountPackage(options: GetDiscountPackageOptions): Promise<DiscountLevel> {
    const gqlClient = new Graphql(options.graphqlURL);

    const body = `query getConsumption($contractId: BigInt!){
            contractBillReports(where: {contractID_eq: $contractId} , orderBy: timestamp_DESC) {
                discountReceived

            }
          }`;

    try {
      const response = await gqlClient.query(body, { contractId: options.id });

      const gqlDiscountPackage: GqlDiscountPackage = response["data"] as GqlDiscountPackage;
      const billReports = gqlDiscountPackage.contractBillReports;
      if (billReports.length === 0) {
        return "None";
      } else {
        const discountPackage = billReports[billReports.length - 1].discountReceived;
        return discountPackage;
      }
    } catch (err) {
      (err as Error).message = formatErrorMessage(`Error getting discount package for contract ${options.id}.`, err);
      throw err;
    }
  }
  /**
   * Get contract consumption per hour in TFT.
   *
   * @param  {GetConsumptionOptions} options
   * @returns {Promise<number>}
   */
  async getConsumption(options: GetConsumptionOptions): Promise<number> {
    const gqlClient = new Graphql(options.graphqlURL);
    const body = `query getConsumption($contractId: BigInt!){
            contractBillReports(where: {contractID_eq: $contractId}, limit: 2 , orderBy: timestamp_DESC) {
                amountBilled
                timestamp
            }
            nodeContracts(where: {contractID_eq: $contractId}) {
                createdAt
              }
            nameContracts(where: {contractID_eq: $contractId}) {
                createdAt
              }
            rentContracts(where: {contractID_eq: $contractId}) {
                createdAt
              }
          }`;
    try {
      const response = await gqlClient.query(body, { contractId: options.id });
      const gqlConsumption: GqlConsumption = response["data"] as GqlConsumption;
      const billReports = gqlConsumption.contractBillReports;
      if (billReports.length === 0) {
        return 0;
      } else {
        let duration = 1;
        const amountBilled = new Decimal(billReports[0].amountBilled);
        if (billReports.length === 2) {
          duration = (billReports[0].timestamp - billReports[1].timestamp) / 3600; // one hour
        } else {
          let createdAt: number;
          for (const contracts of [
            gqlConsumption.nodeContracts,
            gqlConsumption.nameContracts,
            gqlConsumption.rentContracts,
          ]) {
            if (contracts.length === 1) {
              createdAt = +contracts[0].createdAt;
              duration = (billReports[0].timestamp - createdAt) / 3600;
              break;
            }
          }
        }
        return amountBilled
          .div(duration || 1)
          .div(10 ** 7)
          .toNumber();
      }
    } catch (err) {
      (err as Error).message = formatErrorMessage(`Error getting consumption for contract ${options.id}.`, err);
      throw err;
    }
  }

  async listContractsByAddress(options: ListContractByAddressOptions) {
    const twinId = await this.client.twins.getTwinIdByAccountId({ accountId: options.accountId });
    return await this.listContractsByTwinId({
      graphqlURL: options.graphqlURL,
      twinId: twinId,
      stateList: options.stateList,
    });
  }

  async listMyContracts(options: ListMyContractOptions): Promise<GqlContracts> {
    const twinId = await this.client.twins.getMyTwinId();
    return await this.listContractsByTwinId({
      graphqlURL: options.graphqlURL,
      twinId: twinId,
      stateList: options.stateList,
    });
  }

  async listMyNodeContracts(options: ListMyContractOptions): Promise<GqlNodeContract[]> {
    const twinId = await this.client.twins.getMyTwinId();
    return await this.listNodeContractsByTwinId({
      graphqlURL: options.graphqlURL,
      twinId: twinId,
      stateList: options.stateList,
      type: options.type,
      projectName: options.projectName,
      nodeId: options.nodeId,
    });
  }

  /** @deprecated */
  async contractLock(options: ContractLockOptions) {
    const res = await super.contractLock(options);
    const amountLocked = new Decimal(res.amountLocked);
    res.amountLocked = amountLocked.div(10 ** 7).toNumber();
    return res;
  }

  /**
   * Function to convert USD to TFT
   * @param {Decimal} USD the amount in USD.
   * @returns  {Decimal} The amount in TFT.
   */
  private async convertToTFT(USD: Decimal) {
    try {
      const tftPrice = (await this.client.tftPrice.get()) ?? 0;
      const tft = new currency(tftPrice, 15).convertUSDtoTFT({ amount: USD.toNumber() });
      return new Decimal(tft);
    } catch (error) {
      throw new GridClientError(`Failed to convert to TFT due: ${error}`);
    }
  }
  /**
   * list all contracts, this is not restricted with the items counts
   * this basically check if the count is larger than the page size, it make another request with the item count as the size pram.
   * @param {GridProxyClient} proxy will be used to list the contracts
   * @param {Partial<ContractsQuery>} queries
   * @returns
   */
  async listAllContracts(proxy: GridProxyClient, queries: Partial<ContractsQuery>) {
    const contracts = await proxy.contracts.list({ ...queries, retCount: true });
    if (contracts.data.length < contracts.count!) {
      return (
        await proxy.contracts.list({
          ...queries,
          size: contracts.count!,
        })
      ).data;
    } else return contracts.data;
  }

  /**
   * List all the grace period contracts on a node
   * @param {number} nodeId rented node to list its contracts
   * @param {GridProxyClient} proxy
   * @returns {Contract[]}
   */
  private async getNodeContractsOnRentedNode(nodeId: number, proxy: GridProxyClient): Promise<Contract[]> {
    return await this.listAllContracts(proxy, {
      nodeId,
      state: [ContractState.GracePeriod],
      numberOfPublicIps: 1,
    });
  }

  /**
   * Get the contract billing info, and add the additional price markup if the node is certified
   * @param {Contract} contract contract to get its billing info
   * @returns {Decimal}
   */
  private async getUnbilledNu(contract_id: number, node_id: number) {
    const billingInfo = await this.client.contracts.getContractBillingInformationByID(contract_id);
    const unbilledNU = billingInfo.amountUnbilled;
    if (unbilledNU > 0) {
      const nodeInfo = await this.client.nodes.get({ id: node_id });
      const isCertified = nodeInfo.certification === CertificationType.Certified;
      if (isCertified) {
        /** premium pricing is 25% on certified nodes */
        const premiumUnbilledNU = unbilledNU * (125 / 100);
        return premiumUnbilledNU;
      }
    }
    return unbilledNU;
  }

  /**
   * Calculate contract cost  for all node contracts on rented node.
   * @description will list all node contracts with public ip and calculate all contracts overdue .
   * please note that the unbilled NU amount is added to the total overdraft exactly as the in the other contract types.
   * the IPV4 cost to add to the estimated cost of the rent contract.
   */
  private async getContractsCostOnRentedNode(nodeId: number, proxy: GridProxyClient): Promise<Decimal> {
    const contracts = await this.getNodeContractsOnRentedNode(nodeId, proxy);

    if (contracts.length == 0) return new Decimal(0);
    const costPromises = contracts.reduce((acc: Promise<Decimal>[], contract) => {
      acc.push(this.calculateContractOverDue({ contractInfo: contract, gridProxyClient: proxy }));
      return acc;
    }, []);
    const costResult = await Promise.all(costPromises);

    const totalContractsCost = costResult.reduce((acc: Decimal, contractCost) => acc.add(contractCost), new Decimal(0));
    return totalContractsCost;
  }

  /**
   * This function is for calculating the estimated cost of the contract per month.
   * @description
   *  Name contract cost is fixed price for the unique name,
   * Rent contract cost is the cost of the total node resources,
   * Node contract have two cases:
   * 1- on rented contract, this case the cost will be only for the ipv4.
   * 2- on shared node, this will be the shared price of the used resources

   * @param {Contract} contract 
   * @param {GridProxyClient} proxy 
   * @returns the cost of the contract per month in USD
   */
  async getContractCost(contract: Contract, proxy: GridProxyClient) {
    const calc = new calculator(this.client);

    if (contract.type == ContractType.Name) return await calc.namePricing();

    //TODO allow ipv4 to be number

    // Other contract types need the node information
    const nodeDetails = await proxy.nodes.byId(contract.details.nodeId);

    const isCertified = nodeDetails.certificationType === CertificationType.Certified;
    if (contract.type == ContractType.Rent) {
      const { cru, sru, mru, hru } = nodeDetails.total_resources;
      /**node extra fees in mille USD per month */
      const extraFeesInMilliUsd = await this.client.contracts.getDedicatedNodeExtraFee({ nodeId: nodeDetails.nodeId });
      const extraFeeUSD = extraFeesInMilliUsd / 1000;
      const USDCost = (
        await calc.calculateWithMyBalance({
          ipv4u: false,
          certified: isCertified,
          cru: cru,
          mru: bytesToGB(mru),
          hru: bytesToGB(hru),
          sru: bytesToGB(sru),
        })
      ).dedicatedPrice;

      return USDCost + extraFeeUSD;
    }

    /** Node Contract */

    /** Node contract on rented node
     * If the node contract has IPV4 will return the price of the ipv4 per month
     * If not there is no cost, will return zero
     */

    if (nodeDetails.rented) {
      if (!contract.details.number_of_public_ips) return 0;
      /** ip price in USD per hour */
      const ipPrice = (await this.client.pricingPolicies.get({ id: 1 })).ipu.value / TFT_CONVERSION_FACTOR;
      const pricePerMonth = ipPrice * HOURS_ONE_MONTH;
      if (isCertified) return pricePerMonth * (125 / 100);
      return pricePerMonth;
    }

    const usedREsources: NodeContractUsedResources = await this.client.contracts.getNodeContractResources({
      id: contract.contract_id,
    });
    const { cru, sru, mru, hru } = usedREsources.used;
    const USDCost = (
      await calc.calculateWithMyBalance({
        ipv4u: !!contract.details.number_of_public_ips,
        certified: isCertified,
        cru: cru,
        mru: bytesToGB(mru),
        hru: bytesToGB(hru),
        sru: bytesToGB(sru),
      })
    ).sharedPrice;

    return USDCost;
  }

  /**
   * Calculates the overdue amount for a contract.
   *
   * @description This method calculates the overdue amount, the overdue amount basically is the sum of three parts:
   * 1- Total over draft: is the sum of additional overdraft and standard overdraft.
   * 2- Unbilled NU: is the unbilled amount of network usage.
   * 3- The estimated cost of the contract for the total period: this part is dependant on the contract type and if the contract is on rented node or not.
   * If the contract is rent contract, will add both of ipv4 cost and the total overdue of all associated contracts.
   * The total period is the time since the last billing added to Allowance period.
   * The resulting overdue amount represents the amount that needs to be addressed.
   *
   * @param {CalculateOverdueOptions} options - The options containing the contract and gridProxyClient.
   * @returns {Promise<number>} - The calculated overdue amount in TFT.
   */
  async calculateContractOverDue(options: CalculateOverdueOptions) {
    const contractInfo = options.contractInfo;

    const { standardOverdraft, additionalOverdraft, lastUpdatedSeconds } =
      await this.client.contracts.getContractPaymentState(contractInfo.contract_id);

    /**Calculate the elapsed seconds since last billing*/
    const elapsedSeconds = Math.ceil(Date.now() / 1000 - lastUpdatedSeconds);

    // time since the last billing with allowance time of **one hour**
    const totalPeriodTime = elapsedSeconds + SECONDS_ONE_HOUR;

    /** Cost in USD */
    const contractMonthlyCost = new Decimal(await this.getContractCost(contractInfo, options.gridProxyClient));

    const contractMonthlyCostTFT = await this.convertToTFT(contractMonthlyCost);
    /** contract cost per second in TFT */
    const contractCostPerSecond = contractMonthlyCostTFT.div(HOURS_ONE_MONTH * SECONDS_ONE_HOUR);

    /** cost of the current billing period and the mentioned allowance time in TFT*/
    const totalPeriodCost = contractCostPerSecond.times(totalPeriodTime);

    /**Calculate total overDraft in Unit TFT*/
    const totalOverDraft = new Decimal(standardOverdraft).add(additionalOverdraft);

    /** Un-billed amount in unit USD for the network usage, including the premium price for the certified node */
    const unbilledNU = await this.getUnbilledNu(contractInfo.contract_id, contractInfo.details.nodeId);

    const unbilledNuTFTUnit = await this.convertToTFT(new Decimal(unbilledNU));

    const overdue = totalOverDraft.add(unbilledNuTFTUnit);

    /** TFT */
    const overdueTFT = overdue.div(TFT_CONVERSION_FACTOR);
    const contractOverdue = overdueTFT.add(totalPeriodCost);

    /** list all node contracts on the rented node and add their values */
    if (contractInfo.type == ContractType.Rent) {
      /** The contracts on the rented node, this includes total overdraft, total ips count, and total unbuilled amount*/
      const totalContractsCost = await this.getContractsCostOnRentedNode(
        contractInfo.details.nodeId,
        options.gridProxyClient,
      );
      const totalContractsOverDue = contractOverdue.add(totalContractsCost);
      return totalContractsOverDue;
    }
    return contractOverdue;
  }

  /**
   * WARNING: Please be careful when executing this method, it will delete all your contracts.
   * @param  {CancelMyContractOptions} options
   * @returns {Promise<Record<string, number>[]>}
   */
  async cancelMyContracts(
    options: CancelMyContractOptions,
  ): Promise<(GqlNameContract | GqlRentContract | GqlNodeContract)[]> {
    const allContracts = await this.listMyContracts(options);
    const contracts = [...allContracts.nameContracts, ...allContracts.nodeContracts, ...allContracts.rentContracts];

    const ids: number[] = [];
    for (const contract of contracts) {
      ids.push(+contract.contractID);
    }
    await this.batchCancelContracts(ids);
    return contracts;
  }

  async batchCancelContracts(ids: number[]): Promise<number[]> {
    const extrinsics: ExtrinsicResult<number>[] = [];
    for (const id of ids) {
      extrinsics.push(await this.cancel({ id }));
    }
    await this.client.applyAllExtrinsics(extrinsics);
    return ids;
  }
  /**
   * Async function that request to resume the passed contracts.
   *
   * @description
   * This function create array of `ExtrinsicResult<number>` to use in `applyAllExtrinsics`.
   * It's not guaranteed that the contracts will be resumed; It just trigger billing request; if it pass the contract will be resumed.
   * the function will ignore all contracts that do not have overdue, also if there is sum rent contracts, its associated node contracts that have ipv4 will be added.
   * @param {Contract[]} contracts contracts to be
   * @param {GridProxyClient} proxy
   * @returns {number[]} contract ids that have been requested to resume
   */
  async batchUnlockContracts(contracts: Contract[], proxy: GridProxyClient) {
    const billableContractsIDs: Set<number> = new Set();
    for (const contract of contracts) {
      const contractOverdue = (
        await this.calculateContractOverDue({ contractInfo: contract, gridProxyClient: proxy })
      ).toNumber();
      if (contractOverdue > 0) {
        billableContractsIDs.add(contract.contract_id);

        if (contract.type == ContractType.Rent) {
          /** add associated node contracts on the rented node `with public ip` to the contracts to bill */
          const nodeContracts = await this.listAllContracts(proxy, {
            numberOfPublicIps: 1,
            state: [ContractState.GracePeriod],
            nodeId: contract.details.nodeId,
          });
          nodeContracts.forEach(contract => billableContractsIDs.add(contract.contract_id));
        }
      }
    }
    const extrinsics: ExtrinsicResult<number>[] = [];
    for (const id of Array.from(billableContractsIDs)) {
      extrinsics.push(await this.unlock(id));
    }
    return this.client.applyAllExtrinsics(extrinsics);
  }

  /**
   * Request to resume all grace period contracts associated with the current twinId
   * @description
   * This function lists all grace period contracts, then call {@link batchUnlockContracts}.
   * @param {String} gridProxyUrl
   * @returns contract ids that have been requested to resume.
   */
  async unlockMyContracts(gridProxyUrl: string) {
    const proxy = new GridProxyClient(gridProxyUrl);
    const contracts = await this.listAllContracts(proxy, {
      state: [ContractState.GracePeriod],
      twinId: await this.client.twins.getMyTwinId(),
    });

    if (contracts.length == 0) return [];
    return await this.batchUnlockContracts(contracts as Contract[], proxy);
  }

  async getDedicatedNodeExtraFee(options: GetDedicatedNodePriceOptions): Promise<number> {
    // converting fees from milli to usd before getting
    const fee = new Decimal(await super.getDedicatedNodeExtraFee(options));
    const feeUSD = fee.div(10 ** 3).toNumber();
    return feeUSD;
  }

  async setDedicatedNodeExtraFee(options: SetDedicatedNodeExtraFeesOptions) {
    // converting fees from usd to milli before setting
    const fee = new Decimal(options.extraFee);
    const feeUSD = fee.mul(10 ** 3).toNumber();

    return await super.setDedicatedNodeExtraFee({
      nodeId: options.nodeId,
      extraFee: feeUSD,
    });
  }
}

export { TFContracts };
