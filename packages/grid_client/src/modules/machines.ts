import { GridClientErrors, ValidationError } from "@threefold/types";
import { Addr } from "netaddr";

import { GridClientConfig } from "../config";
import { events } from "../helpers/events";
import { expose } from "../helpers/expose";
import { ZmachineData } from "../helpers/types";
import { validateInput } from "../helpers/validator";
import { VMHL } from "../high_level/machine";
import { DeploymentResultContracts, TwinDeployment } from "../high_level/models";
import { Network } from "../primitives/network";
import { ZNetworkLight } from "../primitives/networklight";
import { Nodes } from "../primitives/nodes";
import { Deployment } from "../zos";
import { WorkloadTypes } from "../zos/workload";
import { BaseModule } from "./base";
import { AddMachineModel, DeleteMachineModel, MachinesDeleteModel, MachinesGetModel, MachinesModel } from "./models";
import { checkBalance } from "./utils";

class MachinesModule extends BaseModule {
  moduleName = "machines";
  workloadTypes = [
    WorkloadTypes.zmachine,
    WorkloadTypes.zmount,
    WorkloadTypes.volume,
    WorkloadTypes.qsfs,
    WorkloadTypes.ip,
    WorkloadTypes.ipv4,
    WorkloadTypes.zlogs,
    WorkloadTypes.zmachinelight,
  ]; // TODO: remove deprecated
  vm: VMHL;
  capacity: Nodes;
  /**
   * The MachinesModule class is responsible for managing virtual machine deployments.
   * It extends the BaseModule class and provides methods to deploy, list, get, update, add, and delete machines.
   *
   * Initializes the VMHL instance with the provided configuration.
   *
   * @param {GridClientConfig} config - The configuration object for the GridClient.
   */
  constructor(public config: GridClientConfig) {
    super(config);
    this.vm = new VMHL(config);
    this.capacity = new Nodes(this.config.graphqlURL, this.config.proxyURL, this.config.rmbClient);
  }

  /**
   * Creates a deployment for a set of machines.
   *
   * @param {MachinesModel} options - The options for creating the machine deployment.
   * @returns {Promise<[TwinDeployment[], Network, string]>} - A promise that resolves to an array of twin deployments, the network, and the WireGuard configuration string.
   */
  async _createDeployment(options: MachinesModel): Promise<[TwinDeployment[], Network, string]> {
    let network;
    let contractMetadata;
    for (const machine of options.machines) {
      if (network) break;
      // Sets the network and contractMetadata based on the node's zos version
      const nodeTwinId = await this.capacity.getNodeTwinId(machine.node_id);
      const features = await this.rmb.request([nodeTwinId], "zos.system.node_features_get", "", 20, 3);
      if (features.some(item => item.includes("zmachine-light") || item.includes("network-light"))) {
        network = new ZNetworkLight(options.network.name, options.network.ip_range, this.config);
        await network.load();
        contractMetadata = JSON.stringify({
          version: 4,
          type: "vm",
          name: options.name,
          projectName: this.config.projectName || `vm/${options.name}`,
        });
      } else {
        network = new Network(options.network.name, options.network.ip_range, this.config);
        await network.load();
        contractMetadata = JSON.stringify({
          version: 3,
          type: "vm",
          name: options.name,
          projectName: this.config.projectName || `vm/${options.name}`,
        });
      }
    }
    let twinDeployments: TwinDeployment[] = [];
    let wireguardConfig = "";

    const machines_names: string[] = [];

    for (const machine of options.machines) {
      if (machines_names.includes(machine.name))
        throw new ValidationError(`Another machine with the same name ${machine.name} already exists.`);
      machines_names.push(machine.name);
      const [TDeployments, wgConfig] = await this.vm.create(
        machine.name,
        machine.node_id,
        machine.flist,
        machine.cpu,
        machine.memory,
        machine.rootfs_size,
        machine.disks!,
        machine.public_ip,
        machine.public_ip6!,
        machine.planetary,
        machine.mycelium,
        machine.myceliumSeed!,
        network,
        options.network.myceliumSeeds!,
        machine.entrypoint,
        machine.env,
        contractMetadata,
        options.metadata,
        options.description,
        machine.qsfs_disks,
        this.config.projectName,
        options.network.addAccess,
        options.network.accessNodeId,
        machine.ip,
        machine.corex,
        machine.solutionProviderId!,
        machine.zlogsOutput,
        machine.gpus,
      );
      twinDeployments = twinDeployments.concat(TDeployments);
      if (wgConfig) {
        wireguardConfig = wgConfig;
      }
    }
    return [twinDeployments, network, wireguardConfig];
  }

