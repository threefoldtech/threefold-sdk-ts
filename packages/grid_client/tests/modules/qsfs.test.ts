import {
  FilterOptions,
  generateString,
  GridClient,
  K8SModel,
  MachinesModel,
  QSFSZDBSModel,
  randomChoice,
} from "../../src";
import { config, getClient } from "../client_loader";
import { GBToBytes, generateInt, getOnlineNode, k8sWait, log, RemoteRun, splitIP } from "../utils";

jest.setTimeout(300000);

let gridClient: GridClient;
let deploymentName: string;

beforeAll(async () => {
  gridClient = await getClient();
  deploymentName = generateString(15);
  gridClient.clientOptions.projectName = `kubernetes/${deploymentName}`;
  gridClient._connect();
  return gridClient;
});

//Private IP Regex
const ipRegex = /(^127\.)|(^10\.)|(^172\.1[6-9]\.)|(^172\.2[0-9]\.)|(^172\.3[0-1]\.)|(^192\.168\.)/;

test("TC1234 - QSFS: Deploy QSFS underneath a VM", async () => {
  /**********************************************
     Test Suite: Grid3_Client_TS (Automated)
     Test Cases: TC1234 - QSFS: Deploy QSFS underneath a VM
     Scenario:
        - Generate Test Data/VM Config/QSFS Config.
        - Select a Node To Deploy the VM on.
        - Select Nodes To Deploy the QSFS on.
        - Deploy the QSFS.
        - Deploy the VM.
        - Assert that the generated data matches
          the deployment details.
        - SSH to the VM and Verify that you can
          access it.
        - Assert that the Environment Variables
          Were passed successfully to the VM.
        - Verify the resources of the VM.
        - Assert that the QSFS was successfully
          Mounted in the VM.
    **********************************************/

  //Test Data
  const qsfsZdbName = generateString(15);
  const qsfsCount = generateInt(4, 8);
  const qsfsNodes = [];
  const qsfsPassword = generateString(15);
  let qsfsDiskSize = generateInt(1, 20);
  let cpu = generateInt(1, 4);
  let memory = generateInt(256, 4096);
  let rootfsSize = generateInt(2, 5);
  const networkName = generateString(15);
  const vmName = generateString(15);
  const disks = [];
  const publicIP = false;
  const ipRangeClassA = "10." + generateInt(1, 255) + ".0.0/16";
  const ipRangeClassB = "172." + generateInt(16, 31) + ".0.0/16";
  const ipRangeClassC = "192.168.0.0/16";
  const ipRange = randomChoice([ipRangeClassA, ipRangeClassB, ipRangeClassC]);
  const metadata = "{'deploymentType': 'vm'}";
  const description = "test deploying VM via ts grid3 client";
  const qsfsName = generateString(15);
  const qsfsEncryptionKey = generateString(15);
  const qsfsPrefix = generateString(15);
  let qsfsCache = generateInt(1, 5);
  const qsfsMountPoint = "/" + generateString(10);
  const envVarValue = generateString(20);

  //QSFS Nodes Selection
  let allNodes;
  try {
    allNodes = await gridClient.capacity.filterNodes({
      hru: (qsfsDiskSize * qsfsCount) / 2,
      sru: qsfsCache,
      farmId: 1,
      availableFor: await gridClient.twins.get_my_twin_id(),
    } as FilterOptions);
    if (allNodes.length >= 2) {
      const qsfsNode1 = await getOnlineNode(allNodes);
      if (qsfsNode1 == -1) throw new Error("no nodes available to complete this test");
      let qsfsNode2 = await getOnlineNode(allNodes);
      if (qsfsNode2 == -1) throw new Error("no nodes available to complete this test");
      let maxCount = 3;
      while (qsfsNode1 == qsfsNode2 && maxCount > 0) {
        qsfsNode2 = await getOnlineNode(allNodes);
        if (qsfsNode2 == -1) throw new Error("no nodes available to complete this test");
        maxCount--;
      }
      qsfsNodes.push(qsfsNode1, qsfsNode2);
    } else {
      throw Error("Couldn't find nodes for qsfs");
    }
  } catch (error) {
    //Log the resources that were not found.
    log("A Node was not found with the generated resources." + error);
    log("Regenerating test data with lower resources....");

    //Generate lower resources.
    qsfsDiskSize = generateInt(1, qsfsDiskSize);
    qsfsCache = generateInt(1, qsfsCache);

    allNodes = await gridClient.capacity.filterNodes({
      hru: (qsfsDiskSize * qsfsCount) / 2,
      sru: qsfsCache,
      farmId: 1,
      availableFor: await gridClient.twins.get_my_twin_id(),
    } as FilterOptions);
    if (allNodes.length >= 2) {
      const qsfsNode1 = await getOnlineNode(allNodes);
      if (qsfsNode1 == -1) throw new Error("no nodes available to complete this test");
      let qsfsNode2 = await getOnlineNode(allNodes);
      if (qsfsNode2 == -1) throw new Error("no nodes available to complete this test");
      let maxCount = 3;
      while (qsfsNode1 == qsfsNode2 && maxCount > 0) {
        qsfsNode2 = await getOnlineNode(allNodes);
        if (qsfsNode2 == -1) throw new Error("no nodes available to complete this test");
        maxCount--;
      }
      qsfsNodes.push(qsfsNode1, qsfsNode2);
    } else {
      throw Error("Couldn't find nodes for qsfs");
    }
  }

  //VM Node Selection
  let nodes;
  try {
    nodes = await gridClient.capacity.filterNodes({
      cru: cpu,
      mru: memory / 1024,
      sru: rootfsSize,
      farmId: 1,
      availableFor: await gridClient.twins.get_my_twin_id(),
    } as FilterOptions);
  } catch (error) {
    //Log the resources that were not found.
    log("A Node was not found with the generated resources." + error);
    log("Regenerating test data with lower resources....");

    //Generate lower resources.
    cpu = generateInt(1, cpu);
    memory = generateInt(256, memory);
    rootfsSize = generateInt(2, rootfsSize);

    //Search for another node with lower resources.
    nodes = await gridClient.capacity.filterNodes({
      cru: cpu,
      mru: memory / 1024,
      sru: rootfsSize,
      farmId: 1,
      availableFor: await gridClient.twins.get_my_twin_id(),
    } as FilterOptions);
  }
  const nodeId = await getOnlineNode(nodes);
  if (nodeId == -1) throw new Error("no nodes available to complete this test");

  //QSFS Model
  const qsfs: QSFSZDBSModel = {
    name: qsfsZdbName,
    count: qsfsCount,
    node_ids: qsfsNodes,
    password: qsfsPassword,
    disk_size: qsfsDiskSize,
  };

  const qsfsRes = await gridClient.qsfs_zdbs.deploy(qsfs);
  log(qsfsRes);

  //QSFS Contracts Assertions
  expect(qsfsRes.contracts.created).toHaveLength(2);
  expect(qsfsRes.contracts.updated).toHaveLength(0);
  expect(qsfsRes.contracts.deleted).toHaveLength(0);
  expect(qsfsNodes).toContain(qsfsRes.contracts.created[0].contractType.nodeContract.nodeId);
  expect(qsfsNodes).toContain(qsfsRes.contracts.created[1].contractType.nodeContract.nodeId);

  //VMs Model
  const vms: MachinesModel = {
    name: deploymentName,
    network: {
      name: networkName,
      ip_range: ipRange,
    },
    machines: [
      {
        name: vmName,
        node_id: nodeId,
        cpu: cpu,
        memory: memory,
        rootfs_size: rootfsSize,
        disks: disks,
        flist: "https://hub.grid.tf/tf-official-apps/threefoldtech-ubuntu-22.04.flist",
        entrypoint: "/sbin/zinit init",
        public_ip: publicIP,
        planetary: true,
        mycelium: true,
        qsfs_disks: [
          {
            qsfs_zdbs_name: qsfsZdbName,
            name: qsfsName,
            minimal_shards: 2,
            expected_shards: 4,
            encryption_key: qsfsEncryptionKey,
            prefix: qsfsPrefix,
            cache: qsfsCache,
            mountpoint: qsfsMountPoint,
          },
        ],
        env: {
          SSH_KEY: config.ssh_key,
          TEST_KEY: envVarValue,
        },
        solutionProviderId: null,
      },
    ],
    metadata: metadata,
    description: description,
  };
  const res = await gridClient.machines.deploy(vms);
  log(res);

  //VM Contract Assertions
  expect(res.contracts.created).toHaveLength(1);
  expect(res.contracts.updated).toHaveLength(0);
  expect(res.contracts.deleted).toHaveLength(0);

  //VM List Assertions
  const vmsList = await gridClient.machines.list();
  log(vmsList);
  expect(vmsList.length).toBeGreaterThanOrEqual(1);
  expect(vmsList).toContain(vms.name);

  const result = await gridClient.machines.getObj(vms.name);
  log(result);

  //VM Assertions
  expect(result[0].nodeId).toBe(nodeId);
  expect(result[0].status).toBe("ok");
  expect(result[0].flist).toBe(vms.machines[0].flist);
  expect(result[0].entrypoint).toBe(vms.machines[0].entrypoint);
  expect(result[0].interfaces[0]["network"]).toBe(networkName);
  expect(result[0].interfaces[0]["ip"]).toContain(splitIP(vms.network.ip_range));
  expect(result[0].interfaces[0]["ip"]).toMatch(ipRegex);
  expect(result[0].capacity["cpu"]).toBe(cpu);
  expect(result[0].capacity["memory"]).toBe(memory);
  expect(result[0].planetary).toBeDefined();
  expect(result[0].myceliumIP).toBeDefined();
  expect(result[0].publicIP).toBeNull();
  expect(result[0].description).toBe(description);

  //QSFS Assertions
  expect(result[0].mounts[0]["name"]).toBe(qsfsName);
  expect(result[0].mounts[0]["mountPoint"]).toBe(qsfsMountPoint);
  expect(result[0].mounts[0]["cache"]).toBe(GBToBytes(qsfsCache));
  expect(result[0].mounts[0]["prefix"]).toBe(qsfsPrefix);
  expect(result[0].mounts[0]["qsfs_zdbs_name"]).toBe(qsfsZdbName);
  expect(result[0].mounts[0]["state"]).toBe("ok");
  expect(result[0].mounts[0]["metricsEndpoint"]).toBeDefined();

  const host = result[0].planetary;
  const user = "root";

  //SSH to the Created VM
  const ssh = await RemoteRun(host, user);

  try {
    //Verify that the added env var was successfully passed to the VM.
    await ssh.execCommand("cat /proc/1/environ").then(async function (result) {
      log(result.stdout);
      expect(result.stdout).toContain(envVarValue);
    });

    //Verify VM Resources(CPU)
    await ssh.execCommand("lscpu").then(async function (result) {
      const splittedRes = result.stdout.split("\n");
      log(splittedRes[4]);
      expect(splittedRes[4]).toContain(cpu.toString());
    });
    //Verify VM Resources(Memory)
    await ssh.execCommand("free -m").then(async function (result) {
      const splittedRes = result.stdout.split("\n");
      log(splittedRes[1]);
      const memoryValue = splittedRes[1].match(/^\d+|\d+\b|\d+(?=\w)/g);
      expect(+memoryValue[0]).toBeGreaterThanOrEqual(memory - memory * 0.2);
      expect(+memoryValue[0]).toBeLessThan(memory);
    });

    //Verify that the QSFS disk was added successfully.
    await ssh.execCommand("df -h").then(async function (result) {
      const splittedRes = result.stdout.split("\n");
      log(splittedRes[4]);
      expect(splittedRes[4]).toContain(qsfsName);
      expect(splittedRes[4]).toContain(qsfsMountPoint);
    });
  } finally {
    //Disconnect from the machine
    await ssh.dispose();
  }
});

