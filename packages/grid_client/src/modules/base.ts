import { Contract } from "@threefold/tfchain_client";
import { GridClientErrors, ValidationError } from "@threefold/types";
import * as PATH from "path";

import { GqlNodeContract, RMB } from "../clients";
import { TFClient } from "../clients/tf-grid/client";
import { GridClientConfig } from "../config";
import { formatErrorMessage } from "../helpers";
import { ExtendedMountData, type ZmachineData } from "../helpers/types";
import { HighLevelBase } from "../high_level/base";
import { KubernetesHL } from "../high_level/kubernetes";
import { VMHL } from "../high_level/machine";
import { DeploymentResultContracts, Operations, TwinDeployment } from "../high_level/models";
import { TwinDeploymentHandler } from "../high_level/twinDeploymentHandler";
import { ZdbHL } from "../high_level/zdb";
import { DeploymentFactory } from "../primitives/deployment";
import { Network } from "../primitives/network";
import { Nodes } from "../primitives/nodes";
import { BackendStorage, BackendStorageType } from "../storage/backend";
import { Volume, Zmount } from "../zos";
import { Deployment } from "../zos/deployment";
import { PublicIPResult } from "../zos/public_ip";
import { QuantumSafeFS, QuantumSafeFSResult } from "../zos/qsfs";
import { ResultStates, Workload, WorkloadTypes } from "../zos/workload";
import { Zmachine, ZmachineResult } from "../zos/zmachine";
import { ContractStates } from "./models";

const modulesNames = {
  machines: "vm",
  kubernetes: "kubernetes",
  gateways: "gateway",
  qsfs_zdbs: "qsfs",
  zdb: "zdb",
  networks: "network",
};

/**
 * Represents a base module for managing deployments and contracts.
 * This class provides methods for updating, adding, and deleting deployments,
 * handling twin deployments, saving contracts, and managing deployment paths.
 * It also includes methods for retrieving, filtering, and processing deployment data.
 *
 * @class BaseModule
 */
class BaseModule {
  moduleName = "";
  projectName = "";
  workloadTypes: WorkloadTypes[] = [];
  rmb: RMB;
  deploymentFactory: DeploymentFactory;
  twinDeploymentHandler: TwinDeploymentHandler;
  backendStorage: BackendStorage;
  tfClient: TFClient;
  contracts: Required<GqlNodeContract>[];
  static newContracts: GqlNodeContract[] = [];
  static deletedContracts: number[] = [];

  /**
   * Represents a base module for managing deployments and contracts.
   * This class provides methods for updating, adding, and deleting deployments,
   * handling twin deployments, saving contracts, and managing deployment paths.
   * It also includes methods for retrieving, filtering, and processing deployment data.
   *
   * @class BaseModule
   *
   * @param {GridClientConfig} config - The configuration object for the GridClient.
   */
  constructor(public config: GridClientConfig) {
    this.projectName = config.projectName;
    this.rmb = new RMB(config.rmbClient);
    this.deploymentFactory = new DeploymentFactory(config);
    this.twinDeploymentHandler = new TwinDeploymentHandler(config);
    this.backendStorage = new BackendStorage(
      config.backendStorageType,
      config.substrateURL,
      config.mnemonic,
      config.storeSecret,
      config.keypairType,
      config.backendStorage,
      config.seed,
    );
    this.tfClient = config.tfclient;
  }

  /**
   * Generates a new deployment path based on the provided paths.
   *
   * @param {string[]} paths - The paths to append to the base deployment path.
   * @returns {string} - The generated deployment path.
   */
  getNewDeploymentPath(...paths: string[]): string {
    return PATH.join(this.config.storePath, this.moduleName, this.projectName, ...paths);
  }

  /**
   * Generates the deployment path for a specific deployment name.
   *
   * @param {string} name - The name of the deployment.
   * @returns {string} - The full path to the deployment.
   */
  getDeploymentPath(name: string): string {
    return PATH.join(this.config.storePath, this.projectName, this.moduleName, name);
  }

  /**
   * Retrieves the old deployment contracts based on the provided deployment name.
   *
   * This method fetches the old deployment contracts by loading the contracts data from the specified path.
   * If no contracts are found, an empty array is returned.
   *
   * @param {string} name - The name of the deployment to retrieve old contracts for.
   * @returns {Promise<Contract[]>} - A promise that resolves to an array of old deployment contracts, or an empty array if no contracts are found.
   */
  async getOldDeploymentContracts(name: string): Promise<Contract[]> {
    const path = this.getNewDeploymentPath(name, "contracts.json");
    const contracts = (await this.backendStorage.load(path)) as Contract[];
    if (!contracts) {
      return [];
    }
    return contracts;
  }

  /**
   * Retrieves the deployment contracts associated with a specific deployment name.
   *
   * This method fetches the deployment contracts by calling the 'getMyContracts' method,
   * and then filters the contracts based on the provided deployment name.
   *
   * @param {string} name - The name of the deployment to retrieve contracts for.
   * @returns {Promise<Required<GqlNodeContract>[]>} - A promise that resolves to an array of deployment contracts matching the provided name.
   */
  async getDeploymentContracts(name: string): Promise<Required<GqlNodeContract>[]> {
    const contracts = await this.getMyContracts();
    return contracts.filter(c => c.parsedDeploymentData.name === name);
  }

