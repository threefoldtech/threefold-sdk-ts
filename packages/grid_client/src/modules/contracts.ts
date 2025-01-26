import GridProxyClient, {
  Contract as GridProxyContract,
  ContractState as GridProxyContractState,
  ContractType,
  Pagination,
} from "@threefold/gridproxy_client";
import { Contract, ContractLock, ServiceContract } from "@threefold/tfchain_client";
import { DeploymentKeyDeletionError, InsufficientBalanceError } from "@threefold/types";
import { GridClientError } from "@threefold/types";
import * as PATH from "path";

import {
  ContractsOverdue,
  type DiscountLevel,
  GqlContracts,
  GqlNameContract,
  GqlNodeContract,
  GqlRentContract,
  ListContractByAddressOptions,
  ListContractByTwinIdOptions,
  LockContracts,
} from "../clients/tf-grid";
import { TFClient } from "../clients/tf-grid/client";
import { GridClientConfig } from "../config";
import { formatErrorMessage } from "../helpers";
import { events } from "../helpers/events";
import { expose } from "../helpers/expose";
import { validateInput } from "../helpers/validator";
import { Nodes } from "../primitives/nodes";
import { BaseModule } from "./base";
import {
  BatchCancelContractsModel,
  ContractCancelModel,
  ContractConsumption,
  ContractDiscountPackage,
  ContractGetByNodeIdAndHashModel,
  ContractGetModel,
  ContractLockModel,
  ContractState,
  ContractStates,
  CreateServiceContractModel,
  GetActiveContractsModel,
  GetDedicatedNodePriceModel,
  GetServiceContractModel,
  NameContractCreateModel,
  NameContractGetModel,
  NodeContractCreateModel,
  NodeContractUpdateModel,
  RentContractCreateModel,
  RentContractGetModel,
  ServiceContractApproveModel,
  ServiceContractBillModel,
  ServiceContractCancelModel,
  SetDedicatedNodeExtraFeesModel,
  SetServiceContractFeesModel,
  SetServiceContractMetadataModel,
} from "./models";
import { checkBalance } from "./utils";

class Contracts {
  client: TFClient;
  nodes: Nodes;

  /**
   * Contracts class handles the creation, management, and retrieval of contracts.
   *
   * @param {GridClientConfig} config - The configuration object for the GridClient.
   */
  constructor(public config: GridClientConfig) {
    this.client = config.tfclient;
    this.nodes = new Nodes(config.graphqlURL, config.proxyURL, config.rmbClient);
  }

  private async invalidateDeployment(contractId: number) {
    const baseModule = new BaseModule(this.config);
    const contractPath = PATH.join(this.config.storePath, "contracts", `${contractId}.json`);
    let contractInfo;
    try {
      contractInfo = await baseModule.backendStorage.load(contractPath);
    } catch (e) {
      events.emit("logs", `Couldn't delete the deployment's cached data for contract id: ${contractId} due to ${e}`);
    }
    if (contractInfo) {
      baseModule.moduleName = contractInfo["moduleName"];
      baseModule.projectName = contractInfo["projectName"];
      try {
        await baseModule._get(contractInfo["deploymentName"]);
      } catch (e) {
        if (e instanceof InsufficientBalanceError)
          throw new DeploymentKeyDeletionError(
            `Couldn't delete the deployment's cached data for contract ${contractInfo["deploymentName"]} due to \n\t${e}`,
          );
        else throw e;
      }
    }
  }

  /**
   * Creates a new node contract.
   *
   * @param {NodeContractCreateModel} options - The options for creating the node contract.
   * @returns {Promise<Contract> } A promise that resolves to the result of creating the node contract.
   * @decorators
   * - `@expose`: Exposes the method for external use.
   * - `@validateInput`: Validates the input options.
   * - `@checkBalance`: Checks the balance before proceeding.
   */
  @expose
  @validateInput
  @checkBalance
  async create_node(options: NodeContractCreateModel): Promise<Contract> {
    return (
      await this.client.contracts.createNode({
        nodeId: options.node_id,
        hash: options.hash,
        data: options.data,
        numberOfPublicIps: options.public_ip,
        solutionProviderId: options.solutionProviderId as number,
      })
    ).apply();
  }

