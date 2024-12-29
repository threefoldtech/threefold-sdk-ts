import { Contract } from "@threefold/tfchain_client";
import { GridClientErrors, ValidationError } from "@threefold/types";
import { Addr } from "netaddr";

import { GridClientConfig } from "../config";
import { ZmachineData } from "../helpers";
import { events } from "../helpers/events";
import { expose } from "../helpers/expose";
import { validateInput } from "../helpers/validator";
import { KubernetesHL } from "../high_level/kubernetes";
import { DeploymentResultContracts, TwinDeployment } from "../high_level/models";
import { Network } from "../primitives/network";
import { Deployment } from "../zos";
import { Workload, WorkloadTypes } from "../zos/workload";
import { BaseModule } from "./base";
import { AddWorkerModel, DeleteWorkerModel, K8SDeleteModel, K8SGetModel, K8SModel } from "./models";
import { checkBalance } from "./utils";

class K8sModule extends BaseModule {
  moduleName = "kubernetes";
  workloadTypes = [
    WorkloadTypes.zmachine,
    WorkloadTypes.zmount,
    WorkloadTypes.volume,
    WorkloadTypes.qsfs,
    WorkloadTypes.ip,
    WorkloadTypes.ipv4,
    WorkloadTypes.zlogs,
  ]; // TODO: remove deprecated
  kubernetes: KubernetesHL;

  /**
   * Class representing a Kubernetes Module.
   * Extends the BaseModule class.
   *
   * This class provides methods for managing Kubernetes deployments, including creating, updating, listing, and deleting deployments.
   * @class K8sModule
   * @param {GridClientConfig} config - The configuration object for initializing the client.
   */
  constructor(public config: GridClientConfig) {
    super(config);
    this.kubernetes = new KubernetesHL(config);
  }

  /**
   * Get the master workloads for a specific deployment.
   *
   * This method iterates through the deployments and retrieves the workloads that are of type `zmachine` and have an empty `K3S_URL` environment variable.
   * It assigns the `contract ID` and `node ID` to each workload and adds it to the list of master workloads.
   *
   * @param {string} deploymentName - The name of the deployment to get master workloads for.
   * @param {(Deployment | TwinDeployment)[]} deployments - The list of deployments to search for master workloads.
   * @returns {Promise<Workload[]>} - A list of master workloads that match the criteria.
   */
  async _getMastersWorkload(deploymentName: string, deployments: (Deployment | TwinDeployment)[]): Promise<Workload[]> {
    const workloads: Workload[] = [];

    for (const deployment of deployments) {
      const d = deployment instanceof TwinDeployment ? deployment.deployment : deployment;

      for (const workload of d.workloads) {
        if (workload.type === WorkloadTypes.zmachine && workload.data["env"]["K3S_URL"] === "") {
          workload["contractId"] = d.contract_id;
          workload["nodeId"] = await this._getNodeIdFromContractId(deploymentName, d.contract_id);
          workloads.push(workload);
        }
      }
    }

    return workloads;
  }

  /**
   * Get the worker workloads for a specific deployment.
   *
   * This method iterates through the deployments and retrieves the workloads that are of type `zmachine` and have a non-empty `K3S_URL` environment variable.
   * It assigns the `contract ID` and `node ID` to each workload and adds it to the list of worker workloads.
   *
   * @param {string} deploymentName - The name of the deployment to get worker workloads for.
   * @param {(Deployment | TwinDeployment)[]} deployments - The list of deployments to search for worker workloads.
   * @returns {Promise<Workload[]>} - A list of worker workloads that match the criteria.
   */
  async _getWorkersWorkload(deploymentName: string, deployments: (Deployment | TwinDeployment)[]): Promise<Workload[]> {
    const workloads: Workload[] = [];
    for (const deployment of deployments) {
      const d = deployment instanceof TwinDeployment ? deployment.deployment : deployment;
      for (const workload of d.workloads) {
        if (workload.type === WorkloadTypes.zmachine && workload.data["env"]["K3S_URL"] !== "") {
          workload["contractId"] = d.contract_id;
          workload["nodeId"] = await this._getNodeIdFromContractId(deploymentName, d.contract_id);
          workloads.push(workload);
        }
      }
    }
    return workloads;
  }