  /**
   * Saves the new contracts and updates the existing contracts for a specific deployment.
   *
   * This method processes the created and deleted contracts, updates the existing contracts,
   * and handles the backend storage operations for storing the contracts data.
   *
   * @param {string} name - The name of the deployment to save contracts for.
   * @param {DeploymentResultContracts} contracts - The contracts data containing created and deleted contracts.
   * @returns {Promise<void>} - A promise that resolves once the contracts are saved and updated.
   */
  async save(name: string, contracts: DeploymentResultContracts): Promise<void> {
    const contractsPath = PATH.join(this.getNewDeploymentPath(name), "contracts.json");
    const wireguardPath = PATH.join(this.getDeploymentPath(name), `${name}.conf`);
    const oldContracts = await this.getOldDeploymentContracts(name);
    let StoreContracts = oldContracts;
    let backendOperations = [];

    for (const contract of contracts.created) {
      if (!contract.contractType.nodeContract) continue;
      BaseModule.newContracts.push({
        contractID: String(contract.contractId),
        createdAt: Date.now().toString(),
        updatedAt: Date.now().toString(),
        deploymentData: contract.contractType.nodeContract.deploymentData,
        deploymentHash: contract.contractType.nodeContract.deploymentHash,
        gridVersion: "4",
        id: "",
        nodeID: contract.contractType.nodeContract.nodeId,
        numberOfPublicIPs: contract.contractType.nodeContract.publicIps,
        solutionProviderID: String(contract.solutionProviderId),
        state: ContractStates.Created,
        twinID: String(contract.twinId),
        parsedDeploymentData: JSON.parse(contract.contractType.nodeContract.deploymentData),
        resourcesUsed: undefined,
      });
    }

    for (const contract of contracts.deleted) {
      BaseModule.deletedContracts.push(contract.contractId);
      StoreContracts = StoreContracts.filter(c => c["contract_id"] !== contract.contractId);
      const contractPath = PATH.join(this.config.storePath, "contracts", `${contract.contractId}.json`);
      backendOperations = backendOperations.concat(await this.backendStorage.dump(contractPath, ""));
    }
    if (StoreContracts.length !== 0) {
      backendOperations = backendOperations.concat(await this.backendStorage.dump(contractsPath, StoreContracts));
    } else {
      backendOperations = backendOperations.concat(await this.backendStorage.dump(contractsPath, ""));
      backendOperations = backendOperations.concat(await this.backendStorage.dump(wireguardPath, "")); // left for cleaning up the old deployment after deletion
    }
    if (
      this.config.backendStorageType === BackendStorageType.tfkvstore &&
      backendOperations &&
      backendOperations.length > 0
    ) {
      backendOperations = backendOperations.filter(e => e !== undefined);
      if (backendOperations.length > 0) {
        await this.tfClient.connect();
        await this.tfClient.applyAllExtrinsics(backendOperations);
      }
    }
  }

  /**
   * Migrates keys from old path to new path for the deployment contracts.
   *
   * This method retrieves keys from the old path, and if the backend storage type is 'tfkvstore',
   * it moves the contracts data to the new deployment path using extrinsics.
   * For other storage types, it loads the contracts data, updates the paths, and dumps the data to the new path.
   *
   * @returns {Promise<void>} - A promise that resolves once the keys are migrated.
   */
  async _migrateListKeys(): Promise<void> {
    const oldPath = this.getDeploymentPath("");
    const keys = await this.backendStorage.list(oldPath);

    if (this.backendStorage.type === BackendStorageType.tfkvstore) {
      const exts = await Promise.all(
        keys.map(key =>
          this.backendStorage.storage.moveValue!(
            PATH.join(oldPath, key, "contracts.json"),
            this.getNewDeploymentPath(key, "contracts.json"),
          ),
        ),
      );
      await this.tfClient.applyAllExtrinsics(exts.flat(1).filter(Boolean));
      return;
    }

    const __getValue = (key: string) => {
      const path = PATH.join(oldPath, key, "contracts.json");
      return this.backendStorage.load(path).catch(error => {
        console.log(`Error while fetching key('${key}'):`, error.message || error);
      });
    };

    const values = await Promise.all(keys.map(__getValue));

    const __updatePath = (key: string, index: number) => {
      const value = values[index];
      const from = PATH.join(oldPath, key, "contracts.json");
      const to = this.getNewDeploymentPath(key, "contracts.json");

      if (!value || from === to) {
        return Promise.resolve(null);
      }

      return [this.backendStorage.dump(to, value), this.backendStorage.remove(from)];
    };

    await Promise.all(keys.map(__updatePath).flat(1));
  }

