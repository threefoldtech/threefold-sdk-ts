import { Contract, ExtrinsicResult } from "@threefold/tfchain_client";
import { TFChainError } from "@threefold/tfchain_client";
import { BaseError, GridClientError, GridClientErrors, TimeoutError, ValidationError } from "@threefold/types";

import { KYC, KycStatus, RMB } from "../clients";
import { TFClient } from "../clients/tf-grid/client";
import { GridClientConfig } from "../config";
import { formatErrorMessage } from "../helpers";
import { events } from "../helpers/events";
import { validateObject } from "../helpers/validator";
import { DeploymentFactory, Network, Nodes } from "../primitives/index";
import { Workload, WorkloadTypes } from "../zos/workload";
import { DeploymentResultContracts, Operations, TwinDeployment } from "./models";
class TwinDeploymentHandler {
  tfclient: TFClient;
  rmb: RMB;
  kyc: KYC;
  deploymentFactory: DeploymentFactory;
  original_deployments = [];
  nodes: Nodes;

  constructor(public config: GridClientConfig) {
    this.tfclient = config.tfclient;
    this.deploymentFactory = new DeploymentFactory(this.config);
    this.rmb = new RMB(config.rmbClient);
    this.nodes = new Nodes(this.config.graphqlURL, this.config.proxyURL, this.config.rmbClient);
    this.kyc = new KYC(this.config.kycURL, this.config.mnemonic, this.config.keypairType);
  }

  async createNameContract(name: string) {
    const id = await this.tfclient.contracts.getContractIdByName({ name });
    if (id) {
      const c = await this.tfclient.contracts.get({ id });
      if (c && c.twinId !== this.config.twinId) {
        throw new ValidationError(`Name contract with name ${name} is already reserved.`);
      }
    }
    try {
      const kycStatus = await this.kyc.status();
      if (kycStatus !== KycStatus.verified)
        throw new ValidationError(
          "Your account is not verified. Please sign into ThreeFold Dashboard or ThreeFold Connect mobile app to complete your KYC verification.",
        ); //TODO add kyc manual link
      return await this.tfclient.contracts.createName({ name });
    } catch (e) {
      //TODO ERROR should be handled in tfchain
      throw new TFChainError({
        message: `Failed to create name contract ${name} due to ${e}.`,
      });
    }
  }

  async deleteNameContract(name: string) {
    const c = await this.tfclient.contracts.getContractIdByName({ name });
    if (!c) {
      events.emit("logs", `Couldn't find a name contract with name ${name} to delete.`);
    } else {
      events.emit("logs", `Deleting name contract with name: ${name} and id: ${c}.`);
      return await this.tfclient.contracts.cancel({ id: c });
    }
  }

  async sendToNode(twinDeployment: TwinDeployment) {
    try {
      await twinDeployment.deployment.sign(this.config.twinId, this.config.mnemonic, this.tfclient.keypairType);
      const payload = JSON.stringify(twinDeployment.deployment);
      const node_twin_id = await this.nodes.getNodeTwinId(twinDeployment.nodeId);
      await this.rmb.request([node_twin_id], `zos.deployment.${twinDeployment.operation}`, payload);
    } catch (e) {
      (e as Error).message = formatErrorMessage(
        `Failed to ${twinDeployment.operation} the deployment on node ${twinDeployment.nodeId}.`,
        e,
      );
      throw e;
    }
  }

  async getDeployment(contract_id: number) {
    const node_id = await this.nodes.getNodeIdFromContractId(contract_id, this.config.substrateURL);
    const node_twin_id = await this.nodes.getNodeTwinId(node_id);

    const payload = JSON.stringify({ contract_id: contract_id });
    return await this.rmb.request([node_twin_id], "zos.deployment.get", payload);
  }

  checkWorkload(workload: Workload, targetWorkload: Workload, nodeId: number): boolean {
    let state = false;
    if (workload.result.state === "error") {
      throw new GridClientErrors.Workloads.WorkloadDeployError(
        `Failed to deploy ${workload.type} with name ${workload.name} on node ${nodeId} due to: ${workload.result.message}.`,
      );
    } else if (workload.result.state === "ok") {
      state = true;
    }
    if (workload.version === targetWorkload.version) {
      return state;
    }
    return false;
  }