  /**
   * Get the `IP addresses` of master workloads for a specific deployment.
   *
   * This method retrieves the `IP addresses` of master workloads associated with the specified deployment.
   * It first fetches the master workloads using the `_getMastersWorkload` method and then extracts the `IP addresses` from the network interfaces data.
   *
   * @param {string} deploymentName - The name of the deployment to get master IPs for.
   * @param {(Deployment | TwinDeployment)[]} deployments - The list of deployments to search for master workloads.
   * @returns {Promise<string[]>} A list of `IP addresses` of master workloads.
   */
  async _getMastersIp(deploymentName: string, deployments: (Deployment | TwinDeployment)[]): Promise<string[]> {
    const ips: string[] = [];
    const workloads = await this._getMastersWorkload(deploymentName, deployments);
    for (const workload of workloads) {
      ips.push(workload.data["network"]["interfaces"][0]["ip"]);
    }
    return ips;
  }

  /**
   * Create a deployment for `Kubernetes`.
   *
   * This method creates a deployment for `Kubernetes` based on the provided options.
   *
   * It adds master nodes and worker nodes to the deployment, along with network configuration.
   *
   * @param {K8SModel} options - The options for creating the `Kubernetes` deployment.
   * @param {string[]} masterIps - The IP addresses of the master nodes.
   * @returns {Promise<[TwinDeployment[], Network, string]>} A tuple containing the created deployments, network configuration, and Wireguard configuration.
   */
  async _createDeployment(options: K8SModel, masterIps: string[] = []): Promise<[TwinDeployment[], Network, string]> {
    const network = new Network(options.network.name, options.network.ip_range, this.config);
    await network.load();

    let deployments: TwinDeployment[] = [];
    let wireguardConfig = "";
    const contractMetadata = JSON.stringify({
      version: 3,
      type: "kubernetes",
      name: options.name,
      projectName: this.config.projectName || `kubernetes/${options.name}`,
    });
    const masters_names: string[] = [];
    const workers_names: string[] = [];
    for (const master of options.masters) {
      if (masters_names.includes(master.name))
        throw new ValidationError(`Another master with the same name ${master.name} already exists.`);
      masters_names.push(master.name);

      const [twinDeployments, wgConfig] = await this.kubernetes.add_master(
        master.name,
        master.node_id,
        options.secret,
        master.cpu,
        master.memory,
        master.rootfs_size,
        master.disk_size,
        master.public_ip,
        master.public_ip6,
        master.planetary,
        master.mycelium,
        master.myceliumSeed!,
        network,
        options.network.myceliumSeeds!,
        options.ssh_key,
        contractMetadata,
        options.metadata,
        options.description,
        master.qsfs_disks,
        this.config.projectName,
        options.network.addAccess,
        options.network.accessNodeId,
        master.ip,
        master.corex,
        master.solutionProviderId!,
        master.zlogsOutput,
        master.gpus,
      );

      deployments = deployments.concat(twinDeployments);
      if (wgConfig) {
        wireguardConfig = wgConfig;
      }
    }
    const masterWorkloads = await this._getMastersWorkload(options.name, deployments);
    if (masterWorkloads.length === 0) {
      throw new GridClientErrors.Workloads.WorkloadUpdateError("Couldn't get master node.");
    }
    const masterWorkload = masterWorkloads[masterWorkloads.length - 1];
    const masterFlist = masterWorkload.data["flist"];

    if (masterIps.length === 0) {
      masterIps = await this._getMastersIp(options.name, deployments);
      if (masterIps.length === 0) {
        throw new GridClientErrors.Workloads.WorkloadCreateError("Couldn't get master ip");
      }
    }
    for (const worker of options.workers!) {
      if (workers_names.includes(worker.name))
        throw new ValidationError(`Another worker with the same name ${worker.name} already exists.`);
      workers_names.push(worker.name);

      const [twinDeployments] = await this.kubernetes.add_worker(
        worker.name,
        worker.node_id,
        options.secret,
        masterIps[masterIps.length - 1],
        worker.cpu,
        worker.memory,
        worker.rootfs_size,
        worker.disk_size,
        worker.public_ip,
        worker.public_ip6,
        worker.planetary,
        worker.mycelium,
        worker.myceliumSeed!,
        network,
        options.network.myceliumSeeds!,
        options.ssh_key,
        contractMetadata,
        options.metadata,
        options.description,
        worker.qsfs_disks,
        this.config.projectName,
        options.network.addAccess,
        options.network.accessNodeId,
        worker.ip,
        worker.corex,
        worker.solutionProviderId!,
        worker.zlogsOutput,
        worker.gpus,
        masterFlist,
      );

      deployments = deployments.concat(twinDeployments);
    }
    return [deployments, network, wireguardConfig];
  }