  /**
   * Retrieves the contracts associated with the current module.
   *
   * If the `fetch` flag is set to true or if the contracts have not been fetched yet,
   * this method fetches the contracts by calling the `listMyNodeContracts` method from the TFClient.
   * It then filters the contracts based on the project name and module type.
   * If a contract has been updated within the last minute, it updates the contract in the list.
   * Finally, it parses the contracts data and stores them in the `contracts` property of the class.
   *
   * @param {boolean} fetch - Flag to force fetching the contracts even if they have been previously fetched.
   * @returns {Promise<Required<GqlNodeContract>[]>} - A promise that resolves to an array of contracts associated with the current module.
   */
  private async getMyContracts(fetch = false): Promise<Required<GqlNodeContract>[]> {
    const moduleName = modulesNames[this.moduleName] ?? this.moduleName;
    if (fetch || !this.contracts) {
      let contracts = await this.tfClient.contracts.listMyNodeContracts({
        graphqlURL: this.config.graphqlURL,
        type: moduleName,
        projectName: moduleName === "network" ? "" : this.projectName,
      });

      const alreadyFetchedContracts: GqlNodeContract[] = [];

      for (const contract of BaseModule.newContracts) {
        if (!contract.parsedDeploymentData?.projectName.includes(this.projectName)) continue;
        if (contract.parsedDeploymentData.type !== moduleName) continue;

        const filteredContract = contracts.filter(c => c.contractID === contract.contractID);

        const now = new Date();
        const contractUpdatedAt = new Date(+contract.updatedAt);
        const beforeOneMin = now.getTime() - contractUpdatedAt.getTime() < 1000 * 60;

        if (filteredContract.length > 0) {
          if (beforeOneMin) {
            const idx = contracts.indexOf(filteredContract[0]);
            contracts[idx] = contract;
            continue;
          }

          alreadyFetchedContracts.push(contract);
          continue;
        }
        contracts.push(contract);
      }

      for (const contract of alreadyFetchedContracts) {
        const index = BaseModule.newContracts.indexOf(contract);
        if (index > -1) BaseModule.newContracts.splice(index, 1);
      }

      contracts = contracts.filter(c => !BaseModule.deletedContracts.includes(+c.contractID));

      const parsedContracts: Required<GqlNodeContract>[] = [];
      for (const contract of contracts) {
        const parsedDeploymentData = JSON.parse(contract.deploymentData);
        parsedContracts.push({ ...contract, parsedDeploymentData });
      }

      this.contracts = parsedContracts;
    }

    return this.contracts;
  }

  /**
   * Retrieves the names of contracts from the provided array of contracts.
   *
   * This method extracts the names of contracts from the array of contracts by mapping over each contract
   * and returning a unique set of contract names.
   *
   * @param {Required<GqlNodeContract>[]} contracts - The array of contracts to extract names from.
   * @returns {string[]} - An array containing unique contract names.
   */
  private _getContractsName(contracts: Required<GqlNodeContract>[]): string[] {
    return Array.from(new Set(contracts.map(c => c.parsedDeploymentData.name)));
  }

  /**
   * Lists the deployment names for the current user.
   *
   * @returns {Promise<any>} - A promise that resolves to the list of contract names.
   */
  async _list(): Promise<string[]> {
    await this._migrateListKeys();
    const contracts = await this.getMyContracts(true);
    return this._getContractsName(contracts);
  }

  /**
   * Checks if a deployment with the given name exists.
   *
   * This method asynchronously checks if a deployment with the specified name exists by calling the `_list` method.
   *
   * @param {string} name - The name of the deployment to check for existence.
   * @returns {Promise<boolean>} A promise that resolves to `true` if the deployment exists, `false` otherwise.
   */
  async exists(name: string): Promise<boolean> {
    return (await this._list()).includes(name);
  }

  /**
   * Checks if a specific workload exists in the provided `list of old deployments`.
   *
   * This method iterates over each workload in the `list of old deployments` and checks if a workload with the specified name exists.
   *
   * @param {string} name - The name of the workload to check for existence.
   * @param {Deployment[]} oldDeployment - The `list of old deployments` to search for the workload.
   * @returns {boolean} Returns `true` if a workload with the given name exists in the old deployments, otherwise returns `false`.
   */
  workloadExists(name: string, oldDeployment: Deployment[]): boolean {
    for (const deployment of oldDeployment) {
      for (const workload of deployment.workloads) {
        if (name === workload.name) return true;
      }
    }
    return false;
  }

  /**
   * Retrieves the `node IDs` associated with a specific deployment name.
   *
   * This method fetches the `node IDs` by getting the deployment contracts for the provided deployment name,
   * and then extracts the `node IDs` from each contract.
   *
   * @param {string} name - The name of the deployment to retrieve `node IDs` for.
   * @returns {Promise<number[]>} A promise that resolves to an array of `node IDs` associated with the deployment.
   */
  async _getDeploymentNodeIds(name: string): Promise<number[]> {
    const nodeIds: number[] = [];
    const contracts = await this.getDeploymentContracts(name);
    for (const contract of contracts) {
      nodeIds.push(contract.nodeID);
    }
    return nodeIds;
  }

  /**
   * Retrieves the `contract ID` associated with a specific `node ID` for a given deployment name.
   *
   * This method fetches the deployment contracts for the provided deployment name,
   * and then iterates over each contract to find the one with the matching `node ID`.
   * If a contract with the specified `node ID` is found, the method returns the `contract ID`.
   * If no contract is found with the provided `node ID`, the method returns 0.
   *
   * @param {string} name - The name of the deployment to retrieve contracts for.
   * @param {number} nodeId - The `node ID` to match and retrieve the `contract ID`.
   * @returns {Promise<number>} - A promise that resolves to the `contract ID` associated with the provided `node ID`, or `0` if no matching contract is found.
   */
  async _getContractIdFromNodeId(name: string, nodeId: number): Promise<number> {
    const contracts = await this.getDeploymentContracts(name);
    for (const contract of contracts) {
      if (contract.nodeID === nodeId) {
        return +contract.contractID;
      }
    }
    return 0;
  }