  async waitForDeployment(twinDeployment: TwinDeployment, timeout = this.config.deploymentTimeoutMinutes) {
    const contract_id = twinDeployment.deployment.contract_id;
    const node_id = await this.nodes.getNodeIdFromContractId(contract_id, this.config.substrateURL);

    const now = new Date().getTime();
    while (new Date().getTime() < now + timeout * 1000 * 60) {
      const deployment = await this.getDeployment(contract_id);
      if (deployment.workloads.length !== twinDeployment.deployment.workloads.length) {
        await new Promise(f => setTimeout(f, 2000));
        continue;
      }
      let readyWorkloads = 0;
      for (const workload of deployment.workloads) {
        for (const w of twinDeployment.deployment.workloads) {
          if (w.name === workload.name) {
            if (this.checkWorkload(workload, w, node_id)) {
              readyWorkloads += 1;
            }
            break;
          }
        }
      }
      if (readyWorkloads === twinDeployment.deployment.workloads.length) {
        return;
      }
      await new Promise(f => setTimeout(f, 2000));
    }
    throw new TimeoutError(`Deployment with contract_id: ${contract_id} failed to be ready after ${timeout} minutes.`);
  }

  async waitForDeployments(twinDeployments: TwinDeployment[], timeout = this.config.deploymentTimeoutMinutes) {
    const promises = twinDeployments.map(t => {
      if ([Operations.deploy, Operations.update].includes(t.operation)) {
        events.emit("logs", `Waiting for deployment with contract_id: ${t.deployment.contract_id} to be ready`);
        return this.waitForDeployment(t, timeout);
      }
    });
    return Promise.all(promises);
  }

  async saveNetworks(twinDeployments: TwinDeployment[], contracts: DeploymentResultContracts) {
    for (const twinDeployment of twinDeployments) {
      if (!twinDeployment.network) {
        return;
      }
      if (twinDeployment.operation === Operations.deploy) {
        for (const workload of twinDeployment.deployment.workloads) {
          if (workload.type !== WorkloadTypes.network) continue;
          const contract = contracts.created.filter(c => c.contractId === twinDeployment.deployment.contract_id);
          if (twinDeployment.network instanceof Network) {
            twinDeployment.network.save(contract[0]);
          }
        }
      }
      // left just to delete the old keys
      else if (twinDeployment.operation === Operations.delete && twinDeployment.network instanceof Network) {
        await twinDeployment.network.save(undefined, twinDeployment.deployment.contract_id);
      }
    }
  }

  deployMerge(twinDeployments: TwinDeployment[]): TwinDeployment[] {
    const deploymentMap = {};
    const deployments = [];

    for (const twinDeployment of twinDeployments) {
      if (twinDeployment.operation !== Operations.deploy) {
        continue;
      }
      const network_workloads = twinDeployment.deployment.workloads.filter(
        workload => workload.type === WorkloadTypes.network || workload.type === WorkloadTypes.networklight,
      );
      if (network_workloads.length > 0 || twinDeployment.publicIps > 0) {
        deployments.push(twinDeployment);
        continue;
      }
      if (Object.keys(deploymentMap).includes(twinDeployment.nodeId.toString())) {
        deploymentMap[twinDeployment.nodeId].deployment.workloads = deploymentMap[
          twinDeployment.nodeId
        ].deployment.workloads.concat(twinDeployment.deployment.workloads);
      } else {
        deploymentMap[twinDeployment.nodeId] = twinDeployment;
      }
    }

    for (const key of Object.keys(deploymentMap)) {
      deployments.push(deploymentMap[key]);
    }
    return deployments;
  }