  /**
   * Deploy a `Kubernetes cluster` based on the provided options.
   *
   * This method deploys a `Kubernetes cluster` by creating `master` and `worker` nodes, along with `network configuration`.
   * It checks if multiple masters are specified and if a deployment with the same name already exists.
   * It emits a log event to indicate the start of cluster creation.
   *
   * @param {K8SModel} options - The options for deploying the `Kubernetes cluster`.
   * @returns {Promise<{ contracts: string[], wireguard_config: string }>} A promise that resolves to an object containing the contracts created and the Wireguard configuration.
   * @decorators
   * - `@expose`: Exposes the method for external use.
   * - `@validateInput`: Validates the input options.
   * - `@checkBalance`: Checks the balance to ensure there are enough funds available.
   */
  @expose
  @validateInput
  @checkBalance
  async deploy(options: K8SModel): Promise<{ contracts: DeploymentResultContracts; wireguard_config: string }> {
    if (options.masters.length > 1) {
      throw new ValidationError("Multiple masters are not supported");
    }

    if (await this.exists(options.name)) {
      throw new ValidationError(`Another k8s deployment with the same name ${options.name} already exists.`);
    }

    events.emit("logs", `Start creating the cluster with name ${options.name}`);
    const [deployments, , wireguardConfig] = await this._createDeployment(options);
    const contracts = await this.twinDeploymentHandler.handle(deployments);
    await this.save(options.name, contracts);
    return { contracts: contracts, wireguard_config: wireguardConfig };
  }

  /**
   * List all Kubernetes deployments.
   *
   * This method retrieves a list of all Kubernetes deployments.
   *
   * @returns {Promise<string[]>} A promise that resolves to a list of all Kubernetes deployments.
   * @decorators
   * - `@expose`: Exposes the method for external use.
   */
  @expose
  async list(): Promise<string[]> {
    return await this._list();
  }

  /**
   * Retrieve information about the master and worker workloads of a specific deployment.
   *
   * This method fetches the master and worker workloads associated with the specified deployment.
   * It first retrieves all deployments using the `_get` method, then gets the master workloads using `_getMastersWorkload`,
   * and the worker workloads using `_getWorkersWorkload`. Finally, it fetches detailed information about each workload using `_getZmachineData`.
   *
   * @param {string} deploymentName - The name of the deployment to retrieve information for.
   * @returns {Promise<{ masters: ZmachineData[], workers: ZmachineData[] }>} A promise that resolves to an object containing information about the master and worker workloads.
   */
  async getObj(deploymentName: string): Promise<{ masters: ZmachineData[]; workers: ZmachineData[] }> {
    const k8s: { masters: ZmachineData[]; workers: ZmachineData[] } = { masters: [], workers: [] };

    const deployments = await this._get(deploymentName);
    const masters = await this._getMastersWorkload(deploymentName, deployments);
    const workers = await this._getWorkersWorkload(deploymentName, deployments);

    for (const master of masters) {
      const masterMachine = await this._getZmachineData(deploymentName, deployments, master);
      k8s.masters.push(masterMachine);
    }

    for (const worker of workers) {
      const workerMachine = await this._getZmachineData(deploymentName, deployments, worker);
      k8s.workers.push(workerMachine);
    }
    return k8s;
  }