  /**
   * Retrieves the `node ID` associated with a specific `contract ID` for a given deployment name.
   *
   * This method fetches the deployment contracts for the provided deployment name,
   * and then iterates over each contract to find the one with the matching `contract ID`.
   * If a contract with the specified `contract ID` is found, the method returns the `node ID` associated with it.
   * If no contract is found with the provided `contract ID`, the method returns 0.
   *
   * @param {string} name - The name of the deployment to retrieve contracts for.
   * @param {number} contractId - The `contract ID` to match and retrieve the `node ID`.
   * @returns {Promise<number>} - A promise that resolves to the `node ID` associated with the provided `contract ID`, or `0` if no matching contract is found.
   */
  async _getNodeIdFromContractId(name: string, contractId: number): Promise<number> {
    const contracts = await this.getDeploymentContracts(name);
    for (const contract of contracts) {
      if (+contract.contractID === contractId) {
        return contract.nodeID;
      }
    }
    return 0;
  }

  /**
   * Retrieves workloads of specific types associated with a deployment.
   *
   * This method retrieves workloads of the specified types from the provided deployments.
   * It iterates over each workload in the deployments, filters them based on the given types,
   * and adds additional properties `contractId` and `nodeId` to each workload.
   *
   * @param {string} deploymentName - The name of the deployment to retrieve workloads from.
   * @param {Deployment[]} deployments - The array of deployments to extract workloads from.
   * @param {WorkloadTypes[]} types - An array of workload types to filter the workloads.
   * @returns {Promise<Workload[]>} - A promise that resolves to an array of workloads matching the specified types.
   */
  async _getWorkloadsByTypes(
    deploymentName: string,
    deployments: Deployment[],
    types: WorkloadTypes[],
  ): Promise<Workload[]> {
    const workloads: Workload[] = [];
    for (const deployment of deployments) {
      for (const workload of deployment.workloads) {
        if (types.includes(workload.type)) {
          workload["contractId"] = deployment.contract_id;
          workload["nodeId"] = await this._getNodeIdFromContractId(deploymentName, deployment.contract_id);
          workloads.push(workload);
        }
      }
    }
    return workloads;
  }

  /**
   * Retrieves the `PublicIPResult` associated with a specific `public IP` `workload name` in a deployment.
   *
   * This method fetches the workloads of type `IP` or `IPV4` from the provided deployments,
   * filters them based on the `publicIPWorkloadName`, and returns the result data as a `PublicIPResult` object.
   *
   * @param {string} deploymentName - The name of the deployment to retrieve workloads from.
   * @param {Deployment[]} deployments - The array of deployments to extract workloads from.
   * @param {string} publicIPWorkloadName - The name of the public IP workload to retrieve the result for.
   * @returns {Promise<PublicIPResult | null>} A promise that resolves to the `PublicIPResult` object associated with the specified public IP workload name, or null if not found.
   */
  async _getMachinePubIP(
    deploymentName: string,
    deployments: Deployment[],
    publicIPWorkloadName: string,
  ): Promise<PublicIPResult | null> {
    const publicIPWorkloads = await this._getWorkloadsByTypes(deploymentName, deployments, [
      WorkloadTypes.ip,
      WorkloadTypes.ipv4,
    ]);
    for (const workload of publicIPWorkloads) {
      if (workload.name === publicIPWorkloadName) {
        return workload.result.data as PublicIPResult;
      }
    }
    return null;
  }

  /**
   * Retrieves Zmachine data for a specific deployment and workload.
   *
   * This method retrieves Zmachine data for the provided deployment name, deployments, and workload.
   * It extracts various information such as `version`, `contract ID`, `node ID`, `name`, `creation timestamp`, `status`, `message`,
   * `flist`, `public IP`, `planetary IP`, `Mycelium IP`, `network interfaces`, `compute capacity`, `mounts`, `environment variables`,
   * `entrypoint`, `metadata`, `description`, `root filesystem size`, `corex status`, and `GPU information`.
   *
   * @param {string} deploymentName - The name of the deployment to retrieve Zmachine data from.
   * @param {Deployment[]} deployments - The array of deployments to extract data from.
   * @param {Workload} workload - The workload object containing Zmachine data.
   * @returns {Promise<ZmachineData>} A promise that resolves to an object containing Zmachine data.
   */
  async _getZmachineData(deploymentName: string, deployments: Deployment[], workload: Workload): Promise<ZmachineData> {
    const data = workload.data as Zmachine;
    const resultData = workload.result.data as ZmachineResult;
    return {
      version: workload.version,
      contractId: workload["contractId"],
      nodeId: workload["nodeId"],
      name: workload.name,
      created: workload.result.created,
      status: workload.result.state,
      message: workload.result.message,
      flist: data.flist,
      publicIP: (await this._getMachinePubIP(deploymentName, deployments, data.network.public_ip)) as PublicIPResult,
      planetary: data.network.planetary ? resultData.planetary_ip : resultData.ygg_ip,
      myceliumIP: data.network.mycelium?.hex_seed ? resultData.mycelium_ip : "",
      interfaces: data.network.interfaces.map(n => ({
        network: n.network,
        ip: n.ip,
      })),
      capacity: {
        cpu: data.compute_capacity.cpu,
        memory: data.compute_capacity.memory / 1024 ** 2, // MB
      },
      mounts: data.mounts
        ? data.mounts.map(m => ({
            name: m.name,
            mountPoint: m.mountpoint,
            ...this._getDiskData(deployments, m.name, workload["contractId"]),
          }))
        : [],
      env: data.env,
      entrypoint: data.entrypoint,
      metadata: workload.metadata,
      description: workload.description,
      rootfs_size: data.size,
      corex: data.corex,
      gpu: data.gpu,
    };
  }