  /**
   * Creates a new name contract.
   *
   * @param {NameContractCreateModel} options - The options for creating the name contract.
   * @returns {Promise<Contract>} A promise that resolves to the result of creating the name contract.
   * @decorators
   * - `@expose`: Exposes the method for external use.
   * - `@validateInput`: Validates the input options.
   * - `@checkBalance`: Checks the balance before proceeding.
   */
  @expose
  @validateInput
  @checkBalance
  async create_name(options: NameContractCreateModel): Promise<Contract> {
    return (await this.client.contracts.createName(options)).apply();
  }

  /**
   * Creates a new rent contract.
   *
   * @param {RentContractCreateModel} options - The options for creating the rent contract.
   * @returns {Promise<Contract>} A promise that resolves to the result of creating the rent contract.
   * @decorators
   * - `@expose`: Exposes the method for external use.
   * - `@validateInput`: Validates the input options.
   * - `@checkBalance`: Checks the balance before proceeding.
   */
  @expose
  @validateInput
  @checkBalance
  async createRent(options: RentContractCreateModel): Promise<Contract> {
    return (await this.client.contracts.createRent(options)).apply();
  }

  /**
   * Retrieves a contract based on the provided options.
   *
   * @param {ContractGetModel} options - The options to retrieve the contract.
   * @returns {Promise<Contract>} A promise that resolves to the retrieved contract.
   * @decorators
   * - `@expose`: Exposes the method for external use.
   * - `@validateInput`: Validates the input options.
   */
  @expose
  @validateInput
  async get(options: ContractGetModel): Promise<Contract> {
    return this.client.contracts.get(options);
  }

  /**
   * Retrieves the contract ID based on the provided node ID and hash.
   *
   * @param {ContractGetByNodeIdAndHashModel} options - The options containing the node ID and hash.
   * @returns {Promise<number>} A promise that resolves to the contract ID.
   * @decorators
   * - `@expose`: Exposes the method for external use.
   * - `@validateInput`: Validates the input options.
   */
  @expose
  @validateInput
  async get_contract_id_by_node_id_and_hash(options: ContractGetByNodeIdAndHashModel): Promise<number> {
    return this.client.contracts.getContractIdByNodeIdAndHash({ nodeId: options.node_id, hash: options.hash });
  }

  /**
   * Retrieves a `name contract ID` based on the provided options.
   *
   * @param {NameContractGetModel} options - The options to retrieve the name contract.
   * @returns {Promise<number>} A promise that resolves to the retrieved `name contract ID`.
   * @decorators
   * - `@expose`: Exposes the method for external use.
   * - `@validateInput`: Validates the input options.
   */
  @expose
  @validateInput
  async get_name_contract(options: NameContractGetModel): Promise<number> {
    return this.client.contracts.getContractIdByName(options);
  }

  /**
   * Retrieves the extra fee for a dedicated node based on the provided options.
   *
   * @param {GetDedicatedNodePriceModel} options - The options to retrieve the extra fee for a dedicated node.
   * @returns {Promise<number>} A promise that resolves to the extra fee for the dedicated node.
   * @decorators
   * - `@expose`: Exposes the method for external use.
   * - `@validateInput`: Validates the input options.
   */
  @expose
  @validateInput
  async getDedicatedNodeExtraFee(options: GetDedicatedNodePriceModel): Promise<number> {
    return await this.client.contracts.getDedicatedNodeExtraFee(options);
  }

  /**
   * Retrieves active `contract IDs` based on the provided node ID.
   *
   * @param {GetActiveContractsModel} options - The options containing the node ID.
   * @returns {Promise<number[]>} A promise that resolves to the active `contract IDs`.
   * @decorators
   * - `@expose`: Exposes the method for external use.
   * - `@validateInput`: Validates the input options.
   */
  @expose
  @validateInput
  async getActiveContracts(options: GetActiveContractsModel): Promise<number[]> {
    return await this.client.contracts.getActiveContracts(options);
  }

