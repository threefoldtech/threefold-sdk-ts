import { Contract } from "@threefold/tfchain_client";
import { ValidationError } from "@threefold/types";

import {
  Deployment,
  DeploymentResultContracts,
  events,
  FarmFilterOptions,
  FilterOptions,
  generateString,
  GridClient,
  KycStatus,
  MachineModel,
  MachinesModel,
  NetworkModel,
  NodeInfo,
  Operations,
  TwinDeployment,
} from "../src";
import { config, getClient } from "./client_loader";
import { log } from "./utils";

async function handle(grid3: GridClient, twinDeployments: TwinDeployment[]) {
  const kycStatus = await grid3.machines.twinDeploymentHandler.kyc.status();
  if (kycStatus !== KycStatus.verified) {
    throw new ValidationError(
      "Your account is not verified. Please sign into Threefold Dashboard or Connect mobile app to complete your KYC verification.",
    );
  }

  events.emit("logs", "Validating workloads");
  await grid3.machines.twinDeploymentHandler.validate(twinDeployments);
  await grid3.machines.twinDeploymentHandler.checkNodesCapacity(twinDeployments);
  await grid3.machines.twinDeploymentHandler.checkFarmIps(twinDeployments);

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

  const successfulNodesSet: number[] = [];
  const failedNodesSet: number[] = [];
  const original_deployments: Deployment[] = [];

  const deploymentPromises: Promise<void>[] = [];

  for (const twinDeployment of twinDeployments) {
    deploymentPromises.push(
      (async () => {
        try {
          const extrinsics = await grid3.machines.twinDeploymentHandler.PrepareExtrinsic(twinDeployment, contracts);
          const extrinsicResults: Contract[] =
            await grid3.machines.twinDeploymentHandler.tfclient.applyAllExtrinsics<Contract>([
              ...extrinsics.nodeExtrinsics,
              ...extrinsics.nameExtrinsics,
            ]);

          for (const contract of extrinsicResults) {
            const updatedContract = contracts.updated.filter(c => c["contractId"] === contract.contractId);
            if (updatedContract.length === 0) contracts.created.push(contract);
          }

          if (twinDeployment.operation === Operations.deploy) {
            events.emit("logs", `Sending deployment to node_id: ${twinDeployment.nodeId}`);
            for (const contract of extrinsicResults) {
              if (twinDeployment.deployment.challenge_hash() === contract.contractType.nodeContract.deploymentHash) {
                twinDeployment.deployment.contract_id = contract.contractId;
                resultContracts.created.push(contract);
                break;
              }
            }
            await grid3.machines.twinDeploymentHandler.sendToNode(twinDeployment);
            successfulNodesSet.push(twinDeployment.nodeId);
          } else if (twinDeployment.operation === Operations.update) {
            const old_contract_id = twinDeployment.deployment.contract_id;
            if (old_contract_id) {
              original_deployments.push(
                await grid3.machines.twinDeploymentHandler.getDeploymentFromFactory(old_contract_id),
              );
            }
            events.emit("logs", `Updating deployment with contract_id: ${twinDeployment.deployment.contract_id}`);
            for (const contract of extrinsicResults) {
              if (twinDeployment.deployment.challenge_hash() === contract.contractType.nodeContract.deploymentHash) {
                twinDeployment.nodeId = contract.contractType.nodeContract.nodeId;
                resultContracts.updated.push(contract);
                break;
              }
            }
            await grid3.machines.twinDeploymentHandler.sendToNode(twinDeployment);
            successfulNodesSet.push(twinDeployment.nodeId);
          }
        } catch (error) {
          events.emit("logs", `Failed deployment on node_id: ${twinDeployment.nodeId} due to error: ${error}`);
          successfulNodesSet.push(twinDeployment.nodeId);
        }
      })(),
    );
  }

  const res = await Promise.allSettled(deploymentPromises);
  console.log("Deployment Results in handle:", res);
  log("Successful Nodes: " + successfulNodesSet);
  log("Failed Nodes: " + failedNodesSet);
  return { resultContracts, successfulNodesSet, failedNodesSet };
}