  /**
   * Retrieves disk data for a specific workload in the provided deployments.
   *
   * This method searches for the workload with the specified `name` and `contract ID` in the given deployments.
   * It then extracts and returns relevant information based on the `workload type`:
   * - For `WorkloadTypes.zmount`: Returns an object containing the size, state, and message of the workload.
   * - For `WorkloadTypes.volume`: Returns an object containing the size, state, and message of the workload.
   * - For `WorkloadTypes.qsfs`: Returns an object with details such as cache, prefix, minimal shards, expected shards,
   *   QSFS ZDBs name, state, message, metrics endpoint, and size of the workload.
   *
   * @param {Deployment[]} deployments - The `array of deployments` to search for the `workload`.
   * @param {string} name - The name of the workload to retrieve data for.
   * @param {number} contractId - The `contract ID` associated with the workload.
   * @returns {DiskData} - An object containing relevant data based on the `workload type` as `DiskData`.
   */
  _getDiskData(deployments: Deployment[], name: string, contractId: number): ExtendedMountData {
    for (const deployment of deployments) {
      if (deployment.contract_id !== contractId) continue;
      for (const workload of deployment.workloads) {
        if (workload.name !== name) continue;
        if (workload.type === WorkloadTypes.zmount) {
          return {
            size: (workload.data as Zmount).size,
            state: workload.result.state,
            message: workload.result.message,
          };
        } else if (workload.type === WorkloadTypes.volume) {
          return {
            size: (workload.data as Volume).size,
            state: workload.result.state,
            message: workload.result.message,
          };
        } else if (workload.type === WorkloadTypes.qsfs) {
          const data = workload.data as QuantumSafeFS;
          const metadata = JSON.parse(workload.metadata);
          return {
            cache: data.cache,
            prefix: data.config.meta.config.prefix,
            minimal_shards: data.config.minimal_shards,
            expected_shards: data.config.expected_shards,
            qsfs_zdbs_name: metadata.qsfs_zdbs_name,
            state: workload.result.state,
            message: workload.result.message,
            metricsEndpoint: (workload.result.data as QuantumSafeFSResult).metrics_endpoint,
            size: metadata.qsfs_size,
          };
        }
      }
    }
    return { size: 0, message: "", state: ResultStates.deleted };
  }

  /**
   * Retrieves the deployments associated with a given name.
   *
   * @param {string} name - The name of the deployment to retrieve.
   * @returns {Promise<Deployment[]>} - A promise that resolves to an array of deployments.
   */
  async _get(name: string): Promise<Deployment[]> {
    const deployments: Deployment[] = [];
    if (!(await this._list()).includes(name)) {
      return deployments;
    }
    const contracts = await this.getDeploymentContracts(name);
    if (contracts.length === 0) {
      await this.save(name, { created: [], updated: [], deleted: [] });
    }
    await this.tfClient.connect();
    for (const contract of contracts) {
      const c = await this.tfClient.contracts.get({ id: +contract.contractID });
      if (c === null) {
        await this.save(name, { created: [], updated: [], deleted: [{ contractId: +contract.contractID }] });
        continue;
      }
      const nodes = new Nodes(this.config.graphqlURL, this.config.proxyURL, this.config.rmbClient);
      const node_twin_id = await nodes.getNodeTwinId(contract.nodeID);
      const payload = JSON.stringify({ contract_id: +contract.contractID });
      let deployment;
      try {
        deployment = await this.rmb.request([node_twin_id], "zos.deployment.get", payload);
      } catch (e) {
        (e as Error).message = formatErrorMessage(`Failed to get deployment`, e);
      }
      let found = false;
      for (const workload of deployment.workloads) {
        if (this.workloadTypes.includes(workload.type) && workload.result.state !== "deleted") {
          found = true;
          break;
        }
      }
      if (found) {
        deployments.push(deployment);
      } else {
        await this.save(name, { created: [], updated: [], deleted: [{ contractId: +contract.contractID }] });
      }
    }
    return deployments;
  }

  /**
   * Update the deployments with `public IP` based on the changes in `twin deployments`.
   *
   * This method compares the `old deployments` with the `new twin deployments` to identify any changes in `public IP workloads`.
   * It updates the `old deployments` with the corresponding changes from the `twin deployments`.
   *
   * @param module The module type (`KubernetesHL`, `ZdbHL`, or `VMHL`) for which the update is being performed.
   * @param name The name of the deployment being updated.
   * @param oldDeployments The list of old deployments to be updated.
   * @param twinDeployments The list of new twin deployments containing the changes.
   * @param network The network configuration for the deployments.
   * @returns {Promise<TwinDeployment[]>} A promise that resolves An array of TwinDeployments representing the final updated deployments.
   */
  async _updateWithPubIP(
    module: KubernetesHL | ZdbHL | VMHL,
    name: string,
    oldDeployments: Deployment[],
    twinDeployments: TwinDeployment[],
    network: Network | null = null,
  ): Promise<TwinDeployment[]> {
    let finalTwinDeployments: TwinDeployment[] = [];
    const doneDeploymentIPWorkloadNames: string[] = [];

    for (let oldDeployment of oldDeployments) {
      oldDeployment = await this.deploymentFactory.fromObj(oldDeployment);
      const pubIPOLdWorkload = oldDeployment.workloads.filter(
        workload => workload.type === WorkloadTypes.ip && workload.data["v4"],
      )[0].name;
      const node_id = await this._getNodeIdFromContractId(name, oldDeployment.contract_id);
      for (const twinDeployment of twinDeployments) {
        if (twinDeployment.nodeId !== node_id) {
          continue;
        }
        const pubIPTwinWorkload = twinDeployment.deployment.workloads.filter(
          workload => workload.type === WorkloadTypes.ip && workload.data["v4"],
        )[0].name;

        if (pubIPOLdWorkload != pubIPTwinWorkload) {
          continue;
        }

        doneDeploymentIPWorkloadNames.push(pubIPOLdWorkload);
        const updateOldDeployment = await this.deploymentFactory.UpdateDeployment(
          oldDeployment,
          twinDeployment.deployment,
          network,
        );
        if (!updateOldDeployment) {
          continue;
        }
        finalTwinDeployments.push(new TwinDeployment(updateOldDeployment, Operations.update, 0, 0, "", network));
      }
      if (!doneDeploymentIPWorkloadNames.includes(pubIPOLdWorkload)) {
        const tDeployments = await module.delete(oldDeployment, []);
        finalTwinDeployments = finalTwinDeployments.concat(tDeployments);
      }
    }

    for (const twinDeployment of twinDeployments) {
      const pubIPTwinWorkload = twinDeployment.deployment.workloads.filter(
        workload => workload.type === WorkloadTypes.ip && workload.data["v4"],
      )[0].name;
      if (!doneDeploymentIPWorkloadNames.includes(pubIPTwinWorkload)) {
        finalTwinDeployments.push(twinDeployment);
      }
    }
    return finalTwinDeployments;
  }

