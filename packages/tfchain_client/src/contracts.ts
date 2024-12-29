import { Decimal } from "decimal.js";

import { Client, QueryClient } from "./client";
import { TFChainError } from "./errors";
import { NodeResources } from "./nodes";
import { ExtrinsicResult, PublicIp } from "./types";
import { checkConnection, requireCouncil } from "./utils";

const TWO_WEEKS = 1209600000;

interface State {
  created: null;
  gracePeriod: number;
}
interface NameContract {
  name: string;
}

export interface ContractLockOptions {
  id: number;
}

export interface ContractLock {
  extraAmountLocked: number;
  amountLocked: number;
  lockUpdated: number;
  cycles: number;
}
export interface ContractPaymentState {
  standardReserve: Decimal;
  additionalReserve: Decimal;
  standardOverdraft: Decimal;
  additionalOverdraft: Decimal;
  lastUpdatedSeconds: number;
  cycles: number;
}

/** For getting network usage billing info */
export interface BillingInformation {
  previousNuReported: number;
  lastUpdated: number;
  amountUnbilled: number;
}
interface NodeContract {
  nodeId: number;
  deploymentHash: string;
  deploymentData: string;
  publicIps: number;
  publicIpsList: PublicIp[];
}

interface RentContract {
  nodeId: number;
}
interface ContractType {
  nameContract: NameContract;
  nodeContract: NodeContract;
  rentContract: RentContract;
}

interface Contract {
  version: number;
  state: State;
  contractId: number;
  twinId: number;
  contractType: ContractType;
  solutionProviderId: number;
}

export interface NodeContractUsedResources {
  contractId: number;
  used: NodeResources;
}
enum ServiceState {
  Created = "Created",
  AgreementReady = "AgreementReady",
  ApprovedByBoth = "ApprovedByBoth",
}
interface ServiceContract {
  serviceContractId: number;
  serviceTwinId: number;
  consumerTwinId: number;
  baseFee: number;
  variableFee: number;
  metadata: string;
  acceptedByService: boolean;
  acceptedByConsumer: boolean;
  lastBill: number;
  state: ServiceState;
}

interface QueryContractsGetOptions {
  id: number;
}

interface ActiveContractsOptions {
  nodeId: number;
}

interface QueryContractsGetContractByActiveRentOptions {
  nodeId: number;
}

interface QueryContractGetContractByNameOptions {
  name: string;
}

interface QueryContractGetContractByIdAndHashOptions {
  nodeId: number;
  hash: string;
}

interface QueryContractGetServiceOptions {
  serviceId: number;
}

class QueryContracts {
  /**
   * Represents a class that handles querying contracts on the `TFChain`.
   * Provides methods to interact with smart contracts related to contracts on the chain.
   */
  constructor(public client: QueryClient) {
    this.client = client;
  }

  /**
   * Retrieves a contract based on the provided options.
   *
   * @param options - The options to specify which contract to retrieve.
   * @returns {Promise<Contract>} A Promise that resolves to the retrieved contract.
   */
  @checkConnection
  async get(options: QueryContractsGetOptions): Promise<Contract> {
    const res = await this.client.api.query.smartContractModule.contracts(options.id);
    return res.toPrimitive() as unknown as Contract;
  }
  /**
   * Retrieves the resources used by a node contract.
   *
   * This function queries the `smartContractModule` to get the resource usage of a specified node contract
   * based on the provided contract ID. The result is converted to a primitive form and returned as `NodeContractUsedResources`.
   *
   * @param {QueryContractsGetOptions} options - Options object containing the contract ID.
   * @returns {Promise<NodeContractUsedResources>} - The resources used by the node contract.
   */
  @checkConnection
  async getNodeContractResources(options: QueryContractsGetOptions) {
    const res = await this.client.api.query.smartContractModule.nodeContractResources(options.id);
    return res.toPrimitive() as unknown as NodeContractUsedResources;
  }

  /**
   * Retrieves the `contract ID` for the active `rent contract` associated with a specific node.
   *
   * @param options - The options specifying the node ID for which to retrieve the active `rent contract`.
   * @returns {Promise<number>} A Promise that resolves to the `contract ID` of the active `rent contract` for the specified node.
   */
  @checkConnection
  async getContractIdByActiveRentForNode(options: QueryContractsGetContractByActiveRentOptions): Promise<number> {
    const res = await this.client.api.query.smartContractModule.activeRentContractForNode(options.nodeId);
    return res.toPrimitive() as number;
  }