  /**
   * Retrieves the active rent `contract ID` for a specific node based on the provided options.
   *
   * @param {RentContractGetModel} options - The options to retrieve the active rent contract for a node.
   * @returns {Promise<number>} A promise that resolves to the active rent `contract ID`.
   * @decorators
   * - `@expose`: Exposes the method for external use.
   * - `@validateInput`: Validates the input options.
   */
  @expose
  @validateInput
  async activeRentContractForNode(options: RentContractGetModel): Promise<number> {
    return this.client.contracts.getContractIdByActiveRentForNode(options);
  }

  /**
   * Returns the lock details of the contract.
   * @deprecated
   * @param {ContractLockModel} options - The options for locking the contract.
   * @returns {Promise<ContractLock>} A promise that resolves when the contract is successfully locked.
   * @decorators
   * - `@expose`: Exposes the method for external use.
   * - `@validateInput`: Validates the input options.
   */
  @expose
  @validateInput
  async contractLock(options: ContractLockModel): Promise<ContractLock> {
    return this.client.contracts.contractLock(options);
  }

  /**
   * Updates a node contract.
   *
   * @param {NodeContractUpdateModel} options - The options for updating the node contract.
   * @returns {Promise<Contract>} A promise that resolves to the result of updating the node contract.
   * @decorators
   * - `@expose`: Exposes the method for external use.
   * - `@validateInput`: Validates the input options.
   * - `@checkBalance`: Checks the balance before proceeding.
   */
  @expose
  @validateInput
  @checkBalance
  async update_node(options: NodeContractUpdateModel): Promise<Contract> {
    return (await this.client.contracts.updateNode(options)).apply();
  }

  /**
   * Cancels a contract based on the provided options.
   *
   * @param {ContractCancelModel} options - The options for canceling the contract.
   * @returns {Promise<number>} A promise that resolves to the deleted `contract ID`.
   * @decorators
   * - `@expose`: Exposes the method for external use.
   * - `@validateInput`: Validates the input options.
   * - `@checkBalance`: Checks the balance before proceeding.
   */
  @expose
  @validateInput
  @checkBalance
  async cancel(options: ContractCancelModel): Promise<number> {
    const deletedContract = await (await this.client.contracts.cancel(options)).apply();
    await this.invalidateDeployment(options.id);
    return deletedContract;
  }

  /**
   * Retrieves a list of `contracts` associated with the current user.
   *
   * @param {ContractState} [options] - The state of the contracts to filter by.
   * @returns {Promise<(GqlContracts<MGqlNameContract | GqlRentContract | GqlNodeContract>)[]>} A promise that resolves to an array of `contracts`.
   * @decorators
   * - `@expose`: Exposes the method for external use.
   * - `@validateInput`: Validates the input options.
   */
  @expose
  @validateInput
  async listMyContracts(options?: ContractState): Promise<GqlContracts> {
    return this.client.contracts.listMyContracts({ graphqlURL: this.config.graphqlURL, stateList: options?.state });
  }

  /**
   * Retrieves a list of `contracts` associated with a specific twin ID.
   *
   * @param {ContractsByTwinId} options - The options containing the twin ID.
   * @returns {Promise<GqlContracts> } A promise that resolves to the list of `contracts` associated with the specified twin ID.
   * @decorators
   * - `@expose`: Exposes the method for external use.
   * - `@validateInput`: Validates the input options.
   */
  @expose
  @validateInput
  async listContractsByTwinId(options: ListContractByTwinIdOptions) {
    return this.client.contracts.listContractsByTwinId({
      graphqlURL: this.config.graphqlURL,
      twinId: options.twinId,
      stateList: options.stateList,
    });
  }