  /**
   * Update the deployments without `public IP`.
   *
   * This method updates the deployments without `public IP` by comparing the `old deployments` with the `new twin deployments`.
   * It iterates through each `old deployment`, checks if there is a corresponding `twin deployment` for the same node,
   * and updates the `old deployment` accordingly. If no corresponding `twin deployment` is found, it deletes the `old deployment`.
   *
   * @param module - The module (KubernetesHL, ZdbHL, or VMHL) responsible for the deployments.
   * @param name - The name of the deployment.
   * @param oldDeployments - The list of `old deployments` to be updated.
   * @param twinDeployments - The list of new `twin deployments` to compare with `old deployments`.
   * @param network - The network configuration for the deployments.
   * @returns {Promise<TwinDeployment[]>} A promise that resolves an array of TwinDeployments representing the final updated deployments.
   */
  async _updateWithoutPubIP(
    module: KubernetesHL | ZdbHL | VMHL,
    name: string,
    oldDeployments: Deployment[],
    twinDeployments: TwinDeployment[],
    network: Network | null = null,
  ): Promise<TwinDeployment[]> {
    let finalTwinDeployments: TwinDeployment[] = [];

    for (let oldDeployment of oldDeployments) {
      oldDeployment = await this.deploymentFactory.fromObj(oldDeployment);
      const node_id = await this._getNodeIdFromContractId(name, oldDeployment.contract_id);
      let deploymentFound = false;
      for (const twinDeployment of twinDeployments) {
        if (twinDeployment.nodeId !== node_id) {
          continue;
        }
        const updateOldDeployment = await this.deploymentFactory.UpdateDeployment(
          oldDeployment,
          twinDeployment.deployment,
          network,
        );
        deploymentFound = true;
        if (!updateOldDeployment) {
          continue;
        }
        finalTwinDeployments.push(new TwinDeployment(updateOldDeployment, Operations.update, 0, 0, "", network));
        break;
      }
      if (!deploymentFound) {
        const tDeployments = await module.delete(oldDeployment, []);
        finalTwinDeployments = finalTwinDeployments.concat(tDeployments);
      }
    }

    return finalTwinDeployments;
  }

  /**
   * Rejects the update of `public IP` for `old deployments`.
   *
   * This method checks and rejects the update of `public IP` for `old deployments` based on the provided `old deployments` and twin deployments.
   * It iterates over each old deployment, retrieves the `public IP` workload name and Zmachine workloads, and compares them with the twin deployments.
   * If a `public IP` workload is found in the old deployment but not in the twin deployments, it throws an error.
   * If the `public IP` workload in the twin deployments does not match the one in the old deployment, it throws an error.
   *
   * @param {Deployment[]} oldDeployments - The list of `old deployments` to check for `public IP` updates.
   * @param {TwinDeployment[]} twinDeployments - The list of twin deployments to compare with `old deployments`.
   * @param {string} name - The name of the deployment being updated.
   * @throws {`GridClientErrors.Workloads.WorkloadUpdateError`} - If there is an issue with updating the `public IP` of an existent deployment.
   */
  async reject_update_pubIP_of_oldDeployment(
    oldDeployments: Deployment[],
    twinDeployments: TwinDeployment[],
    name: string,
  ) {
    for (let oldDeployment of oldDeployments) {
      let pubIPOldWorkload = "";
      const zmachineOldWorkloads: string[] = [];
      oldDeployment.workloads.forEach(workload => {
        if (workload.type === WorkloadTypes.ip && workload.data["v4"]) pubIPOldWorkload = workload.name;
        else if (workload.type === WorkloadTypes.zmachine) zmachineOldWorkloads.push(workload.name);
      });

      if (pubIPOldWorkload != "" && twinDeployments.length == 0)
        throw new GridClientErrors.Workloads.WorkloadUpdateError(
          `Cannot remove a public IP of an existent deployment.`,
        );

      oldDeployment = await this.deploymentFactory.fromObj(oldDeployment);
      const node_id = await this._getNodeIdFromContractId(name, oldDeployment.contract_id);

      for (const pubIPTwinDeployment of twinDeployments) {
        if (pubIPTwinDeployment.nodeId !== node_id) {
          continue;
        }

        let pubIPTwinWorkload = "";
        const zmachineTwinWorkloads: string[] = [];
        pubIPTwinDeployment.deployment.workloads.forEach(workload => {
          if (workload.type === WorkloadTypes.ip && workload.data["v4"]) pubIPTwinWorkload = workload.name;
          else if (workload.type === WorkloadTypes.zmachine) zmachineTwinWorkloads.push(workload.name);
        });

        if (zmachineOldWorkloads.filter(value => zmachineTwinWorkloads.includes(value)).length == 0) continue;

        if (pubIPTwinWorkload != pubIPOldWorkload) {
          if (pubIPTwinWorkload == "")
            throw new GridClientErrors.Workloads.WorkloadUpdateError(
              `Cannot remove a public IP of an existent deployment.`,
            );
          if (pubIPOldWorkload == "")
            throw new GridClientErrors.Workloads.WorkloadUpdateError(
              `Cannot add a public IP to an existent deployment.`,
            );
        }
      }
    }
  }