  /**
   * Retrieves the active contracts associated with a specific node.
   *
   * @param options - The options specifying the node ID for which to retrieve the active contracts.
   * @returns {Promise<number[]>} A Promise that resolves to an array of contract IDs representing the active contracts for the specified node.
   */
  @checkConnection
  async getActiveContracts(options: ActiveContractsOptions): Promise<number[]> {
    const res = await this.client.api.query.smartContractModule.activeNodeContracts(options.nodeId);
    return res.toPrimitive() as number[];
  }

  /**
   * Retrieves the `contract ID` by the provided `contract name`.
   *
   * @param options - The options specifying the `contract name` to retrieve the `contract ID`.
   * @returns {Promise<number> } A Promise that resolves to the `contract ID` of the specified `contract name`.
   */
  @checkConnection
  async getContractIdByName(options: QueryContractGetContractByNameOptions): Promise<number> {
    const res = await this.client.api.query.smartContractModule.contractIDByNameRegistration(options.name);
    return res.toPrimitive() as number;
  }

  /**
   * Retrieves the `contract ID` based on the provided `node ID` and hash.
   *
   * @param options - The options specifying the `node ID` and hash to retrieve the `contract ID`.
   * @returns {Promise<number>} A Promise that resolves to the `contract ID` based on the provided `node ID` and hash.
   */
  @checkConnection
  async getContractIdByNodeIdAndHash(options: QueryContractGetContractByIdAndHashOptions): Promise<number> {
    const res = await this.client.api.query.smartContractModule.contractIDByNodeIDAndHash(options.nodeId, options.hash);
    return res.toPrimitive() as number;
  }

  /**
   * Retrieves the `lock details` of a contract based on the provided `contract ID`.
   *
   * @param options - The options specifying the `contract ID` for which to retrieve the `lock details`.
   * @returns {Promise<ContractLock>} A Promise that resolves to the `lock details` of the specified contract.
   */
  @checkConnection
  async contractLock(options: ContractLockOptions): Promise<ContractLock> {
    const res = await this.client.api.query.smartContractModule.contractLock(options.id);
    return res.toPrimitive() as unknown as ContractLock;
  }
  /**
   * Retrieves the `payment state` of a contract based on the provided `contract ID`.
   *
   * @param contractID - The ID for which contract to retrieve its `payment state`.
   * @returns {Promise<ContractLock>} A Promise that resolves to the `ContractPaymentState` of the specified contract.
   */
  @checkConnection
  async getContractPaymentState(contractID: number) {
    const res = await this.client.api.query.smartContractModule.contractPaymentState(contractID);
    return res.toPrimitive() as unknown as ContractPaymentState;
  }

  /**
   * Retrieves the deletion time for a contract based on the provided options.
   *
   * @param options - The options to specify which contract to retrieve the deletion time for.
   * @returns {Promise<number>} A Promise that resolves to the deletion time of the contract.
   */
  @checkConnection
  async getDeletionTime(options: QueryContractsGetOptions): Promise<number> {
    const contract = await this.get(options);
    if (!contract || contract.state.created === null) return 0;

    const blockNumber = contract.state.gracePeriod;

    try {
      const currentBlockNumber = +(await this.client.api.query.system.number());

      // each block takes 6 seconds
      const gracePeriodStartTime = new Date().getTime() - (currentBlockNumber - blockNumber) * 6000;

      return gracePeriodStartTime + TWO_WEEKS;
    } catch (err) {
      throw new TFChainError({
        message: `Error getting current block number for contract ${options.id} deletion: ${err}`,
      });
    }
  }

  /**
   * Retrieves the `service contract` details based on the provided `service ID`.
   *
   * @param options - The options specifying the `service ID` for which to retrieve the `service contract` details.
   * @returns {Promise<ServiceContract>} A Promise that resolves to the `service contract` details.
   */
  @checkConnection
  async getService(options: QueryContractGetServiceOptions): Promise<ServiceContract> {
    const res = await this.client.api.query.smartContractModule.serviceContracts(options.serviceId);
    return res.toPrimitive() as unknown as ServiceContract;
  }