  /**
   * Retrieves a list of `contracts` associated with a specific address.
   *
   * @param {ContractsByAddress} options - The options containing the address to retrieve `contracts` for.
   * @returns {Promise<GqlContracts> } A promise that resolves to the list of `contracts` associated with the specified address.
   * @decorators
   * - `@expose`: Exposes the method for external use.
   * - `@validateInput`: Validates the input options.
   */
  @expose
  @validateInput
  async listContractsByAddress(options: ListContractByAddressOptions) {
    return this.client.contracts.listContractsByAddress({
      graphqlURL: this.config.graphqlURL,
      accountId: options.accountId,
      stateList: options.stateList,
    });
  }

  /**
   * Creates a new `service contract`.
   *
   * @param {CreateServiceContractModel} options - The options for creating the `service contract`.
   * @returns {Promise<ServiceContract>} A promise that resolves to the result of creating the `service contract`.
   * @decorators
   * - `@expose`: Exposes the method for external use.
   * - `@validateInput`: Validates the input options.
   * - `@checkBalance`: Checks the balance before proceeding.
   */
  @expose
  @validateInput
  @checkBalance
  async createServiceContract(options: CreateServiceContractModel): Promise<ServiceContract> {
    return (await this.client.contracts.createService(options)).apply();
  }

  /**
   * Approves a `service contract`.
   *
   * @param {ServiceContractApproveModel} options - The options for approving the `service contract`.
   * @returns {Promise<ServiceContract>} A promise that resolves to the approved `service contract`.
   * @decorators
   * - `@expose`: Exposes the method for external use.
   * - `@validateInput`: Validates the input options.
   * - `@checkBalance`: Checks the balance before proceeding.
   */
  @expose
  @validateInput
  @checkBalance
  async approveServiceContract(options: ServiceContractApproveModel): Promise<ServiceContract> {
    return (await this.client.contracts.approveService(options)).apply();
  }

  /**
   * Bills a `service contract` based on the provided options.
   *
   * @param {ServiceContractBillModel} options - The options for billing the `service contract`.
   * @returns {Promise<ServiceContract>} A promise that resolves to the result of billing the `service contract`.
   * @decorators
   * - `@expose`: Exposes the method for external use.
   * - `@validateInput`: Validates the input options.
   * - `@checkBalance`: Checks the balance before proceeding.
   */
  @expose
  @validateInput
  @checkBalance
  async billServiceContract(options: ServiceContractBillModel): Promise<ServiceContract> {
    return (await this.client.contracts.billService(options)).apply();
  }

  /**
   * Cancels a `service contract` based on the provided options.
   *
   * @param {ServiceContractCancelModel} options - The options for canceling the `service contract`.
   * @returns {Promise<number>} A promise that resolves to the canceled `service contract ID`.
   * @decorators
   * - `@expose`: Exposes the method for external use.
   * - `@validateInput`: Validates the input options.
   * - `@checkBalance`: Checks the balance before proceeding.
   */
  @expose
  @validateInput
  @checkBalance
  async cancelServiceContract(options: ServiceContractCancelModel): Promise<number> {
    return (await this.client.contracts.cancelService(options)).apply();
  }

  /**
   * Sets the fees for a `service contract`.
   *
   * @param {SetServiceContractFeesModel} options - The options for setting the fees for the `service contract`.
   * @returns {Promise<ServiceContract>} A promise that resolves to the result of setting the fees for the `service contract`.
   * @decorators
   * - `@expose`: Exposes the method for external use.
   * - `@validateInput`: Validates the input options.
   * - `@checkBalance`: Checks the balance before proceeding.
   */
  @expose
  @validateInput
  @checkBalance
  async setFeesServiceContract(options: SetServiceContractFeesModel): Promise<ServiceContract> {
    return (await this.client.contracts.setServiceFees(options)).apply();
  }

  /**
   * Sets the metadata for a `service contract`.
   *
   * @param {SetServiceContractMetadataModel} options - The options for setting the metadata for the `service contract`.
   * @returns {Promise<ServiceContract>} A promise that resolves to the result of setting the metadata for the `service contract`.
   * @decorators
   * - `@expose`: Exposes the method for external use.
   * - `@validateInput`: Validates the input options.
   * - `@checkBalance`: Checks the balance before proceeding.
   */
  @expose
  @validateInput
  @checkBalance
  async setMetadataServiceContract(options: SetServiceContractMetadataModel): Promise<ServiceContract> {
    return (await this.client.contracts.setServiceMetadata(options)).apply();
  }