  /**
   * Deploys a machine or a set of machines.
   *
   * @param {MachinesModel} options - The options for deploying the machine(s).
   * @returns {Promise<{ contracts: any; wireguard_config: string }>} - A promise that resolves to the deployment contracts and WireGuard configuration.
   *
   * @example
   *
   * const networkOptions = {
   *   name: "wedtest",
   *   ip_range: "10.249.0.0/16",
   * };
   *
   * const options: MachinesModel = {
   *   name: "test",
   *   network: networkOptions,
   *   machines: [...],
   * };
   *
   * const machineModel = new MachinesModule()
   * const result = await machineModel.deploy(options);
   * console.log(result.contracts);
   *
   * @decorators
   * - `@expose`: Exposes the method for external use.
   * - `@validateInput`: Validates the input options.
   * - `@checkBalance`: Checks the balance before proceeding.
   */
  @expose
  @validateInput
  @checkBalance
  async deploy(options: MachinesModel): Promise<{ contracts: any; wireguard_config: string }> {
    if (await this.exists(options.name)) {
      throw new ValidationError(`Another machine deployment with the same name ${options.name} already exists.`);
    }
    events.emit("logs", `Start creating the machine deployment with name ${options.name}`);
    const [twinDeployments, , wireguardConfig] = await this._createDeployment(options);
    const contracts = await this.twinDeploymentHandler.handle(twinDeployments);
    await this.save(options.name, contracts);
    return { contracts: contracts, wireguard_config: wireguardConfig };
  }

  /**
   * Lists all machine deployments.
   *
   * @returns {Promise<string[]>} - A promise that resolves to a list of the names of machine contracts.
   *
   * @example
   *
   * const machineModel = new MachinesModule()
   * const result = await machineModel.list();
   * console.log(result);
   *
   * @decorators
   * - `@expose`: Exposes the method for external use.
   */
  @expose
  async list(): Promise<string[]> {
    return await this._list();
  }

  /**
   * Retrieves the object representation of a machine deployment.
   *
   * @param {string} deploymentName - The name of the deployment to retrieve.
   * @returns {Promise<ZmachineData[]>} - A promise that resolves to the object representation of the machine deployment.
   *
   * @example
   *
   * const machineModel = new MachinesModule()
   * const result = await machineModel.getObj("testName");
   * console.log(result);
   *
   */
  async getObj(deploymentName: string): Promise<ZmachineData[]> {
    const deployments = await this._get(deploymentName);
    const workloads = await this._getWorkloadsByTypes(deploymentName, deployments, [
      WorkloadTypes.zmachine,
      WorkloadTypes.zmachinelight,
    ]);
    const promises = workloads.map(
      async workload => await this._getZmachineData(deploymentName, deployments, workload),
    );
    return await Promise.all(promises);
  }

  /**
   * Retrieves a specific machine deployment by name.
   *
   * @param {MachinesGetModel} options - The options containing the name of the deployment to retrieve.
   * @returns {Promise<Deployment[]>} - A promise that resolves to an array of the machine deployments.
   *
   * @example
   *
   * const options: MachinesGetModel = {
   *   name: "test",
   * };
   *
   * const machineModel = new MachinesModule()
   * const result = await machineModel.get(options);
   * console.log(result);
   *
   * @decorators
   * - `@expose`: Exposes the method for external use.
   * - `@validateInput`: Validates the input options.
   */
  @expose
  @validateInput
  async get(options: MachinesGetModel): Promise<Deployment[]> {
    return await this._get(options.name);
  }

  /**
   * Method to delete a machine deployment after validating input and checking balance.
   * Emits a log event before deleting the machine deployment.
   *
   * @param options The options for deleting the machine deployment.
   * @returns A promise that resolves to an object with information about created, deleted, and updated deployments.
   *
   * @example
   *
   * const options: MachinesDeleteModel = {
   *   name: "test",
   * };
   *
   * const machineModel = new MachinesModule()
   * const result = await machineModel.delete(options);
   * console.log(result);
   *
   * @decorators
   * - `@expose`: Exposes the method for external use.
   * - `@validateInput`: Validates the input options.
   * - `@checkBalance`: Checks the balance before proceeding.
   */
  @expose
  @validateInput
  @checkBalance
  async delete(options: MachinesDeleteModel) {
    events.emit("logs", `Start deleting the machine deployment with name ${options.name}`);
    return await this._delete(options.name);
  }

  /**
   * Method to update a machine deployment after validating input and checking balance.
   *
   * @throws {ValidationError} - Throws a ValidationError if the machine with the provided name does not exist.
   * @throws {WorkloadUpdateError} - Throws a WorkloadUpdateError if trying to change the network name or IP range.
   *
   * @param {MachinesModel} options - The options for updating the machine deployment.
   * @returns {Promise<{ contracts: DeploymentResultContracts }>} - A promise that resolves after updating the machine deployment.
   *
   * @example
   *
   * const options: MachinesModel = {
   *   name: "test",
   *   network: networkOptions,
   *   machines: [...],
   * };
   *
   * const machineModel = new MachinesModule()
   * const result = await machineModel.update(options);
   * console.log(result);
   *
   * @decorators
   * - `@expose`: Exposes the method for external use.
   * - `@validateInput`: Validates the input options.
   * - `@checkBalance`: Checks the balance before proceeding.
   */
  @expose
  @validateInput
  @checkBalance
  async update(options: MachinesModel): Promise<{ contracts: DeploymentResultContracts }> {
    if (!(await this.exists(options.name))) {
      throw new ValidationError(`There is no machine with the name: ${options.name}`);
    }

    const oldDeployments = await this._get(options.name);
    const workload = (await this._getWorkloadsByTypes(options.name, oldDeployments, [WorkloadTypes.zmachine]))[0];
    const networkName = workload.data["network"].interfaces[0].network;
    const networkIpRange = Addr(workload.data["network"].interfaces[0].ip).mask(16).toString();
    if (networkName !== options.network.name || networkIpRange !== options.network.ip_range) {
      throw new GridClientErrors.Workloads.WorkloadUpdateError("Network name and ip_range can't be changed.");
    }

    const [twinDeployments, network] = await this._createDeployment(options);
    return await this._update(this.vm, options.name, oldDeployments, twinDeployments, network);
  }