  _updateToLatest(twinDeployments: TwinDeployment[]): TwinDeployment {
    // all deployment pass should be with the same contract id to merge them to one deployment with all updates
    if (twinDeployments.length === 0) {
      return;
    } else if (twinDeployments.length === 1) {
      twinDeployments[0].deployment.version += 1;
      return twinDeployments[0];
    }

    const workloadMap = {};
    let publicIps = 0;
    let network = null;
    for (const twinDeployment of twinDeployments) {
      for (const workload of twinDeployment.deployment.workloads) {
        if (Object.keys(workloadMap).includes(workload.name)) {
          workloadMap[workload.name].push(workload);
        } else {
          workloadMap[workload.name] = [workload];
        }
      }
      publicIps += twinDeployment.publicIps;
      if (!network && twinDeployment.network) {
        network = twinDeployment.network;
      }
    }

    const workloads = [];
    for (const name of Object.keys(workloadMap)) {
      let w = workloadMap[name][0];
      if (workloadMap[name].length < twinDeployments.length && w.version <= twinDeployments[0].deployment.version) {
        continue;
      }
      for (const workload of workloadMap[name]) {
        if (w.version < workload.version) {
          w = workload;
        }
      }
      workloads.push(w);
    }
    const d = twinDeployments[0];
    d.deployment.workloads = workloads;
    d.publicIps = publicIps;
    d.network = network;
    d.deployment.version += 1;
    return d;
  }

  async updateMerge(twinDeployments: TwinDeployment[]): Promise<TwinDeployment[]> {
    const deploymentMap = {};
    for (const twinDeployment of twinDeployments) {
      if (twinDeployment.operation !== Operations.update) {
        continue;
      }
      if (Object.keys(deploymentMap).includes(String(twinDeployment.deployment.contract_id))) {
        deploymentMap[twinDeployment.deployment.contract_id].push(twinDeployment);
      } else {
        deploymentMap[twinDeployment.deployment.contract_id] = [twinDeployment];
      }

      const contract_id = twinDeployment.deployment.contract_id;
      if (contract_id) {
        const contract = await this.tfclient.contracts.get({ id: contract_id });
        const node_id = contract["contractType"]["nodeContract"]["nodeId"];
        deploymentMap[contract_id][0].nodeId = node_id;
      }
    }
    const deployments = [];
    for (const key of Object.keys(deploymentMap)) {
      deployments.push(this._updateToLatest(deploymentMap[key]));
    }
    return deployments;
  }

  mergeDelete(twinDeployments: TwinDeployment[]): TwinDeployment[] {
    const finalDeployments: TwinDeployment[] = [];
    const contractsList: number[] = [];
    for (const twinDeployment of twinDeployments) {
      if (!contractsList.includes(twinDeployment.deployment.contract_id)) {
        contractsList.push(twinDeployment.deployment.contract_id);
        finalDeployments.push(twinDeployment);
      }
    }
    return finalDeployments;
  }

  async merge(twinDeployments: TwinDeployment[]): Promise<TwinDeployment[]> {
    let deployments = [];
    deployments = deployments.concat(this.deployMerge(twinDeployments));
    const deletedDeployments = twinDeployments.filter(d => d.operation === Operations.delete);
    const deletedContracts = [];
    for (const d of deletedDeployments) {
      deletedContracts.push(d.deployment.contract_id);
    }
    const updatedDeployment = this.updateMerge(twinDeployments);
    deployments = deployments.concat(
      (await updatedDeployment).filter(d => !deletedContracts.includes(d.deployment.contract_id)),
    );
    deployments = deployments.concat(this.mergeDelete(deletedDeployments));
    return deployments;
  }

  async checkFarmIps(twinDeployments: TwinDeployment[]) {
    const farmIPs: Map<number, number> = new Map();

    for (const twinDeployment of twinDeployments) {
      if (twinDeployment.operation !== Operations.deploy) {
        continue;
      }

      if (twinDeployment.publicIps === 0) {
        continue;
      }

      const node = await this.nodes.getNode(twinDeployment.nodeId);
      if (!node) {
        continue;
      }
      if (!farmIPs.has(node.farmId)) {
        farmIPs.set(node.farmId, twinDeployment.publicIps);
      } else {
        farmIPs.set(node.farmId, farmIPs.get(node.farmId)! + twinDeployment.publicIps);
      }
    }

    for (const farmId of farmIPs.keys()) {
      const _farm = await this.tfclient.farms.get({ id: farmId });
      const freeIps = _farm.publicIps.filter(res => res.contractId === 0).length;

      if (freeIps < farmIPs.get(farmId)!) {
        throw new GridClientErrors.Farms.InvalidResourcesError(
          `Farm ${farmId} doesn't have enough public IPs: requested IPs=${farmIPs.get(
            farmId,
          )}, available IPs=${freeIps}.`,
        );
      }
    }
  }