  /**
   * Filters the provided deployments into two lists based on whether they have public IPs or not.
   *
   * This method takes an array of deployments and separates them into two lists:
   * one containing deployments with public IPs and the other containing deployments without public IPs.
   * It iterates over each deployment, checks if it has a workload of type `IP` with `data['v4']`,
   * and then categorizes the deployment accordingly.
   *
   * @param {TwinDeployment[] | Deployment[]} deployments - The array of deployments to filter.
   * @returns {[TwinDeployment[], TwinDeployment[]]} - An array containing two lists: deployments with public IPs and deployments without public IPs.
   */
  filter_pub_and_noPub_deployments(deployments: TwinDeployment[] | Deployment[]): [TwinDeployment[], TwinDeployment[]] {
    const pubIPDeployments: TwinDeployment[] = [];
    const noPubIPDeployments: TwinDeployment[] = [];
    deployments.forEach(d => {
      let pubIPCondition = false;
      if (d instanceof TwinDeployment)
        pubIPCondition =
          d.deployment.workloads.filter(workload => workload.type === WorkloadTypes.ip && workload.data["v4"]).length >
          0;
      else
        pubIPCondition =
          d.workloads.filter(workload => workload.type === WorkloadTypes.ip && workload.data["v4"]).length > 0;

      if (pubIPCondition) pubIPDeployments.push(d);
      else noPubIPDeployments.push(d);
    });
    return [pubIPDeployments, noPubIPDeployments];
  }

  /**
   * Update deployments for a specific module.
   *
   * This method updates deployments for a specific module by handling twin deployments.
   * It filters deployments based on whether they have public IPs or not, and then updates them accordingly.
   *
   * @param {KubernetesHL | ZdbHL | VMHL} module - The module to update deployments for.
   * @param {string} name - The name of the deployment.
   * @param {Deployment[]} oldDeployments - The old deployments to be updated.
   * @param {TwinDeployment[]} twinDeployments - The new twin deployments to update to.
   * @param {Network} network - The network configuration for the deployments.
   * @returns {Promise<string | { contracts: DeploymentResultContracts }> | string} - A message indicating the update status or the updated contracts.
   */
  async _update(
    module: KubernetesHL | ZdbHL | VMHL,
    name: string,
    oldDeployments: Deployment[],
    twinDeployments: TwinDeployment[],
    network: Network | null = null,
  ): Promise<{ contracts: DeploymentResultContracts }> {
    let finalTwinDeployments: TwinDeployment[] = [];
    finalTwinDeployments = twinDeployments.filter(d => d.operation === Operations.update);
    twinDeployments = this.twinDeploymentHandler.deployMerge(twinDeployments);
    const deploymentNodeIds = await this._getDeploymentNodeIds(name);

    // add deployments on other nodes
    finalTwinDeployments = finalTwinDeployments.concat(
      twinDeployments.filter(d => !deploymentNodeIds.includes(d.nodeId)),
    );

    // filter deployments on same nodes
    twinDeployments = twinDeployments.filter(d => deploymentNodeIds.includes(d.nodeId));

    await this.reject_update_pubIP_of_oldDeployment(oldDeployments, twinDeployments, name);

    // get twin deployments with/without pub IP
    const filterTwinDeployments = this.filter_pub_and_noPub_deployments(twinDeployments);

    // get old deployments with/without pub IP
    const filterOLdDeployments = this.filter_pub_and_noPub_deployments(oldDeployments);

    finalTwinDeployments = finalTwinDeployments.concat(
      await this._updateWithPubIP(
        module,
        name,
        filterOLdDeployments[0] as unknown as Deployment[],
        filterTwinDeployments[0],
        network!,
      ),
    );

    finalTwinDeployments = finalTwinDeployments.concat(
      await this._updateWithoutPubIP(
        module,
        name,
        filterOLdDeployments[1] as unknown as Deployment[],
        filterTwinDeployments[1],
        network!,
      ),
    );

    const contracts = await this.twinDeploymentHandler.handle(finalTwinDeployments);
    if (contracts.created.length === 0 && contracts.updated.length === 0 && contracts.deleted.length === 0) {
      console.log("Nothing found to update");
      return { contracts: contracts };
    }
    await this.save(name, contracts);
    return { contracts: contracts };
  }