  /**
   * Retrieves a `service contract` based on the provided options.
   *
   * @param {GetServiceContractModel} options - The options to retrieve the `service contract`.
   * @returns {Promise<ServiceContract>} A Promise that resolves to the retrieved `service contract`.
   * @decorators
   * - `@expose`: Exposes the method for external use.
   * - `@validateInput`: Validates the input options.
   */
  @expose
  @validateInput
  async getServiceContract(options: GetServiceContractModel): Promise<ServiceContract> {
    return this.client.contracts.getService(options);
  }

  /**
   * ### WARNING:
   * - `Please be careful when executing this method, it will delete all your contracts.`
   *
   * This method cancels all contracts associated with the current user.
   *
   * @returns {Promise<(GqlNameContract | GqlRentContract | GqlNodeContract)[]>} A promise that resolves to an array of canceled contracts.
   * @decorators
   * - `@expose`: Exposes the method for external use.
   * - `@validateInput`: Validates the input options.
   * - `@checkBalance`: Checks the balance before proceeding.
   */
  @expose
  @validateInput
  @checkBalance
  async cancelMyContracts(): Promise<(GqlNameContract | GqlRentContract | GqlNodeContract)[]> {
    const contracts = await this.client.contracts.cancelMyContracts({ graphqlURL: this.config.graphqlURL });
    for (const contract of contracts) {
      await this.invalidateDeployment(+contract.contractID);
    }
    return contracts;
  }

  /**
   * Cancels multiple contracts in batch.
   *
   * @param {BatchCancelContractsModel} options - The options for batch canceling contracts.
   * @returns {Promise<number[]>} A promise that resolves to an array of canceled `contract IDs`.
   * @decorators
   * - `@expose`: Exposes the method for external use.
   * - `@validateInput`: Validates the input options.
   * - `@checkBalance`: Checks the balance before proceeding.
   */
  @expose
  @validateInput
  @checkBalance
  async batchCancelContracts(options: BatchCancelContractsModel): Promise<number[]> {
    const contracts = await this.client.contracts.batchCancelContracts(options.ids);
    for (const id of options.ids) {
      await this.invalidateDeployment(id);
    }
    return contracts;
  }

  /**
   * Sets the extra fee for a `dedicated node`.
   *
   * @param {SetDedicatedNodeExtraFeesModel} options - The options for setting the extra fee for the `dedicated node`.
   * @returns A promise that resolves to the result of setting the extra fee for the `dedicated node`.
   * @decorators
   * - `@expose`: Exposes the method for external use.
   * - `@validateInput`: Validates the input options.
   * - `@checkBalance`: Checks the balance before proceeding.
   */
  @expose
  @validateInput
  @checkBalance
  async setDedicatedNodeExtraFee(options: SetDedicatedNodeExtraFeesModel) {
    return (await this.client.contracts.setDedicatedNodeExtraFee(options)).apply();
  }
  /**
   * Get contract discount package
   * @param {ContractDiscountPackage} options
   * @returns {Promie<DiscountLevel>}
   * @decorators
   * - `@expose`: Exposes the method for external use.
   * - `@validateInput`: Validates the input options.
   */
  @expose
  @validateInput
  async getDiscountPackage(options: ContractDiscountPackage): Promise<DiscountLevel> {
    return this.client.contracts.getDiscountPackage({ id: options.id, graphqlURL: this.config.graphqlURL });
  }
  /**
   * Get contract consumption per hour in TFT.
   *
   * @param  {ContractConsumption} options
   * @returns {Promise<number>}
   * @decorators
   * - `@expose`: Exposes the method for external use.
   * - `@validateInput`: Validates the input options.
   */
  @expose
  @validateInput
  async getConsumption(options: ContractConsumption): Promise<number> {
    return this.client.contracts.getConsumption({ id: options.id, graphqlURL: this.config.graphqlURL });
  }