  async checkNodesCapacity(twinDeployments: TwinDeployment[]) {
    const deployments = twinDeployments.reduce((res, twinDeployment) => {
      res[twinDeployment.nodeId] = res[twinDeployment.nodeId] || [];
      res[twinDeployment.nodeId].push(twinDeployment);
      return res;
    }, {} as { [nodeId: number]: TwinDeployment[] });
    await Promise.all(Object.keys(deployments).map(nodeId => this._checkNodeCapacity(+nodeId, deployments[nodeId])));
  }

  private async _checkNodeCapacity(nodeId: number, twinDeployments: TwinDeployment[]) {
    const workloads: Workload[] = [];

    for (const twinDeployment of twinDeployments) {
      if (twinDeployment.operation == Operations.deploy) {
        workloads.push(...twinDeployment.deployment.workloads);
      }

      if (twinDeployment.operation == Operations.update) {
        const deployment_version = twinDeployment.deployment.version;
        workloads.push(
          ...twinDeployment.deployment.workloads.filter(workload => workload.version == deployment_version),
        );
      }
    }

    let hru = 0;
    let sru = 0;
    let mru = 0;
    const rootfsDisks: number[] = [];
    const ssdDisks: number[] = [];
    const hddDisks: number[] = [];
    for (const workload of workloads) {
      if (workload.type == WorkloadTypes.zmachine) {
        rootfsDisks.push(workload.data["size"]);
        sru += workload.data["size"];
      }
      if (workload.type == WorkloadTypes.zmount || workload.type == WorkloadTypes.volume) {
        ssdDisks.push(workload.data["size"]);
        sru += workload.data["size"];
      }
      if (workload.type == WorkloadTypes.zdb) {
        hddDisks.push(workload.data["size"]);
        hru += workload.data["size"];
      }
      if (workload.type == WorkloadTypes.zmachine) {
        mru += workload.data["compute_capacity"].memory;
      }
    }

    if (
      workloads.length !== 0 &&
      !(await this.nodes.nodeHasResources(nodeId, {
        hru: hru / 1024 ** 3,
        sru: sru / 1024 ** 3,
        mru: mru / 1024 ** 3,
      }))
    ) {
      throw new GridClientErrors.Nodes.InvalidResourcesError(
        `Node ${nodeId} doesn't have enough resources: sru=${sru}, mru=${mru} .`,
      );
    }
    if (workloads.length && (rootfsDisks.length || ssdDisks.length || hddDisks.length)) {
      await this.nodes.verifyNodeStoragePoolCapacity(ssdDisks, hddDisks, rootfsDisks, nodeId);
    }
  }

  async validate(twinDeployments: TwinDeployment[]) {
    for (const twinDeployment of twinDeployments) {
      await validateObject(twinDeployment.deployment);
    }
  }

  async getDeploymentFromFactory(contract_id: number) {
    const deployment = await this.getDeployment(contract_id);
    return await this.deploymentFactory.fromObj(deployment);
  }

  async rollback(contracts) {
    // cancel all created contracts and leave the updated ones.
    events.emit("logs", "Rolling back deployments");
    const extrinsics: ExtrinsicResult<number | Contract>[] = [];

    for (const c of contracts.created) {
      if (c.state !== "Deleted") {
        events.emit("logs", `Deleting contract id ${c.contractId}`);
        const extrinsic = await this.tfclient.contracts.cancel({ id: c.contractId });
        extrinsics.push(extrinsic);
      }
    }

    const deploymentsToUpdate: TwinDeployment[] = [];
    for (const c of contracts.updated) {
      const updated_contract_id = c.contractId;
      const updated_deployement = await this.getDeploymentFromFactory(updated_contract_id);

      const original_deployment = this.original_deployments.pop();
      let update_deployment_res;
      if (original_deployment)
        update_deployment_res = await this.deploymentFactory.UpdateDeployment(updated_deployement, original_deployment);

      if (update_deployment_res) {
        update_deployment_res.version += 1;
        update_deployment_res.sign(this.config.twinId, this.config.mnemonic, this.tfclient.keypairType);
        const old_contract = await this.tfclient.contracts.get({ id: update_deployment_res.contract_id });

        const extrinsic = await this.tfclient.contracts.updateNode({
          id: update_deployment_res.contract_id,
          hash: update_deployment_res.challenge_hash(),
          data: old_contract.contractType.nodeContract.deploymentData,
        });
        extrinsics.push(extrinsic);
        deploymentsToUpdate.push(
          new TwinDeployment(
            update_deployment_res,
            Operations.update,
            0,
            old_contract.contractType.nodeContract.nodeId,
            "",
          ),
        );
      }
    }
    await this.tfclient.applyAllExtrinsics(extrinsics);
    for (const d of deploymentsToUpdate) {
      await this.sendToNode(d);
    }
  }