  /**
   * Add a new [machine, ZDB, or K8S worker] to the deployment.
   *
   * @param deployment_name The name of the deployment.
   * @param node_id The ID of the node where the machine will be added.
   * @param oldDeployments The list of old deployments.
   * @param twinDeployments The list of twin deployments.
   * @param network The network to be used for the machine (default is null).
   * @returns {contracts: DeploymentResultContracts} An object containing the contracts after adding the machine.
   */
  async _add(
    deployment_name: string,
    node_id: number,
    oldDeployments: Deployment[],
    twinDeployments: TwinDeployment[],
    network: Network | null = null,
  ): Promise<{ contracts: DeploymentResultContracts }> {
    const finalTwinDeployments: TwinDeployment[] = twinDeployments.filter(d => d.operation === Operations.update);
    const twinDeployment: TwinDeployment = twinDeployments.pop()!;
    const contract_id = await this._getContractIdFromNodeId(deployment_name, node_id);
    if (contract_id && twinDeployment.publicIps == 0) {
      for (let oldDeployment of oldDeployments) {
        oldDeployment = await this.deploymentFactory.fromObj(oldDeployment);
        if (oldDeployment.contract_id !== contract_id) {
          continue;
        }
        if (
          oldDeployment.workloads.filter(
            workload =>
              (workload.type === WorkloadTypes.ip && workload.data["v4"]) || workload.type === WorkloadTypes.network,
          ).length > 0
        ) {
          continue;
        }
        const newDeployment = await this.deploymentFactory.fromObj(oldDeployment);
        newDeployment.workloads = newDeployment.workloads.concat(twinDeployment.deployment.workloads);
        const deployment = await this.deploymentFactory.UpdateDeployment(oldDeployment, newDeployment, network);
        twinDeployment.deployment = deployment!;
        twinDeployment.operation = Operations.update;
        break;
      }
    }
    // pop and push the network deployment first before push the added machine to the list
    const networkTwinDeployment = twinDeployments.pop();
    if (networkTwinDeployment) {
      finalTwinDeployments.push(networkTwinDeployment);
    }
    finalTwinDeployments.push(twinDeployment);
    const contracts = await this.twinDeploymentHandler.handle(finalTwinDeployments);
    await this.save(deployment_name, contracts);
    return { contracts: contracts };
  }

  /**
   * Deletes a specific instance from a deployment.
   *
   * This method deletes a specific instance from a deployment by calling the `delete` method of the provided module (`KubernetesHL`, `ZdbHL`, or `VMHL`).
   * It retrieves the deployment based on the provided `deployment name`, and then deletes the instance with the specified name.
   * If the instance is successfully deleted, the method saves the updated contracts and returns the result.
   * If the instance is not found, it raises a `ValidationError`.
   *
   * @param {KubernetesHL | ZdbHL | VMHL} module - The module to use for deleting the instance.
   * @param {string} deployment_name - The name of the deployment containing the instance.
   * @param {string} name - The name of the instance to delete.
   * @returns {Promise<DeploymentResultContracts>} - A promise that resolves to the result of the deletion, including any created, updated, or deleted contracts.
   * @throws {`ValidationError`} - If the instance with the specified name is not found in the deployment.
   */
  async _deleteInstance(
    module: KubernetesHL | ZdbHL | VMHL,
    deployment_name: string,
    name: string,
  ): Promise<DeploymentResultContracts> {
    const deployments = await this._get(deployment_name);
    for (const deployment of deployments) {
      const twinDeployments = await module.delete(deployment, [name]);
      const contracts = await this.twinDeploymentHandler.handle(twinDeployments);
      if (contracts["deleted"].length > 0 || contracts["updated"].length > 0) {
        await this.save(deployment_name, contracts);
        await this._get(deployment_name);
        return contracts;
      }
    }
    throw new ValidationError(`Instance with name ${name} is not found.`);
  }

  /**
   * Deletes all contracts associated with a specific deployment name.
   *
   * This method retrieves the deployments based on the provided deployment name,
   * and then deletes all contracts associated with those deployments.
   * It iterates over each deployment, calls the `_delete` method from the `HighLevelBase` class,
   * and handles the deleted contracts by updating the `contracts` object.
   * Finally, it saves the updated contracts and returns the result containing created, deleted, and updated contracts.
   *
   * @param {string} name - The name of the deployment to delete contracts for.
   * @returns {Promise<DeploymentResultContracts>} - A promise that resolves to an object containing the created, deleted, and updated contracts.
   */
  async _delete(name: string): Promise<DeploymentResultContracts> {
    const contracts: DeploymentResultContracts = {
      created: [],
      deleted: [],
      updated: [],
    };

    if (!(await this._list()).includes(name)) {
      console.log("In heree", name);
      return contracts;
    }
    console.log("In here cont", contracts);

    const deployments = await this._get(name);
    const highlvl = new HighLevelBase(this.config);

    for (const deployment of deployments) {
      console.log("In here dep", deployment);

      const twinDeployments = await highlvl._delete(deployment, []);
      const contract = await this.twinDeploymentHandler.handle(twinDeployments);
      contracts.deleted = contracts.deleted.concat(contract.deleted as unknown as Contract);
      contracts.updated = contracts.updated.concat(contract.updated as unknown as Contract);
    }

    const deletedContracts: number[] = [];
    for (const c of contracts.deleted) {
      deletedContracts.push(c.contractId);
    }
    console.log("In here deletedContracts", deletedContracts);

    const updatedContracts: Contract[] = [];
    for (const c of contracts.updated) {
      if (!deletedContracts.includes(c.contractId)) {
        updatedContracts.push(c);
      }
    }

    contracts.updated = updatedContracts;
    await this.save(name, contracts);
    return contracts;
  }
}
export { BaseModule };