  /**
   * Retrieves the deletion time of a contract based on the provided options.
   *
   * @param {ContractGetModel} options - The options to retrieve the deletion time of the contract.
   * @returns {Promise<number>} A promise that resolves to the deletion time of the contract.
   * @decorators
   * - `@expose`: Exposes the method for external use.
   * - `@validateInput`: Validates the input options.
   */
  @expose
  @validateInput
  async getDeletionTime(options: ContractGetModel): Promise<number> {
    return this.client.contracts.getDeletionTime(options);
  }

  /**
   * Retrieves lock details of contracts.
   * @deprecated
   * @returns {Promise<LockContracts>} A Promise that resolves to an object of type LockContracts containing details of locked contracts.
   * @decorators
   * - `@expose`: Exposes the method for external use.
   * - `@validateInput`: Validates the input options.
   */
  @expose
  @validateInput
  async getContractsLockDetails(): Promise<LockContracts> {
    const LockedContracts: LockContracts = {
      nameContracts: {},
      nodeContracts: {},
      rentContracts: {},
      totalAmountLocked: 0,
    };
    const contracts = await this.listMyContracts({ state: [ContractStates.GracePeriod] });

    if (contracts == undefined) return LockedContracts;

    const contractTypes = ["nameContracts", "nodeContracts", "rentContracts"];

    for (const type of contractTypes) {
      for (const contract of contracts[type]) {
        const contractID = parseInt(contract.contractID);
        const contractLockDetails = await this.contractLock({ id: contractID });
        LockedContracts[type][contractID] = contractLockDetails;
        LockedContracts.totalAmountLocked += contractLockDetails.amountLocked;
      }
    }
    return LockedContracts;
  }

  /**
   * Retrieves the overdue amount for a given contract .
   * It is a private function that helps other get contracts overdue amount.
   *
   * @param {GridProxyContract} contract - The contract for which the overdue amount is to be calculated.
   * @param {GridProxyClient} proxy - The proxy client will be used overdue calculation.
   *
   * @returns {Promise<number>} - A promise that resolves to the overdue amount for the specified contract.
   */
  @validateInput
  private async getContractOverdueAmount(contract: GridProxyContract, proxy: GridProxyClient) {
    return await this.client.contracts.calculateContractOverDue({ contractInfo: contract, gridProxyClient: proxy });
  }

  /**
   * Retrieves the overdue amount for a given contract.
   *
   * @param {GridProxyContract} contract - The contract for which the overdue amount is to be calculated.
   *
   * @returns {Promise<number>} - A promise that resolves to the overdue amount for the specified contract.
   */
  @expose
  @validateInput
  async getContractOverdueAmountByContract(contract: GridProxyContract) {
    try {
      const proxy = new GridProxyClient(this.config.proxyURL);
      return await this.client.contracts.calculateContractOverDue({ contractInfo: contract, gridProxyClient: proxy });
    } catch (error) {
      console.log(error);

      (error as Error).message = formatErrorMessage("Failed to get contract overdue info", error);
      throw error;
    }
  }

  /**
   * Retrieves the overdue amount for a given contract by its id.
   *
   * @param {number} contractId - The contract id for which contract the overdue amount is to be calculated.
   *
   * @returns {Promise<number>} - A promise that resolves to the overdue amount for the specified contract.
   */
  @expose
  @validateInput
  async getContractOverdueAmountById(contractId: number) {
    try {
      const proxy = new GridProxyClient(this.config.proxyURL);
      const contract = (await proxy.contracts.list({ contractId })).data[0];
      if (!contract) throw new GridClientError(`Can't find contract ${contractId} info`);
      return await this.getContractOverdueAmount(contract, proxy);
    } catch (error) {
      (error as Error).message = formatErrorMessage("Failed to get contract overdue info", error);
      throw error;
    }
  }