test("TC1235 - QSFS: Deploy QSFS Underneath a Kubernetes Cluster", async () => {
  /**********************************************
     Test Suite: Grid3_Client_TS (Automated)
     Test Cases: TC1235 - QSFS: Deploy QSFS Underneath a Kubernetes Cluster
     Scenario:
        - Generate Test Data/Master/Worker Config/QSFS Config.
        - Select Two Different Nodes To Deploy the Master
          and Worker on.
        - Select Nodes To Deploy the QSFS on.
        - Deploy the QSFS.
        - Deploy the Kubernetes Cluster.
        - Assert that the generated data matches
          the deployment details.
        - SSH to the Master and Verify that you can
          access it.
        - Verify the resources of the Master & Worker.
        - Assert that the Master and Worker are available
          when you execute `kubectl get nodes`.
        - Assert that the QSFS was successfully
          Mounted in the Master.
    **********************************************/

  //Test Data
  const qsfsZdbName = generateString(15);
  const qsfsCount = generateInt(4, 8);
  const qsfsNodes = [];
  const qsfsPassword = generateString(15);
  let qsfsDiskSize = generateInt(1, 20);
  const secret = generateString(15);
  const networkName = generateString(15);
  const ipRangeClassA = "10." + generateInt(1, 255) + ".0.0/16";
  const ipRangeClassB = "172." + generateInt(16, 31) + ".0.0/16";
  const ipRangeClassC = "192.168.0.0/16";
  const ipRange = randomChoice([ipRangeClassA, ipRangeClassB, ipRangeClassC]);
  const masterName = "MR" + generateString(5);
  let masterCpu = generateInt(1, 4);
  let masterMemory = generateInt(1024, 4096);
  let masterRootfsSize = generateInt(2, 5);
  let masterDiskSize = generateInt(1, 20);
  const masterPublicIp = false;
  const workerName = "WR" + generateString(5);
  let workerCpu = generateInt(1, 4);
  let workerMemory = generateInt(1024, 4096);
  let workerRootfsSize = generateInt(2, 5);
  let workerDiskSize = generateInt(1, 20);
  const workerPublicIp = false;
  const metadata = "{'deploymentType': 'k8s}";
  const description = "test deploying K8s via ts grid3 client";
  const qsfsName = generateString(15);
  const qsfsEncryptionKey = generateString(15);
  const qsfsPrefix = generateString(15);
  let qsfsCache = generateInt(1, 5);
  const qsfsMountPoint = "/" + generateString(10);

  //QSFS Nodes Selection
  let allNodes;
  try {
    allNodes = await gridClient.capacity.filterNodes({
      hru: (qsfsDiskSize * qsfsCount) / 2,
      sru: qsfsCache,
      farmId: 1,
      availableFor: await gridClient.twins.get_my_twin_id(),
    } as FilterOptions);
    if (allNodes.length >= 2) {
      const qsfsNode1 = await getOnlineNode(allNodes);
      if (qsfsNode1 == -1) throw new Error("no nodes available to complete this test");
      let qsfsNode2 = await getOnlineNode(allNodes);
      if (qsfsNode2 == -1) throw new Error("no nodes available to complete this test");
      let maxCount = 3;
      while (qsfsNode1 == qsfsNode2 && maxCount > 0) {
        qsfsNode2 = await getOnlineNode(allNodes);
        if (qsfsNode2 == -1) throw new Error("no nodes available to complete this test");
        maxCount--;
      }
      qsfsNodes.push(qsfsNode1, qsfsNode2);
    } else {
      throw Error("Couldn't find nodes for qsfs");
    }
  } catch (error) {
    //Log the resources that were not found.
    log("A Node was not found with the generated resources." + error);
    log("Regenerating test data with lower resources....");

    //Generate lower resources.
    qsfsDiskSize = generateInt(1, qsfsDiskSize);
    qsfsCache = generateInt(1, qsfsCache);

    allNodes = await gridClient.capacity.filterNodes({
      hru: (qsfsDiskSize * qsfsCount) / 2,
      sru: qsfsCache,
      farmId: 1,
      availableFor: await gridClient.twins.get_my_twin_id(),
    } as FilterOptions);
    if (allNodes.length >= 2) {
      const qsfsNode1 = await getOnlineNode(allNodes);
      if (qsfsNode1 == -1) throw new Error("no nodes available to complete this test");
      let qsfsNode2 = await getOnlineNode(allNodes);
      if (qsfsNode2 == -1) throw new Error("no nodes available to complete this test");
      let maxCount = 3;
      while (qsfsNode1 == qsfsNode2 && maxCount > 0) {
        qsfsNode2 = await getOnlineNode(allNodes);
        if (qsfsNode2 == -1) throw new Error("no nodes available to complete this test");
        maxCount--;
      }
      qsfsNodes.push(qsfsNode1, qsfsNode2);
    } else {
      throw Error("Couldn't find nodes for qsfs");
    }
  }

  //Master Node Selection
  let masterNode;
  try {
    masterNode = await gridClient.capacity.filterNodes({
      cru: masterCpu,
      mru: masterMemory / 1024,
      sru: masterRootfsSize + masterDiskSize,
      farmId: 1,
      availableFor: await gridClient.twins.get_my_twin_id(),
    } as FilterOptions);
  } catch (error) {
    //Log the resources that were not found.
    log("A Node was not found with the generated resources." + error);
    log("Regenerating test data with lower resources....");

    //Generate lower resources.
    masterCpu = generateInt(1, masterCpu);
    masterMemory = generateInt(1024, masterMemory);
    masterRootfsSize = generateInt(2, masterRootfsSize);
    masterDiskSize = generateInt(1, masterDiskSize);

    //Search for another node with lower resources.
    masterNode = await gridClient.capacity.filterNodes({
      cru: masterCpu,
      mru: masterMemory / 1024,
      sru: masterRootfsSize + masterDiskSize,
      farmId: 1,
      availableFor: await gridClient.twins.get_my_twin_id(),
    } as FilterOptions);
  }

  //Worker Node Selection
  let workerNode;
  try {
    workerNode = await gridClient.capacity.filterNodes({
      cru: workerCpu,
      mru: workerMemory / 1024,
      sru: workerRootfsSize + workerDiskSize,
      farmId: 1,
      availableFor: await gridClient.twins.get_my_twin_id(),
    } as FilterOptions);
  } catch (error) {
    //Log the resources that were not found.
    log("A Node was not found with the generated resources." + error);
    log("Regenerating test data with lower resources....");

    //Generate lower resources.
    workerCpu = generateInt(1, workerCpu);
    workerMemory = generateInt(1024, workerMemory);
    workerRootfsSize = generateInt(2, workerRootfsSize);
    workerDiskSize = generateInt(1, workerDiskSize);

    //Search for another node with lower resources.
    workerNode = await gridClient.capacity.filterNodes({
      cru: workerCpu,
      mru: workerMemory / 1024,
      sru: workerRootfsSize + workerDiskSize,
      farmId: 1,
      availableFor: await gridClient.twins.get_my_twin_id(),
    } as FilterOptions);
  }
  const masterNodeId = await getOnlineNode(masterNode);
  if (masterNodeId == -1) throw new Error("no nodes available to complete this test");
  let workerNodeId = await getOnlineNode(workerNode);
  if (workerNodeId == -1) throw new Error("no nodes available to complete this test");
  let maxCount = 3;
  while (masterNodeId == workerNodeId && maxCount > 0) {
    workerNodeId = await getOnlineNode(workerNode);
    if (workerNodeId == -1) throw new Error("no nodes available to complete this test");
    maxCount--;
  }

  //QSFS Config
  const qsfsDisk = [
    {
      qsfs_zdbs_name: qsfsZdbName,
      name: qsfsName,
      minimal_shards: 2,
      expected_shards: 4,
      encryption_key: qsfsEncryptionKey,
      prefix: qsfsPrefix,
      cache: qsfsCache,
      mountpoint: qsfsMountPoint,
    },
  ];

  //QSFS Model
  const qsfs: QSFSZDBSModel = {
    name: qsfsZdbName,
    count: qsfsCount,
    node_ids: qsfsNodes,
    password: qsfsPassword,
    disk_size: qsfsDiskSize,
  };

  const qsfsRes = await gridClient.qsfs_zdbs.deploy(qsfs);
  log(qsfsRes);

  //QSFS Contracts Assertions
  expect(qsfsRes.contracts.created).toHaveLength(2);
  expect(qsfsRes.contracts.updated).toHaveLength(0);
  expect(qsfsRes.contracts.deleted).toHaveLength(0);
  expect(qsfsNodes).toContain(qsfsRes.contracts.created[0].contractType.nodeContract.nodeId);
  expect(qsfsNodes).toContain(qsfsRes.contracts.created[1].contractType.nodeContract.nodeId);

  //K8s Model
  const k8s: K8SModel = {
    name: deploymentName,
    secret: secret,
    network: {
      name: networkName,
      ip_range: ipRange,
    },
    masters: [
      {
        name: masterName,
        node_id: masterNodeId,
        cpu: masterCpu,
        memory: masterMemory,
        rootfs_size: masterRootfsSize,
        disk_size: masterDiskSize,
        public_ip: masterPublicIp,
        public_ip6: false,
        planetary: true,
        mycelium: true,
        qsfs_disks: qsfsDisk,
      },
    ],
    workers: [
      {
        name: workerName,
        node_id: workerNodeId,
        cpu: workerCpu,
        memory: workerMemory,
        rootfs_size: workerRootfsSize,
        disk_size: workerDiskSize,
        public_ip: workerPublicIp,
        public_ip6: false,
        planetary: true,
        mycelium: true,
      },
    ],
    metadata: metadata,
    description: description,
    ssh_key: config.ssh_key,
  };

  const res = await gridClient.k8s.deploy(k8s);
  log(res);

  //K8s Contracts Assertions
  expect(res.contracts.created).toHaveLength(2);
  expect(res.contracts.updated).toHaveLength(0);
  expect(res.contracts.deleted).toHaveLength(0);

  const result = await gridClient.k8s.getObj(k8s.name);
  log(result);

  //Master Assertions
  expect(result.masters[0].nodeId).toBe(masterNodeId);
  expect(result.masters[0].status).toBe("ok");
  expect(result.masters[0].planetary).toBeDefined();
  expect(result.masters[0].myceliumIP).toBeDefined();
  expect(result.masters[0].publicIP).toBeNull();
  expect(result.masters[0].interfaces[0]["network"]).toBe(networkName);
  expect(result.masters[0].interfaces[0]["ip"]).toContain(splitIP(ipRange));
  expect(result.masters[0].interfaces[0]["ip"]).toMatch(ipRegex);
  expect(result.masters[0].capacity["cpu"]).toBe(masterCpu);
  expect(result.masters[0].capacity["memory"]).toBe(masterMemory);
  expect(result.masters[0].mounts[0]["size"]).toBe(GBToBytes(masterDiskSize));
  expect(result.masters[0].mounts[0]["state"]).toBe("ok");
  expect(result.masters[0].env["K3S_NODE_NAME"]).toBe(masterName);
  expect(result.masters[0].description).toBe(description);

  //qsfs assertions
  expect(result.masters[0].mounts[1]["name"]).toBe(qsfsName);
  expect(result.masters[0].mounts[1]["mountPoint"]).toBe(qsfsMountPoint);
  expect(result.masters[0].mounts[1]["cache"]).toBe(GBToBytes(qsfsCache));
  expect(result.masters[0].mounts[1]["prefix"]).toBe(qsfsPrefix);
  expect(result.masters[0].mounts[1]["qsfs_zdbs_name"]).toBe(qsfsZdbName);
  expect(result.masters[0].mounts[1]["state"]).toBe("ok");
  expect(result.masters[0].mounts[1]["metricsEndpoint"]).toBeDefined();

  //Worker Assertions
  expect(result.workers[0].nodeId).toBe(workerNodeId);
  expect(result.workers[0].status).toBe("ok");
  expect(result.workers[0].planetary).toBeDefined();
  expect(result.workers[0].myceliumIP).toBeDefined();
  expect(result.workers[0].publicIP).toBeNull();
  expect(result.workers[0].interfaces[0]["network"]).toBe(networkName);
  expect(result.workers[0].interfaces[0]["ip"]).toContain(splitIP(ipRange));
  expect(result.workers[0].interfaces[0]["ip"]).toMatch(ipRegex);
  expect(result.workers[0].capacity["cpu"]).toBe(workerCpu);
  expect(result.workers[0].capacity["memory"]).toBe(workerMemory);
  expect(result.workers[0].mounts[0]["size"]).toBe(GBToBytes(workerDiskSize));
  expect(result.workers[0].mounts[0]["state"]).toBe("ok");
  expect(result.workers[0].env["K3S_NODE_NAME"]).toBe(workerName);
  expect(result.workers[0].description).toBe(description);

  const masterPlanetaryIp = result.masters[0].planetary;
  const workerPlanetaryIp = result.workers[0].planetary;
  const user = "root";

  //SSH to the master
  const masterSSH = await RemoteRun(masterPlanetaryIp, user);

  //Wait until the cluster is ready
  await k8sWait(masterSSH, masterName, workerName, 5000);

  try {
    //Verify Master Resources(CPU)
    await masterSSH.execCommand("lscpu").then(async function (result) {
      const splittedRes = result.stdout.split("\n");
      log(splittedRes[4]);
      expect(splittedRes[4]).toContain(masterCpu.toString());
    });

    //Verify Master Resources(Memeory)
    await masterSSH.execCommand("free -m").then(async function (result) {
      const splittedRes = result.stdout.split("\n");
      log(splittedRes[1]);
      const memoryValue = splittedRes[1].match(/^\d+|\d+\b|\d+(?=\w)/g);
      expect(+memoryValue[0]).toBeGreaterThanOrEqual(masterMemory - masterMemory * 0.2);
      expect(+memoryValue[0]).toBeLessThan(masterMemory);
    });

    //Execute kubectl get nodes.
    await masterSSH.execCommand("source /etc/profile && kubectl get nodes").then(async function (result) {
      log(result.stdout);
      expect(result.stdout).toContain(masterName.toLowerCase());
      expect(result.stdout).toContain(workerName.toLowerCase());
    });

    //Verify that the QSFS disk was added successfully.
    await masterSSH.execCommand("df -h").then(async function (result) {
      const splittedRes = result.stdout.split("\n");
      log(result.stdout);
      log(splittedRes[5]);
      expect(splittedRes[5]).toContain(qsfsName);
      expect(splittedRes[5]).toContain(qsfsMountPoint);
    });
  } finally {
    //Disconnect from the master
    await masterSSH.dispose();
  }

  //SSH to the worker
  const workerSSH = await RemoteRun(workerPlanetaryIp, user);

  try {
    //Verify Worker Resources(CPU)
    await workerSSH.execCommand("lscpu").then(async function (result) {
      const splittedRes = result.stdout.split("\n");
      log(splittedRes[4]);
      expect(splittedRes[4]).toContain(workerCpu.toString());
    });

    //Verify Worker Resources(Memory)
    await workerSSH.execCommand("free -m").then(async function (result) {
      const splittedRes = result.stdout.split("\n");
      log(splittedRes[1]);
      const memoryValue = splittedRes[1].match(/^\d+|\d+\b|\d+(?=\w)/g);
      expect(+memoryValue[0]).toBeGreaterThanOrEqual(workerMemory - workerMemory * 0.2);
      expect(+memoryValue[0]).toBeLessThan(workerMemory);
    });
  } finally {
    //Disconnect from the worker
    await workerSSH.dispose();
  }
});

afterEach(async () => {
  const vmNames = await gridClient.machines.list();
  for (const name of vmNames) {
    const res = await gridClient.machines.delete({ name });
    log(res);
    expect(res.created).toHaveLength(0);
    expect(res.updated).toHaveLength(0);
    expect(res.deleted).toBeDefined();
  }

  const k8sNames = await gridClient.k8s.list();
  for (const name of k8sNames) {
    const res = await gridClient.k8s.delete({ name });
    log(res);
    expect(res.created).toHaveLength(0);
    expect(res.updated).toHaveLength(0);
    expect(res.deleted).toBeDefined();
  }

  const zdbNames = await gridClient.qsfs_zdbs.list();
  for (const name of zdbNames) {
    const res = await gridClient.qsfs_zdbs.delete({ name });
    log(res);
    expect(res.created).toHaveLength(0);
    expect(res.updated).toHaveLength(0);
    expect(res.deleted).toBeDefined();
  }
});

afterAll(async () => {
  return await gridClient.disconnect();
}, 130000);