async function pingNodes(grid3: GridClient, nodes: NodeInfo[]) {
  const pingPromises = nodes.map(async node => {
    try {
      const res = await grid3.zos.pingNode({ nodeId: node.nodeId });
      return { node, res };
    } catch (error) {
      return { node, error };
    }
  });

  const result = await Promise.allSettled(pingPromises).then(results =>
    results.flatMap(r => (r.status === "fulfilled" ? r.value : [])),
  );

  return result;
}
async function main() {
  const grid3 = await getClient();

  grid3.clientOptions.deploymentTimeoutMinutes = 2;
  await grid3._connect();

  const errors: any = [];
  const offlineNodes: number[] = [];
  let failedCount = 0;
  let successCount = 0;
  const batchSize = 10;
  const totalVMs = 50;
  const batches = totalVMs / batchSize;
  const allSuccessfulNodes = new Set<number>();
  const allFailedNodes = new Set<number>();

  // resources
  const cru = 1;
  const mru = 256;
  const rootFs = 1;
  const publicIp = false;

  console.time("Farms Time");
  const farms = await grid3.capacity.filterFarms({
    nodeMRU: mru / 1024,
    nodeSRU: rootFs,
    publicIp: publicIp,
    availableFor: await grid3.twins.get_my_twin_id(),
    randomize: true,
  } as FarmFilterOptions);
  console.timeEnd("Farms Time");

  if (farms.length < 1) {
    throw new Error("No farms found");
  }

  console.time("Total Deployment Time");

  for (let batch = 0; batch < batches; batch++) {
    console.time("Batch " + (batch + 1));

    const farmIds = farms.map(farm => farm.farmId);
    const nodes = await grid3.capacity.filterNodes({
      cru: cru,
      mru: mru / 1024,
      sru: rootFs,
      availableFor: await grid3.twins.get_my_twin_id(),
      farmIds: farmIds,
      randomize: true,
    } as FilterOptions);

    console.time("Ping Nodes");
    const results = await pingNodes(grid3, nodes);
    console.timeEnd("Ping Nodes");

    results.forEach(({ node, res, error }) => {
      if (res) {
        console.log(`Node ${node.nodeId} is online`);
      } else {
        offlineNodes.push(node.nodeId);
        console.log(`Node ${node.nodeId} is offline`);
        if (error) console.error("Error:", error);
      }
    });

    const onlineNodes = nodes.filter(node => !offlineNodes.includes(node.nodeId));
    const batchVMs: MachinesModel[] = [];
    for (let i = 0; i < batchSize && onlineNodes.length > 0; i++) {
      const vmName = "vm" + generateString(8);
      const selectedNode = onlineNodes.pop();

      // create vm node Object
      const vm = new MachineModel();
      vm.name = vmName;
      vm.node_id = selectedNode.nodeId;
      vm.disks = [];
      vm.public_ip = publicIp;
      vm.planetary = true;
      vm.mycelium = false;
      vm.cpu = cru;
      vm.memory = mru;
      vm.rootfs_size = rootFs;
      vm.flist = "https://hub.grid.tf/tf-official-apps/base:latest.flist";
      vm.entrypoint = "/sbin/zinit init";
      vm.env = {
        SSH_KEY: config.ssh_key,
      };

      // create network model for each vm
      const n = new NetworkModel();
      n.name = "nw" + generateString(5);
      n.ip_range = "10.238.0.0/16";
      n.addAccess = true;

      // create VMs Object for each vm
      const vms = new MachinesModel();
      vms.name = "batch" + (batch + 1);
      vms.network = n;
      vms.machines = [vm];
      vms.metadata = "";
      vms.description = `Test deploying vm with name ${vm.name} - Batch ${batch + 1}`;

      batchVMs.push(vms);
    }

    const allTwinDeployments: TwinDeployment[] = [];

    const deploymentPromises = batchVMs.map(async vms => {
      try {
        const [twinDeployments] = await grid3.machines._createDeployment(vms);
        return twinDeployments;
      } catch (error) {
        log(`Error creating deployment for batch ${batch + 1}: ${error}`);
        return [];
      }
    });
    console.time("Preparing Batch " + (batch + 1));
    const deploymentResults = await Promise.allSettled(deploymentPromises).then(results =>
      results.flatMap(r => (r.status === "fulfilled" ? r.value : [])),
    );

    allTwinDeployments.push(...deploymentResults);

    if (allTwinDeployments.length > 0) {
      try {
        const { resultContracts, successfulNodesSet, failedNodesSet } = await handle(grid3, allTwinDeployments);

        successfulNodesSet.forEach(node => allSuccessfulNodes.add(node));
        failedNodesSet.forEach(node => allFailedNodes.add(node));

        log(`Successfully handled deployments for Batch ${batch + 1}`);
        successCount = allSuccessfulNodes.size;
      } catch (error) {
        errors.push(`Error handling deployments for Batch ${batch + 1}: ${error}`);
        failedCount = allFailedNodes.size;
      }
    } else {
      log(`No deployments created for Batch ${batch + 1}`);
    }

    log(`Batch ${batch + 1} Summary:`);
    log(`- Successful Deployments: ${successCount}`);
    log(`- Failed Deployments: ${failedCount}`);
    log("---------------------------------------------");
  }

  console.timeEnd("Total Deployment Time");

  log("Final Summary:");
  log(`- Total Successful Deployments: ${successCount}`);
  log(`- Total Failed Deployments: ${failedCount}`);
  log(`- Offline Nodes: ${offlineNodes.join(", ")}`);
  log(`- All Successful Deployments on Nodes: ${Array.from(allSuccessfulNodes).join(", ")}`);
  log(`- All Failed Deployments on Nodes: ${Array.from(allFailedNodes).join(", ")}`);

  await grid3.disconnect();
}

main();