  async PrepareExtrinsic(twinDeployment: TwinDeployment, contracts) {
    const nodeExtrinsics: ExtrinsicResult<Contract>[] = [];
    const nameExtrinsics: ExtrinsicResult<Contract>[] = [];
    const deletedExtrinsics: ExtrinsicResult<number>[] = [];
    if (twinDeployment.operation === Operations.deploy) {
      events.emit("logs", `Deploying on node_id: ${twinDeployment.nodeId}`);
      for (const workload of twinDeployment.deployment.workloads) {
        // check if the deployment need name contract
        if (workload.type === WorkloadTypes.gatewaynameproxy) {
          events.emit("logs", `Check the name contract for the workload with name: ${workload.name}`);
          const extrinsic = await this.createNameContract(workload.data["name"]);
          nameExtrinsics.push(extrinsic);
        }
      }
      const extrinsic = await this.tfclient.contracts.createNode({
        hash: twinDeployment.deployment.challenge_hash(),
        data: twinDeployment.metadata,
        nodeId: twinDeployment.nodeId,
        numberOfPublicIps: twinDeployment.publicIps,
        solutionProviderId: twinDeployment.solutionProviderId,
      });
      nodeExtrinsics.push(extrinsic);
    } else if (twinDeployment.operation === Operations.update) {
      for (const workload of twinDeployment.deployment.workloads) {
        // check if the deployment need name contract
        if (workload.type === WorkloadTypes.gatewaynameproxy) {
          events.emit("logs", `Check the name contract for the workload with name: ${workload.name}`);
          const extrinsic = await this.createNameContract(workload.data["name"]);
          nameExtrinsics.push(extrinsic);
        }
      }
      const old_contract = await this.tfclient.contracts.get({ id: twinDeployment.deployment.contract_id });
      const extrinsic = await this.tfclient.contracts.updateNode({
        id: twinDeployment.deployment.contract_id,
        data: old_contract.contractType.nodeContract.deploymentData,
        hash: twinDeployment.deployment.challenge_hash(),
      });
      nodeExtrinsics.push(extrinsic);
      contracts.updated.push(old_contract);
    } else if (twinDeployment.operation === Operations.delete) {
      events.emit("logs", `Deleting deployment with contract_id: ${twinDeployment.deployment.contract_id}`);
      for (const workload of twinDeployment.deployment.workloads) {
        // check if the deployment needs to delete a name contract
        if (workload.type === WorkloadTypes.gatewaynameproxy) {
          events.emit("logs", `Check the name contract for the workload with name: ${workload.name}`);
          const extrinsic = await this.deleteNameContract(workload.data["name"]);
          if (extrinsic) deletedExtrinsics.push(extrinsic);
        }
      }
      const extrinsic = await this.tfclient.contracts.cancel({ id: twinDeployment.deployment.contract_id });
      deletedExtrinsics.push(extrinsic);
    }
    return { nodeExtrinsics, nameExtrinsics, deletedExtrinsics };
  }