  /**
   * Retrieves the `extra fee` associated with a `dedicated node` based on the provided `node ID`.
   *
   * @param options - The options specifying the `node ID` for which to retrieve the `extra fee`.
   * @returns {Promise<number>} A Promise that resolves to the `extra fee` amount for the `dedicated node`.
   */
  @checkConnection
  async getDedicatedNodeExtraFee(options: GetDedicatedNodePriceOptions): Promise<number> {
    const res = await this.client.api.query.smartContractModule.dedicatedNodesExtraFee(options.nodeId);
    return res.toPrimitive() as number;
  }
  /**
   * Retrieves the billing information for network usage of a specific contract by its ID.
   *
   * This asynchronous function queries the smart contract module to fetch the billing details
   * associated with the network usage of the given contract ID.
   *
   * @param {number} contractId - The contract id to get its billing information.
   * @returns {Promise<any>} A promise that resolves to the billing information of the contract
   * related to network usage.
   */
  async getContractBillingInformationByID(contractId: number): Promise<BillingInformation> {
    const res = await this.client.api.query.smartContractModule.contractBillingInformationByID(contractId);
    return res.toPrimitive() as unknown as BillingInformation;
  }
}

export interface CreateNodeOptions {
  nodeId: number;
  hash: string;
  data: string;
  numberOfPublicIps: number;
  solutionProviderId: number;
}

export interface UpdateNodeOptions {
  id: number;
  hash: string;
  data: string;
}

export interface CreateRentOptions {
  nodeId: number;
  solutionProviderId?: number;
}

export interface CreateServiceOptions {
  serviceAccount: string;
  consumerAccount: string;
}

export interface ApproveServiceOptions {
  serviceId: number;
  approve: boolean;
}

export interface BillServiceOptions {
  serviceId: number;
  variableAmount: number;
  metadata: string;
}

export interface SetServiceFeesOptions {
  serviceId: number;
  baseFee: number;
  variableFee: number;
}
export interface SetDedicatedNodeExtraFeesOptions {
  nodeId: number;
  extraFee: number;
}

export interface GetDedicatedNodePriceOptions {
  nodeId: number;
}

export interface SetServiceMetadataOptions {
  serviceId: number;
  metadata: string;
}

export interface CreateNameOptions {
  name: string;
}

export interface CancelOptions {
  id: number;
}

export interface CancelServiceOptions {
  serviceId: number;
}

class Contracts extends QueryContracts {
  /**
   * Contracts class represents a collection of methods for interacting with smart contracts.
   * It extends the QueryContracts class and provides functionalities for creating, updating, canceling, and managing different types of contracts.
   *
   * @class Contracts
   */
  constructor(public client: Client) {
    super(client);
    this.client = client;
  }

  /**
   * Creates a node contract.
   * This method creates a node contract extrinsic with the specified `nodeId`, `hash`, `data`, `numberOfPublicIps`, and `solutionProviderId`.
   *
   * @param {CreateNodeOptions} options - The options object containing the `nodeId`, `hash`, `data`, `numberOfPublicIps`, and `solutionProviderId` for creating the node contract.
   * @returns {Promise<ExtrinsicResult<Contract>>} A promise that resolves to the created Contract extrinsic.

   * @returns {Promise<ExtrinsicResult<Contract>>} A promise that resolves to the created Contract object.
   */
  @checkConnection
  async createNode(options: CreateNodeOptions): Promise<ExtrinsicResult<Contract>> {
    const extrinsic = await this.client.api.tx.smartContractModule.createNodeContract(
      options.nodeId,
      options.hash,
      options.data,
      options.numberOfPublicIps,
      options.solutionProviderId,
    );
    return this.client.patchExtrinsic<Contract>(extrinsic);
  }

  /**
   * Updates a node contract.
   *
   * This method updates a node contract identified by the provided `id` with the new `hash` and `data`.
   *
   * @param {UpdateNodeOptions} options - The options object containing the `id`, `hash`, and `data` for updating the node contract.
   * @returns {Promise<ExtrinsicResult<Contract>>} A promise that resolves to the updated Contract extrinsic.
   */
  @checkConnection
  async updateNode(options: UpdateNodeOptions): Promise<ExtrinsicResult<Contract>> {
    const extrinsic = await this.client.api.tx.smartContractModule.updateNodeContract(
      options.id,
      options.hash,
      options.data,
    );
    return this.client.patchExtrinsic<Contract>(extrinsic);
  }

  /**
   * Creates a name contract extrinsic.
   *
   * This method creates a name contract with the specified `name`.
   *
   * @param {CreateNameOptions} options - The options object containing the `name` for creating the name contract.
   * @returns {Promise<ExtrinsicResult<Contract>>} A promise that resolves to the created Contract extrinsic.
   */
  @checkConnection
  async createName(options: CreateNameOptions): Promise<ExtrinsicResult<Contract>> {
    const extrinsic = await this.client.api.tx.smartContractModule.createNameContract(options.name);
    return this.client.patchExtrinsic<Contract>(extrinsic);
  }