  /**
   * Retrieve a specific Kubernetes deployment.
   *
   * This method fetches detailed information about a specific Kubernetes deployment based on the provided deployment name.
   * It retrieves all deployments using the `_get` method and then filters out the deployment matching the specified name.
   *
   * @param {K8SGetModel} options - The options containing the name of the deployment to retrieve.
   * @returns {Promise<Deployment[]>} A promise that resolves to the deployment matching the specified name.
   * @decorators
   * - `@expose`: Exposes the method for external use.
   * - `@validateInput`: Validates the input options.
   */
  @expose
  @validateInput
  async get(options: K8SGetModel): Promise<Deployment[]> {
    return await this._get(options.name);
  }

  /**
   * Delete a Kubernetes deployment.
   *
   * This method deletes a Kubernetes deployment with the specified name.
   * It emits a log event to indicate the start of the deletion process.
   *
   * @param {K8SDeleteModel} options - The options containing the name of the deployment to delete.
   * @returns {Promise<{created: Contract[];deleted: Contract[];updated: Contract[];}>} A promise that resolves once the deployment is successfully deleted.
   * @decorators
   * - `@expose`: Exposes the method for external use.
   * - `@validateInput`: Validates the input options.
   * - `@checkBalance`: Checks the balance to ensure there are enough funds available.
   */
  @expose
  @validateInput
  @checkBalance
  async delete(options: K8SDeleteModel): Promise<DeploymentResultContracts> {
    events.emit("logs", `Start deleting the cluster with name ${options.name}`);
    return await this._delete(options.name);
  }

  /**
   * Update a `Kubernetes deployment` based on the provided options.
   *
   * This method updates a `Kubernetes deployment` by checking if the deployment exists,
   * ensuring only one master is specified, and retrieving the necessary information about the existing deployment.
   * It then validates the network name and IP range, creates new deployments based on the updated options, and updates the deployment using the `_update` method.
   *
   * @param {K8SModel} options - The options for updating the `Kubernetes deployment`.
   * @returns {Promise<{ contracts: DeploymentResultContracts }>} A promise that resolves once the deployment is successfully updated.
   * @decorators
   * - `@expose`: Exposes the method for external use.
   * - `@validateInput`: Validates the input options.
   * - `@checkBalance`: Checks the balance to ensure there are enough funds available.
   */
  @expose
  @validateInput
  @checkBalance
  async update(options: K8SModel): Promise<{ contracts: DeploymentResultContracts }> {
    if (!(await this.exists(options.name))) {
      throw new ValidationError(`There is no k8s deployment with the name: ${options.name}.`);
    }
    if (options.masters.length > 1) {
      throw new ValidationError("Multiple masters are not supported.");
    }
    const oldDeployments = await this._get(options.name);

    const masterIps = await this._getMastersIp(options.name, oldDeployments);
    if (masterIps.length === 0) {
      throw new GridClientErrors.Workloads.WorkloadUpdateError("Couldn't get master ip.");
    }
    const masterWorkloads = await this._getMastersWorkload(options.name, oldDeployments);
    if (masterWorkloads.length === 0) {
      throw new GridClientErrors.Workloads.WorkloadUpdateError("Couldn't get master node.");
    }
    const masterWorkload = masterWorkloads[0];
    const networkName = masterWorkload.data["network"].interfaces[0].network;
    const networkIpRange = Addr(masterWorkload.data["network"].interfaces[0].ip).mask(16).toString();
    if (networkName !== options.network.name && networkIpRange !== options.network.ip_range) {
      throw new GridClientErrors.Workloads.WorkloadUpdateError("Network name and ip_range can't be changed.");
    }

    //TODO: check that the master nodes are not changed
    const [twinDeployments, network] = await this._createDeployment(options, masterIps);
    return await this._update(this.kubernetes, options.name, oldDeployments, twinDeployments, network);
  }