  /**
   * Method to add a new machine to an existing deployment after validating input and checking balance.
   * Emits a log event before adding the machine to the deployment.
   *
   * @param {AddMachineModel} options - The options for adding the machine to the deployment.
   * @returns {Promise<DeploymentResultContracts>} - A promise that resolves to an object with information about created, deleted, and updated deployments.
   *
   * @example
   *
   * const options: AddMachineModel = {
   *   deployment_name: "deploymentName",
   *   myceliumNetworkSeed: "seedValue",
   *   // Add other required options here
   * };
   *
   * const machineModel = new MachinesModule()
   * const result = await machineModel.add_machine(options);
   * console.log(result);
   *
   * @decorators
   * - `@expose`: Exposes the method for external use.
   * - `@validateInput`: Validates the input options.
   * - `@checkBalance`: Checks the balance before proceeding.
   */
  @expose
  @validateInput
  @checkBalance
  async add_machine(options: AddMachineModel): Promise<{ contracts: DeploymentResultContracts }> {
    if (!(await this.exists(options.deployment_name))) {
      throw new ValidationError(`There are no machine deployments with the name: ${options.deployment_name}.`);
    }
    const oldDeployments = await this._get(options.deployment_name);
    if (this.workloadExists(options.name, oldDeployments))
      throw new ValidationError(
        `There is another machine with the same name "${options.name}" in the same deployment ${options.deployment_name}.`,
      );

    events.emit("logs", `Start adding machine: ${options.name} to deployment: ${options.deployment_name}`);
    const workload = (
      await this._getWorkloadsByTypes(options.deployment_name, oldDeployments, [WorkloadTypes.zmachine])
    )[0];
    const networkName = workload.data["network"].interfaces[0].network;
    const networkIpRange = Addr(workload.data["network"].interfaces[0].ip).mask(16).toString();
    const network = new Network(networkName, networkIpRange, this.config);
    await network.load();
    const contractMetadata = JSON.stringify({
      version: 3,
      type: "vm",
      name: options.deployment_name,
      projectName: this.config.projectName || `vm/${options.name}`,
    });
    const [twinDeployments] = await this.vm.create(
      options.name,
      options.node_id,
      options.flist,
      options.cpu,
      options.memory,
      options.rootfs_size,
      options.disks!,
      options.public_ip,
      options.public_ip6!,
      options.planetary,
      options.mycelium,
      options.myceliumSeed!,
      network,
      [{ nodeId: options.node_id, seed: options.myceliumNetworkSeed! }],
      options.entrypoint,
      options.env,
      contractMetadata,
      workload.metadata,
      workload.description,
      options.qsfs_disks,
      this.config.projectName,
      false,
      0,
      options.ip,
      options.corex,
      options.solutionProviderId!,
      options.zlogsOutput,
      options.gpus,
    );
    return await this._add(options.deployment_name, options.node_id, oldDeployments, twinDeployments, network);
  }

  /**
   * Method to delete a machine deployment after validating input and checking balance.
   * Emits a log event before deleting the machine deployment.
   *
   * @param {DeleteMachineModel} options - The options for deleting the machine deployment.
   * @returns {Promise<DeploymentResultContracts>} - A promise that resolves to an object with information about created, deleted, and updated deployments.
   *
   * @example
   *
   * const options: DeleteMachineModel = {
   *   name: "test",
   *   deployment_name: "deploymentName",
   * };
   *
   * const machineModel = new MachinesModule()
   * const result = await machineModel.delete_machine(options);
   * console.log(result);
   *
   * @decorators
   * - `@expose`: Exposes the method for external use.
   * - `@validateInput`: Validates the input options.
   * - `@checkBalance`: Checks the balance before proceeding.
   */
  @expose
  @validateInput
  @checkBalance
  async delete_machine(options: DeleteMachineModel): Promise<DeploymentResultContracts> {
    if (!(await this.exists(options.deployment_name))) {
      throw new ValidationError(`There are no machine deployments with the name: ${options.deployment_name}.`);
    }
    events.emit("logs", `Start deleting machine: ${options.name} from deployment: ${options.deployment_name}`);
    return await this._deleteInstance(this.vm, options.deployment_name, options.name);
  }
}

export { MachinesModule as machines };