  /**
   * Creates a rent contract extrinsic.
   *
   * This method creates a rent contract for the specified `nodeId` and `solutionProviderId`.
   *
   * @param {CreateRentOptions} options - The options object containing the `nodeId` and optional `solutionProviderId`.
   * @returns {Promise<ExtrinsicResult<Contract>>} A promise that resolves to the created Contract extrinsic.
   */
  @checkConnection
  async createRent(options: CreateRentOptions): Promise<ExtrinsicResult<Contract>> {
    const extrinsic = await this.client.api.tx.smartContractModule.createRentContract(
      options.nodeId,
      options.solutionProviderId,
    );
    return this.client.patchExtrinsic<Contract>(extrinsic);
  }

  /**
   * Cancels a contract.
   *
   * This method cancels a contract identified by the provided `ID`.
   *
   * It first retrieves the contract using the `get` method,
   * and if the contract exists, it cancels the contract by calling the `cancelContract` extrinsic. It then patches the extrinsic
   * result with the `contract ID` and specific result events related to contract cancellation.
   *
   * @param {CancelOptions} options - The options object containing the `ID` of the contract to be canceled.
   * @returns {Promise<ExtrinsicResult<number> | undefined>} A promise that resolves with the contract cancelling extrinsic,
   * * or `undefined` if the contract does not exist.
   */
  @checkConnection
  async cancel(options: CancelOptions): Promise<ExtrinsicResult<number> | undefined> {
    const contract = await this.get(options);
    if (!contract) {
      return;
    }
    const extrinsic = await this.client.api.tx.smartContractModule.cancelContract(options.id);
    return this.client.patchExtrinsic(extrinsic, {
      map: () => options.id,
      resultEvents: ["NodeContractCanceled", "NameContractCanceled", "RentContractCanceled", "ContractCanceled"],
    });
  }

  /**
   * Cancels a contract.
   *
   * This method cancels a contract identified by the provided `ID` for any user.
   * It's a council call that can't be executed by a normal user.
   *
   * @param {CancelOptions} options - The options object containing the `ID` of the contract to be canceled.
   * @returns {Promise<ExtrinsicResult<number> | undefined>} A promise that resolves with the contract cancelling extrinsic,
   * * or `undefined` if the contract does not exist.
   */
  @checkConnection
  @requireCouncil
  async cancelCollective(options: CancelOptions) {
    const contract = await this.get(options);
    if (!contract) {
      return;
    }
    const extrinsic = await this.client.api.tx.smartContractModule.cancelContractCollective(options.id);
    return this.client.patchExtrinsic(extrinsic, {
      map: () => options.id,
      resultEvents: ["NodeContractCanceled", "NameContractCanceled", "RentContractCanceled", "ContractCanceled"],
    });
  }

  /** Creates a new service contract extrinsic.
   *
   * This method creates a new service contract extrinsic with the provided `serviceAccount` and `consumerAccount`.
   *
   * @param {CreateServiceOptions} options - The options object containing the `serviceAccount` and `consumerAccount` for creating the service contract.
   * @returns {Promise<ExtrinsicResult<ServiceContract>>} A promise that resolves to the created ServiceContract extrinsic.
   */
  @checkConnection
  async createService(options: CreateServiceOptions): Promise<ExtrinsicResult<ServiceContract>> {
    const extrinsic = await this.client.api.tx.smartContractModule.serviceContractCreate(
      options.serviceAccount,
      options.consumerAccount,
    );
    return this.client.patchExtrinsic<ServiceContract>(extrinsic);
  }

  /**
   * Approves or rejects a service contract.
   *
   * This method either approves or rejects a service contract based on the provided `approve` flag in the `options` object.
   *
   * @param {ApproveServiceOptions} options - The options object containing the `serviceId` of the service contract and a boolean `approve` flag indicating whether to approve or reject the contract.
   * @returns {Promise<ExtrinsicResult<ServiceContract>>} A promise that resolves to the updated ServiceContract extrinsic.
   */
  @checkConnection
  async approveService(options: ApproveServiceOptions): Promise<ExtrinsicResult<ServiceContract>> {
    let extrinsic: any;
    if (options.approve) {
      extrinsic = await this.client.api.tx.smartContractModule.serviceContractApprove(options.serviceId);
    } else {
      extrinsic = await this.client.api.tx.smartContractModule.serviceContractReject(options.serviceId);
    }
    return this.client.patchExtrinsic<ServiceContract>(extrinsic);
  }