  /**
   * Add a worker to a Kubernetes deployment.
   *
   * This method adds a worker node to the specified Kubernetes deployment based on the provided options.
   *
   * It checks if the deployment exists, ensures that there is no worker with the same name in the cluster,
   * and retrieves the necessary information about the master node.
   * It then creates a new worker node using the 'add_worker' method from the Kubernetes class and adds it to the deployment.
   *
   * @param {AddWorkerModel} options - The options for adding the worker node to the deployment.
   * @returns {Promise<{ contracts: DeploymentResultContracts }>} A promise that resolves once the worker node is successfully added to the deployment.
   * @decorators
   * - `@expose`: Exposes the method for external use.
   * - `@validateInput`: Validates the input options.
   * - `@checkBalance`: Checks the balance to ensure there are enough funds available.
   */
  @expose
  @validateInput
  @checkBalance
  async add_worker(options: AddWorkerModel): Promise<{ contracts: DeploymentResultContracts }> {
    if (!(await this.exists(options.deployment_name))) {
      throw new ValidationError(`There is no k8s deployment with the name: ${options.deployment_name}.`);
    }
    const oldDeployments = await this._get(options.deployment_name);
    if (this.workloadExists(options.name, oldDeployments))
      throw new ValidationError(
        `There is another worker with the same name "${options.name}" in this cluster ${options.deployment_name}.`,
      );
    events.emit("logs", `Start adding worker: ${options.name} to cluster: ${options.deployment_name}`);
    const masterWorkloads = await this._getMastersWorkload(options.deployment_name, oldDeployments);
    if (masterWorkloads.length === 0) {
      throw new GridClientErrors.Workloads.WorkloadUpdateError("Couldn't get master node.");
    }
    const masterWorkload = masterWorkloads[masterWorkloads.length - 1];
    const networkName = masterWorkload.data["network"].interfaces[0].network;
    const networkIpRange = Addr(masterWorkload.data["network"].interfaces[0].ip).mask(16).toString();
    const network = new Network(networkName, networkIpRange, this.config);
    const masterFlist = masterWorkload.data["flist"];
    await network.load();
    const contractMetadata = JSON.stringify({
      version: 3,
      type: "kubernetes",
      name: options.deployment_name,
      projectName: this.config.projectName || `kubernetes/${options.deployment_name}`,
    });
    const [twinDeployments] = await this.kubernetes.add_worker(
      options.name,
      options.node_id,
      masterWorkload.data["env"]["K3S_TOKEN"],
      masterWorkload.data["network"]["interfaces"][0]["ip"],
      options.cpu,
      options.memory,
      options.rootfs_size,
      options.disk_size,
      options.public_ip,
      options.public_ip6,
      options.planetary,
      options.mycelium,
      options.myceliumSeed!,
      network,
      [{ nodeId: options.node_id, seed: options.myceliumNetworkSeed! }],
      masterWorkload.data["env"]["SSH_KEY"],
      contractMetadata,
      masterWorkload.metadata,
      masterWorkload.description,
      options.qsfs_disks,
      this.config.projectName,
      false,
      0,
      options.ip,
      options.corex,
      options.solutionProviderId!,
      options.zlogsOutput,
      options.gpus,
      masterFlist,
    );

    return await this._add(options.deployment_name, options.node_id, oldDeployments, twinDeployments, network);
  }

  /**
   * Delete a worker from a Kubernetes deployment.
   *
   * This method deletes a worker node from the specified Kubernetes deployment based on the provided options.
   * It first checks if the deployment exists, then emits a log event indicating the start of the deletion process.
   *
   * @param {DeleteWorkerModel} options - The options for deleting the worker node from the deployment.
   * @returns {Promise<DeploymentResultContracts>} A promise that resolves once the worker node is successfully deleted from the deployment.
   * @decorators
   * - `@expose`: Exposes the method for external use.
   * - `@validateInput`: Validates the input options.
   * - `@checkBalance`: Checks the balance to ensure there are enough funds available.
   */
  @expose
  @validateInput
  @checkBalance
  async delete_worker(options: DeleteWorkerModel): Promise<DeploymentResultContracts> {
    if (!(await this.exists(options.deployment_name))) {
      throw new ValidationError(`There is no k8s deployment with the name: ${options.deployment_name}.`);
    }
    events.emit("logs", `Start deleting worker: ${options.name} from cluster: ${options.deployment_name}`);
    return await this._deleteInstance(this.kubernetes, options.deployment_name, options.name);
  }
}

export { K8sModule as k8s };