  async handle(twinDeployments: TwinDeployment[]) {
    const kycStatus = await this.kyc.status();
    if (kycStatus !== KycStatus.verified)
      throw new ValidationError(
        "Your account is not verified. Please sign into Threefold Dashboard or Connect mobile app to complete your KYC verification.",
      ); // TODO add KYC manual link.
    events.emit("logs", "Merging workloads");
    twinDeployments = await this.merge(twinDeployments);
    await this.validate(twinDeployments);
    await this.checkNodesCapacity(twinDeployments);
    await this.checkFarmIps(twinDeployments);

    const contracts: DeploymentResultContracts = {
      created: [],
      updated: [],
      deleted: [],
    };
    const resultContracts: DeploymentResultContracts = {
      created: [],
      updated: [],
      deleted: [],
    };
    let nodeExtrinsics: ExtrinsicResult<Contract>[] = [];
    let nameExtrinsics: ExtrinsicResult<Contract>[] = [];
    let deletedExtrinsics: ExtrinsicResult<number>[] = [];
    //TODO: check if it can be done to save the deployment here instead of doing this in the module.
    for (const twinDeployment of twinDeployments) {
      for (const workload of twinDeployment.deployment.workloads) {
        if (!twinDeployment.network) {
          break;
        }
        if (workload.type === WorkloadTypes.network) {
          events.emit("logs", `Updating network workload with name: ${workload.name}`);
          twinDeployment.network.updateWorkload(twinDeployment.nodeId, workload);
        }
      }
      const extrinsics = await this.PrepareExtrinsic(twinDeployment, contracts);
      nodeExtrinsics = nodeExtrinsics.concat(extrinsics.nodeExtrinsics);
      nameExtrinsics = nameExtrinsics.concat(extrinsics.nameExtrinsics);
      deletedExtrinsics = deletedExtrinsics.concat(extrinsics.deletedExtrinsics);
    }
    const extrinsicResults: Contract[] = await this.tfclient.applyAllExtrinsics<Contract>([
      ...nodeExtrinsics,
      ...nameExtrinsics,
    ]);
    for (const contract of extrinsicResults) {
      const updatedContract = contracts.updated.filter(c => c["contractId"] === contract.contractId);
      if (updatedContract.length === 0) contracts.created.push(contract);
    }
    try {
      for (const twinDeployment of twinDeployments) {
        if (twinDeployment.operation === Operations.deploy) {
          events.emit("logs", `Sending deployment to node_id: ${twinDeployment.nodeId}`);
          for (const contract of extrinsicResults) {
            if (twinDeployment.deployment.challenge_hash() === contract.contractType.nodeContract.deploymentHash) {
              twinDeployment.deployment.contract_id = contract.contractId;
              if (
                twinDeployment.returnNetworkContracts ||
                !(
                  twinDeployment.deployment.workloads.length === 1 &&
                  twinDeployment.deployment.workloads[0].type === WorkloadTypes.network
                )
              )
                resultContracts.created.push(contract);
              break;
            }
          }
          await this.sendToNode(twinDeployment);
          events.emit(
            "logs",
            `A deployment has been created on node_id: ${twinDeployment.nodeId} with contract_id: ${twinDeployment.deployment.contract_id}`,
          );
        } else if (twinDeployment.operation === Operations.update) {
          const old_contract_id = twinDeployment.deployment.contract_id;
          if (old_contract_id) {
            this.original_deployments.push(await this.getDeploymentFromFactory(old_contract_id));
          }
          events.emit("logs", `Updating deployment with contract_id: ${twinDeployment.deployment.contract_id}`);
          for (const contract of extrinsicResults) {
            if (twinDeployment.deployment.challenge_hash() === contract.contractType.nodeContract.deploymentHash) {
              twinDeployment.nodeId = contract.contractType.nodeContract.nodeId;
              if (
                twinDeployment.returnNetworkContracts ||
                !(
                  twinDeployment.deployment.workloads.length === 1 &&
                  twinDeployment.deployment.workloads[0].type === WorkloadTypes.network
                )
              )
                resultContracts.updated.push(contract);
              break;
            }
          }
          await this.sendToNode(twinDeployment);
          events.emit("logs", `Deployment has been updated with contract_id: ${twinDeployment.deployment.contract_id}`);
        }
      }
      const deletedResult = await this.tfclient.applyAllExtrinsics<number>(deletedExtrinsics);
      if (deletedExtrinsics.length > 0) {
        for (const id of deletedResult) {
          resultContracts.deleted.push({ contractId: id });
          events.emit("logs", `Deployment has been deleted with contract_id: ${id}`);
        }
      }
      await this.waitForDeployments(twinDeployments);
      await this.saveNetworks(twinDeployments, contracts);
    } catch (e) {
      await this.rollback(contracts);
      if (e instanceof BaseError) throw e;
      throw new GridClientError(`Couldn't handle twin Deployment due to: ${e} .`);
    }
    return resultContracts;
  }
}

export { TwinDeploymentHandler };