  /**
   * Creates an extrinsic for Billing a service contract.
   *
   * This method bills a service contract identified by the provided `serviceId` with the specified `variableAmount` and `metadata`.
   *
   * @param {BillServiceOptions} options - The options object containing the `serviceId`, `variableAmount`, and `metadata` for billing the service contract.
   * @returns {Promise<ExtrinsicResult<ServiceContract>>} A promise that resolves to the extrinsic for billing the service contract.
   */
  @checkConnection
  async billService(options: BillServiceOptions): Promise<ExtrinsicResult<ServiceContract>> {
    const extrinsic = await this.client.api.tx.smartContractModule.serviceContractBill(
      options.serviceId,
      options.variableAmount,
      options.metadata,
    );
    return this.client.patchExtrinsic<ServiceContract>(extrinsic);
  }

  /**
   * Creates an extrinsic for canceling a service contract.
   *
   * This method cancels a service contract identified by the provided `serviceId`.
   *
   * @param {CancelServiceOptions} options - The options object containing the `serviceId` of the service contract to be canceled.
   * @returns {Promise<ExtrinsicResult<any>>} A promise that resolves to the extrinsic of the `service ID` for canceling the service contract.
   */
  @checkConnection
  async cancelService(options: CancelServiceOptions): Promise<ExtrinsicResult<number>> {
    const extrinsic = await this.client.api.tx.smartContractModule.serviceContractCancel(options.serviceId);
    return this.client.patchExtrinsic(extrinsic, { map: () => options.serviceId });
  }

  /**
   * Sets the service fees for a service contract.
   *
   * This method sets the base fee and variable fee for a service contract identified by the provided `serviceId`.
   *
   * @param {SetServiceFeesOptions} options - The options object containing the `serviceId`, `baseFee`, and `variableFee` to be set.
   * @returns {Promise<ExtrinsicResult<ServiceContract>>} A promise that resolves to the extrinsic for setting the fees.
   */
  @checkConnection
  async setServiceFees(options: SetServiceFeesOptions): Promise<ExtrinsicResult<ServiceContract>> {
    const extrinsic = await this.client.api.tx.smartContractModule.serviceContractSetFees(
      options.serviceId,
      options.baseFee,
      options.variableFee,
    );
    return this.client.patchExtrinsic<ServiceContract>(extrinsic);
  }

  /**
   * Sets the extra fee for a dedicated node.
   *
   * This method sets the extra fee for a dedicated node identified by the provided nodeId.
   *
   * @param {SetDedicatedNodeExtraFeesOptions} options - The options object containing the nodeId and extraFee to be set.
   * @returns {Promise<number>} A promise that resolves to the extrinsic `node ID` for setting the extra fee for the dedicated node.
   */
  @checkConnection
  async setDedicatedNodeExtraFee(options: SetDedicatedNodeExtraFeesOptions): Promise<ExtrinsicResult<number>> {
    const extrinsic = this.client.api.tx.smartContractModule.setDedicatedNodeExtraFee(options.nodeId, options.extraFee);
    return this.client.patchExtrinsic<number>(extrinsic);
  }

  /**
   * Sets the metadata for a service contract.
   *
   * This method sets the metadata for a service contract identified by the provided serviceId.
   *
   * @param {SetServiceMetadataOptions} options - The options object containing the serviceId and metadata to be set.
   * @returns {Promise<ExtrinsicResult<ServiceContract>>} A promise that resolves to the extrinsic for setting the metadata.
   */
  @checkConnection
  async setServiceMetadata(options: SetServiceMetadataOptions): Promise<ExtrinsicResult<ServiceContract>> {
    const extrinsic = await this.client.api.tx.smartContractModule.serviceContractSetMetadata(
      options.serviceId,
      options.metadata,
    );
    return this.client.patchExtrinsic<ServiceContract>(extrinsic);
  }

  /**
   * unlocks a smart contract by triggering the billing of a contract on this block.
   *
   *
   * @param {number} contractId - Contract ID to be unlocked.
   * @returns {Promise<ExtrinsicResult<number>>} A promise that resolves to a `ExtrinsicResult<number>` as the `contract ID`.
   * @note This call doesn't guarantee that the contract will be resumed, it just triggers the billing of it,
   * if the accounts has enough funds the contract will be resumed
   *
   */
  @checkConnection
  async unlock(contractId: number): Promise<ExtrinsicResult<number>> {
    const extrinsic = await this.client.api.tx.smartContractModule.billContractForBlock(contractId);
    return this.client.patchExtrinsic(extrinsic, {
      map: () => contractId,
      resultEvents: ["ContractGracePeriodEnded"],
    });
  }
}

export {
  Contracts,
  Contract,
  QueryContracts,
  ContractType,
  State,
  ServiceContract,
  NameContract,
  NodeContract,
  RentContract,
  ServiceState,
};