  /**
   * Retrieves the overdue amount for all grace period contracts for the current user.
   *
   * @returns {Promise<number>} - A promise that resolves to the overdue amount for the specified contract.
   */
  @expose
  async getTotalOverdue() {
    const proxy = new GridProxyClient(this.config.proxyURL);
    const result: ContractsOverdue = {
      nameContracts: {},
      nodeContracts: {},
      rentContracts: {},
      totalOverdueAmount: 0,
    };

    const contracts = await proxy.contracts.list({
      twinId: this.config.twinId,
      state: [GridProxyContractState.GracePeriod],
    });
    const rentedNodesIds: number[] = [];
    for (const contract of contracts.data) {
      switch (contract.type) {
        case ContractType.Name:
          result.nameContracts[contract.contract_id] = (
            await this.getContractOverdueAmount(contract, proxy)
          ).toNumber();
          result.totalOverdueAmount += result.nameContracts[contract.contract_id];
          break;

        case ContractType.Rent:
          result.rentContracts[contract.contract_id] = (
            await this.getContractOverdueAmount(contract, proxy)
          ).toNumber();
          rentedNodesIds.push(contract.details.nodeId);
          result.totalOverdueAmount += result.rentContracts[contract.contract_id];
          break;

        default:
          /** skip node contracts on rented nodes as it already calculated in the rent contract */
          if (rentedNodesIds.includes(contract.details.nodeId)) {
            result.nodeContracts[contract.contract_id] = 0;
          } else {
            result.nodeContracts[contract.contract_id] = (
              await this.getContractOverdueAmount(contract, proxy)
            ).toNumber();
            result.totalOverdueAmount += result.nodeContracts[contract.contract_id];
          }
      }
    }
    return result;
  }

  /**
   * Unlocks multiple contracts.
   * @param contracts An array of contracts to be unlocked.
   * @returns A Promise that resolves to an array of billed contracts representing the result of batch unlocking.
   * @decorators
   * - `@expose`: Exposes the method for external use.
   * - `@validateInput`: Validates the input options.
   */
  @expose
  @validateInput
  async unlockContracts(contracts: GridProxyContract[]) {
    const proxy = new GridProxyClient(this.config.proxyURL);
    return await this.batchUnlockContracts(contracts, proxy);
  }

  /**
   * Unlocks multiple contracts.
   * @param contracts An array of contracts to be unlocked.
   * @param proxy An instance of Grid proxy client.
   * @returns A Promise that resolves to an array of billed contracts representing the result of batch unlocking.
   * @decorators
   * - `@expose`: Exposes the method for external use.
   * - `@validateInput`: Validates the input options.
   */
  @expose
  @validateInput
  async batchUnlockContracts(contracts: GridProxyContract[], proxy: GridProxyClient) {
    return await this.client.contracts.batchUnlockContracts(contracts, proxy);
  }

  /**
   * Unlocks multiple contracts by their ids.
   * @param ids An array of contract IDs to be unlocked.
   * @returns A Promise that resolves to an array of billed contracts representing the result of batch unlocking.
   * @decorators
   * - `@expose`: Exposes the method for external use.
   * - `@validateInput`: Validates the input options.
   */
  @expose
  @validateInput
  async unlockContractsByIds(ids: number[]): Promise<number[]> {
    try {
      const proxy = new GridProxyClient(this.config.proxyURL);
      const promises: Promise<Pagination<GridProxyContract[]>>[] = [];
      ids.forEach(id => promises.push(proxy.contracts.list({ contractId: id })));
      const res = await Promise.all(promises);
      const contracts = res.map(contract => contract.data[0]).filter(contract => contract != undefined);
      return await this.batchUnlockContracts(contracts, proxy);
    } catch (error) {
      (error as Error).message = formatErrorMessage("Failed to get the contracts due:", error);
      throw error;
    }
  }

  /**
   * Unlocks contracts associated with the current user.
   * @returns A Promise that resolves to an array of billed contracts.
   * @decorators
   * - `@expose`: Exposes the method for external use.
   * - `@validateInput`: Validates the input options.
   */
  @expose
  @validateInput
  async unlockMyContracts(): Promise<number[]> {
    return await this.client.contracts.unlockMyContracts(this.config.proxyURL);
  }
}

export { Contracts as contracts };
