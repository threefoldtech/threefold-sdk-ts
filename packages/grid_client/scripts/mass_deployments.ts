import fs from "fs";
import path from "path";
import {
  FarmFilterOptions,
  FilterOptions,
  generateString,
  GridClient,
  MachineModel,
  MachinesModel,
  NetworkModel,
  NodeInfo,
  TwinDeployment,
} from "../src";
import { config, getClient } from "./client_loader";
import { log } from "./utils";

// Define output file paths
const logDir = "./logs";
const onlineNodesFile = path.join(logDir, "online_nodes.log");
const offlineNodesFile = path.join(logDir, "offline_nodes.log");
const deploymentSuccessFile = path.join(logDir, "deployments_success.log");
const deploymentErrorFile = path.join(logDir, "deployments_error.log");
const generalErrorFile = path.join(logDir, "general_errors.log");
const metricsFile = path.join(logDir, "deployments_metrics.prom");

// Ensure log directory exists
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir);
}

// Function to write to a log file
function writeToFile(filePath: string, data: string) {
  fs.appendFileSync(filePath, `${data}\n`, "utf8");
}

async function pingNodes(
  grid3: GridClient,
  nodes: NodeInfo[],
): Promise<Promise<{ node: NodeInfo; error?: Error; res?: unknown }[]>> {
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

async function countDeployments(filePath: string, keyword: string) {
  try {
    const data = fs.readFileSync(filePath, "utf8");
    const lines = data.split("\n").filter(line => line.includes(keyword));
    return lines.length;
  } catch (err) {
    console.error(`Error reading the file ${filePath}:`, err);
    return 0;
  }
}

async function writeMetricsFile(successCount: number, failedCount: number) {
  const metricsData = `Total_Successful_Deployments ${successCount}\nTotal_Failed_Deployments ${failedCount}`;
  fs.writeFileSync(metricsFile, metricsData, "utf8");
}

async function main() {
  const grid3 = await getClient();

  // Timeout for deploying vm is 2 min
  grid3.clientOptions.deploymentTimeoutMinutes = 2;
  await grid3._connect();

  const errors: any = [];
  const offlineNodes: number[] = [];
  let failedCount = 0;
  let successCount = 0;
  const batchSize = 50;
  const totalVMs = 250;
  const batches = totalVMs / batchSize;

  console.time("Farms Time");
  const farms = await grid3.capacity.filterFarms({
    nodeMRU: 256 / 1024,
    nodeSRU: 1,
    publicIp: false,
    availableFor: await grid3.twins.get_my_twin_id(),
    randomize: true,
  } as FarmFilterOptions);
  console.timeEnd("Farms Time");

  if (farms.length < 1) {
    const errorMsg = "No farms found";
    writeToFile(generalErrorFile, errorMsg);
    throw new Error(errorMsg);
  }

  console.time("Total Deployment Time");

  for (let batch = 0; batch < batches; batch++) {
    console.time("Batch " + (batch + 1));

    const farmIds = farms.map(farm => farm.farmId);
    const nodes = await grid3.capacity.filterNodes({
      cru: 1,
      mru: 256 / 1024,
      sru: 1,
      availableFor: await grid3.twins.get_my_twin_id(),
      farmIds: farmIds,
      randomize: true,
    } as FilterOptions);

    console.time("Ping Nodes");
    const results = await pingNodes(grid3, nodes);
    console.timeEnd("Ping Nodes");

    // Check nodes results
    results.forEach(({ node, res, error }) => {
      if (res) {
        writeToFile(onlineNodesFile, `Node ${node.nodeId} is online`);
      } else {
        offlineNodes.push(node.nodeId);
        writeToFile(offlineNodesFile, `Node ${node.nodeId} is offline`);
        if (error) {
          writeToFile(generalErrorFile, `Node ${node.nodeId} Error: ${error}`);
        }
      }
    });

    const onlineNodes = nodes.filter(node => !offlineNodes.includes(node.nodeId));

    const batchVMs: MachinesModel[] = [];
    for (let i = 0; i < batchSize; i++) {
      if (onlineNodes.length <= 0) {
        const errorMsg = "No online nodes available for deployment";
        errors.push(errorMsg);
        writeToFile(generalErrorFile, errorMsg);
        continue;
      }

      const selectedNode = onlineNodes.pop();
      const vmName = "vm" + generateString(8);

      const vm = new MachineModel();
      vm.name = vmName;
      vm.node_id = selectedNode.nodeId;
      vm.disks = [];
      vm.public_ip = false;
      vm.planetary = true;
      vm.mycelium = false;
      vm.cpu = 1;
      vm.memory = 256;
      vm.rootfs_size = 1;
      vm.flist = "https://hub.grid.tf/tf-official-apps/base:latest.flist";
      vm.entrypoint = "/sbin/zinit init";
      vm.env = {
        SSH_KEY: config.ssh_key,
      };

      const n = new NetworkModel();
      n.name = "nw" + generateString(5);
      n.ip_range = "10.238.0.0/16";
      n.addAccess = true;

      const vms = new MachinesModel();
      vms.name = "batch" + (batch + 1);
      vms.network = n;
      vms.machines = [vm];
      vms.metadata = "";
      vms.description = `Test deploying vm ${vm.name} - Batch ${batch + 1}`;

      batchVMs.push(vms);
    }

    const deploymentPromises = batchVMs.map(async vms => {
      try {
        const [twinDeployments, _, __] = await grid3.machines._createDeployment(vms);
        return { twinDeployments };
      } catch (error) {
        const errorMsg = `Deployment Error: ${error}`;
        writeToFile(deploymentErrorFile, errorMsg);
        return { twinDeployments: null };
      }
    });

    const deploymentResults = await Promise.allSettled(deploymentPromises);

    deploymentResults.forEach(result => {
      if (result.status === "fulfilled" && result.value.twinDeployments) {
        writeToFile(deploymentSuccessFile, `Batch ${batch + 1} deployed successfully`);
      } else {
        failedCount += 1;
      }
    });

    console.timeEnd("Batch " + (batch + 1));
  }

  console.timeEnd("Total Deployment Time");

  successCount = await countDeployments(deploymentSuccessFile, "deployed successfully");
  failedCount = await countDeployments(deploymentErrorFile, "Deployment Error");

  writeToFile(generalErrorFile, `Total Failed Deployments: ${failedCount}`);
  writeToFile(deploymentSuccessFile, `Total Successful Deployments: ${successCount}`);

  console.log("Total Successful Deployments:", successCount);
  console.log("Total Failed Deployments:", failedCount);

  await writeMetricsFile(successCount, failedCount);

  await grid3.disconnect();
}

main();

