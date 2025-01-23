import {
  Features,
  FilterOptions,
  generateString,
  GridClient,
  MachineModel,
  MachinesModel,
  randomChoice,
} from "../../src";
import { config, getClient } from "../client_loader";
import { GBToBytes, generateInt, getOnlineNode, log, RemoteRun, splitIP } from "../utils";

jest.setTimeout(300000);

let gridClient: GridClient;
let deploymentName: string;

beforeEach(async () => {
  gridClient = await getClient();
  deploymentName = generateString(15);
  gridClient.clientOptions.projectName = `vm/${deploymentName}`;
  gridClient._connect();
  return gridClient;
});

//Private IP Regex
const ipRegex = /(^127\.)|(^10\.)|(^172\.1[6-9]\.)|(^172\.2[0-9]\.)|(^172\.3[0-1]\.)|(^192\.168\.)/;

test("TC1228 - VM: Deploy a VM", async () => {
  /**********************************************
     Test Suite: Grid3_Client_TS (Automated)
     Test Cases: TC1228 - VM: Deploy a VM
     Scenario:
        - Generate Test Data/VM Config.
        - Select a Node To Deploy the VM on.
        - Deploy the VM.
        - Assert that the generated data matches
          the deployment details.
        - SSH to the VM and Verify that you can
          access it.
        - Assert that the Environment Variables
          Were passed successfully to the VM
        - Verify the resources of the VM.
    **********************************************/

  //Test Data
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
  const description = "test deploying VMs via ts grid3 client";
  const envVarValue = generateString(30);

  //Node Selection
  let nodes;
  try {
    nodes = await gridClient.capacity.filterNodes({
      cru: cpu,
      mru: memory / 1024,
      sru: rootfsSize,
      farmId: 1,
      availableFor: await gridClient.twins.get_my_twin_id(),
      features: [Features.wireguard],
      nodeExclude: [11],
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
      features: [Features.wireguard],
      nodeExclude: [11],
    } as FilterOptions);
  }
  const nodeId = await getOnlineNode(nodes);
  if (nodeId == -1) throw new Error("no nodes available to complete this test");

  //VM Model
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
        env: {
          SSH_KEY: config.ssh_key,
          Test_KEY: envVarValue,
        },
        solutionProviderId: null,
      },
    ],
    metadata: metadata,
    description: description,
  };

  const res = await gridClient.machines.deploy(vms);
  log(res);

  //Contracts Assertions
  expect(res.contracts.created).toHaveLength(1);
  expect(res.contracts.updated).toHaveLength(0);
  expect(res.contracts.deleted).toHaveLength(0);

  const vmsList = await gridClient.machines.list();
  log(vmsList);

  //VM List Assertions
  expect(vmsList.length).toBeGreaterThanOrEqual(1);
  expect(vmsList).toContain(vms.name);

  const result = await gridClient.machines.getObj(vms.name);
  log(result);

  //VM Assertions
  expect(result[0].nodeId).toBe(nodeId);
  expect(result[0].status).toBe("ok");
  expect(result[0].flist).toBe(vms.machines[0].flist);
  expect(result[0].entrypoint).toBe(vms.machines[0].entrypoint);
  expect(result[0].mounts).toHaveLength(0);
  expect(result[0].interfaces[0]["network"]).toBe(vms.network.name);
  expect(result[0].interfaces[0]["ip"]).toContain(splitIP(vms.network.ip_range));
  expect(result[0].interfaces[0]["ip"]).toMatch(ipRegex);
  expect(result[0].capacity["cpu"]).toBe(cpu);
  expect(result[0].capacity["memory"]).toBe(memory);
  expect(result[0].planetary).toBeDefined();
  expect(result[0].myceliumIP).toBeDefined();
  expect(result[0].publicIP).toBeNull();
  expect(result[0].description).toBe(description);

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
  } finally {
    //Disconnect from the machine
    await ssh.dispose();
  }
});

test("TC2847 - VM: Deploy a VM With Mycelium", async () => {
  /**********************************************
     Test Suite: Grid3_Client_TS (Automated)
     Test Cases: TC2847 - VM: Deploy a VM With Mycelium
     Scenario:
        - Generate Test Data/VM Config.
        - Select a Node To Deploy the VM on.
        - Deploy the VM.
        - Assert that the generated data matches
          the deployment details.
        - SSH to the VM and Verify that you can
          access it With Mycelium.
        - Assert that the Environment Variables
          Were passed successfully to the VM
        - Verify the resources of the VM.
    **********************************************/

  //Test Data
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
  const description = "test deploying VM with Mycelium via ts grid3 client";
  const envVarValue = generateString(30);

  //Node Selection
  let nodes;
  try {
    nodes = await gridClient.capacity.filterNodes({
      cru: cpu,
      mru: memory / 1024,
      sru: rootfsSize,
      farmId: 1,
      availableFor: await gridClient.twins.get_my_twin_id(),
      features: [Features.wireguard],
      nodeExclude: [11],
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
      features: [Features.wireguard],
      nodeExclude: [11],
    } as FilterOptions);
  }
  const nodeId = await getOnlineNode(nodes);
  if (nodeId == -1) throw new Error("no nodes available to complete this test");

  //VM Model
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
        flist: "https://hub.grid.tf/tf-official-apps/base:latest.flist",
        entrypoint: "/sbin/zinit init",
        public_ip: publicIP,
        planetary: true,
        mycelium: true,
        env: {
          SSH_KEY: config.ssh_key,
          Test_KEY: envVarValue,
        },
        solutionProviderId: null,
      },
    ],
    metadata: metadata,
    description: description,
  };

  const res = await gridClient.machines.deploy(vms);
  log(res);

  //Contracts Assertions
  expect(res.contracts.created).toHaveLength(1);
  expect(res.contracts.updated).toHaveLength(0);
  expect(res.contracts.deleted).toHaveLength(0);

  const vmsList = await gridClient.machines.list();
  log(vmsList);

  //VM List Assertions
  expect(vmsList.length).toBeGreaterThanOrEqual(1);
  expect(vmsList).toContain(vms.name);

  const result = await gridClient.machines.getObj(vms.name);
  log(result);

  //VM Assertions
  expect(result[0].nodeId).toBe(nodeId);
  expect(result[0].status).toBe("ok");
  expect(result[0].flist).toBe(vms.machines[0].flist);
  expect(result[0].entrypoint).toBe(vms.machines[0].entrypoint);
  expect(result[0].mounts).toHaveLength(0);
  expect(result[0].interfaces[0]["network"]).toBe(vms.network.name);
  expect(result[0].interfaces[0]["ip"]).toContain(splitIP(vms.network.ip_range));
  expect(result[0].interfaces[0]["ip"]).toMatch(ipRegex);
  expect(result[0].capacity["cpu"]).toBe(cpu);
  expect(result[0].capacity["memory"]).toBe(memory);
  expect(result[0].planetary).toBeDefined();
  expect(result[0].myceliumIP).toBeDefined();
  expect(result[0].publicIP).toBeNull();
  expect(result[0].description).toBe(description);

  const host = result[0].myceliumIP;
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
  } finally {
    //Disconnect from the machine
    await ssh.dispose();
  }
});

test("TC1229 - VM: Deploy a VM With a Disk", async () => {
  /**********************************************
     Test Suite: Grid3_Client_TS (Automated)
     Test Cases: TC1229 - VM: Deploy a VM With a Disk
     Scenario:
        - Generate Test Data/VM Config/Disk Config.
        - Select a Node To Deploy the VM on.
        - Deploy the VM.
        - Assert that the generated data matches
          the deployment details..
        - SSH to the VM and Verify that you can
          access it.
        - Assert that the Environment Variables
          Were passed successfully to the VM.
        - Verify the resources of the VM.
        - Assert that the Disk was successfully
          Mounted in the VM.
    **********************************************/

  //Test Data
  let cpu = generateInt(1, 4);
  let memory = generateInt(256, 4096);
  let rootfsSize = generateInt(2, 5);
  let diskSize = generateInt(1, 20);
  const diskName = generateString(15);
  const mountPoint = "/" + generateString(10);
  const networkName = generateString(15);
  const vmName = generateString(15);
  const publicIP = false;
  const ipRangeClassA = "10." + generateInt(1, 255) + ".0.0/16";
  const ipRangeClassB = "172." + generateInt(16, 31) + ".0.0/16";
  const ipRangeClassC = "192.168.0.0/16";
  const ipRange = randomChoice([ipRangeClassA, ipRangeClassB, ipRangeClassC]);
  const metadata = "{'deploymentType': 'vm'}";
  const description = "test deploying a VM with disk via ts grid3 client";
  const envVarValue = generateString(30);

  //Node Selection
  let nodes;
  try {
    nodes = await gridClient.capacity.filterNodes({
      cru: cpu,
      mru: memory / 1024,
      sru: rootfsSize + diskSize,
      farmId: 1,
      availableFor: await gridClient.twins.get_my_twin_id(),
      features: [Features.wireguard],
      nodeExclude: [11],
    } as FilterOptions);
  } catch (error) {
    //Log the resources that were not found.
    log("A Node was not found with the generated resources." + error);
    log("Regenerating test data with lower resources....");

    //Generate lower resources.
    cpu = generateInt(1, cpu);
    memory = generateInt(256, memory);
    rootfsSize = generateInt(2, rootfsSize);
    diskSize = generateInt(1, diskSize);

    //Search for another node with lower resources.
    nodes = await gridClient.capacity.filterNodes({
      cru: cpu,
      mru: memory / 1024,
      sru: rootfsSize + diskSize,
      farmId: 1,
      availableFor: await gridClient.twins.get_my_twin_id(),
      features: [Features.wireguard],
      nodeExclude: [11],
    } as FilterOptions);
  }
  const nodeId = await getOnlineNode(nodes);
  if (nodeId == -1) throw new Error("no nodes available to complete this test");

  //VM Model
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
        disks: [
          {
            name: diskName,
            size: diskSize,
            mountpoint: mountPoint,
          },
        ],
        flist: "https://hub.grid.tf/tf-official-apps/base:latest.flist",
        entrypoint: "/sbin/zinit init",
        public_ip: publicIP,
        planetary: true,
        mycelium: true,
        env: {
          SSH_KEY: config.ssh_key,
          Test_KEY: envVarValue,
        },
        solutionProviderId: null,
      },
    ],
    metadata: metadata,
    description: description,
  };

  const res = await gridClient.machines.deploy(vms);
  log(res);

  //Contracts Assertions
  expect(res.contracts.created).toHaveLength(1);
  expect(res.contracts.updated).toHaveLength(0);
  expect(res.contracts.deleted).toHaveLength(0);

  const vmsList = await gridClient.machines.list();
  log(vmsList);

  //VM List Assertions
  expect(vmsList.length).toBeGreaterThanOrEqual(1);
  expect(vmsList).toContain(vms.name);

  const result = await gridClient.machines.getObj(vms.name);
  log(result);

  //Disk Assertions
  expect(result[0].mounts[0]["name"]).toBe(diskName);
  expect(result[0].mounts[0]["size"]).toBe(GBToBytes(diskSize));
  expect(result[0].mounts[0]["mountPoint"]).toBe(mountPoint);
  expect(result[0].mounts[0]["state"]).toBe("ok");

  const host = result[0].planetary;
  const user = "root";

  //SSH to the Created VM
  const ssh = await RemoteRun(host, user);

  try {
    //Verify that the disk was added successfully.
    await ssh.execCommand("df -h").then(async function (result) {
      const splittedRes = result.stdout.split("\n");
      log(splittedRes[5]);
      expect(splittedRes[5]).toContain(mountPoint);
      expect(splittedRes[5]).toContain(diskSize.toString());
    });
  } finally {
    //Disconnect from the machine
    await ssh.dispose();
  }
});

test("TC1230 - VM: Deploy Multiple VMs on Different Nodes", async () => {
  /**********************************************
     Test Suite: Grid3_Client_TS (Automated)
     Test Cases: TC1230 - VM: Deploy Multiple VMs on Different Nodes
     Scenario:
        - Generate Test Data/VM Config/Disk Config
          For both of the VMs.
        - Select a Two Different Nodes To Deploy
         the VMs on.
        - Deploy the VMs.
        - Assert that the generated data matches
          the deployment details.
        - SSH to both VMs and Verify that you can
          access it.
        - Verify the resources for both of the VMs.
    **********************************************/

  //Test Data
  const vmCpu = [generateInt(1, 4), generateInt(1, 4)];
  const vmMemory = [generateInt(256, 4096), generateInt(256, 4096)];
  const vmRootfs = [generateInt(2, 5), generateInt(2, 5)];
  const networkName = generateString(15);
  const vmName = [generateString(15), generateString(15)];
  const vmDisks = [];
  const vmPublicIP = false;
  const ipRangeClassA = "10." + generateInt(1, 255) + ".0.0/16";
  const ipRangeClassB = "172." + generateInt(16, 31) + ".0.0/16";
  const ipRangeClassC = "192.168.0.0/16";
  const ipRange = randomChoice([ipRangeClassA, ipRangeClassB, ipRangeClassC]);
  const metadata = "{'deploymentType': 'vm'}";
  const description = "test deploying multiple VMs on different nodes via ts grid3 client";
  const vmEnvVarValue = [generateString(20), generateString(20)];

  //VM1 Node Selection
  let vm1Nodes;
  try {
    vm1Nodes = await gridClient.capacity.filterNodes({
      cru: vmCpu[0],
      mru: vmMemory[0] / 1024,
      sru: vmRootfs[0],
      farmId: 1,
      availableFor: await gridClient.twins.get_my_twin_id(),
      features: [Features.wireguard],
    } as FilterOptions);
  } catch (error) {
    //Log the resources that were not found.
    log("A Node was not found with the generated resources." + error);
    log("Regenerating test data with lower resources....");

    //Generate lower resources.
    vmCpu[0] = generateInt(1, vmCpu[0]);
    vmMemory[0] = generateInt(256, vmMemory[0]);
    vmRootfs[0] = generateInt(2, vmRootfs[0]);

    //Search for another node with lower resources.
    vm1Nodes = await gridClient.capacity.filterNodes({
      cru: vmCpu[0],
      mru: vmMemory[0] / 1024,
      sru: vmRootfs[0],
      farmId: 1,
      availableFor: await gridClient.twins.get_my_twin_id(),
      features: [Features.wireguard],
    } as FilterOptions);
  }

  //VM2 Node Selection
  let vm2Nodes;
  try {
    vm2Nodes = await gridClient.capacity.filterNodes({
      cru: vmCpu[1],
      mru: vmMemory[1] / 1024,
      sru: vmRootfs[1],
      farmId: 1,
      availableFor: await gridClient.twins.get_my_twin_id(),
      features: [Features.wireguard],
    } as FilterOptions);
  } catch (error) {
    //Log the resources that were not found.
    log("A Node was not found with the generated resources." + error);
    log("Regenerating test data with lower resources....");

    //Generate lower resources.
    vmCpu[1] = generateInt(1, vmCpu[1]);
    vmMemory[1] = generateInt(256, vmMemory[1]);
    vmRootfs[1] = generateInt(2, vmRootfs[1]);

    //Search for another node with lower resources.
    vm2Nodes = await gridClient.capacity.filterNodes({
      cru: vmCpu[1],
      mru: vmMemory[1] / 1024,
      sru: vmRootfs[1],
      farmId: 1,
      availableFor: await gridClient.twins.get_my_twin_id(),
      features: [Features.wireguard],
    } as FilterOptions);
  }

  const vm1NodeId = await getOnlineNode(vm1Nodes);
  if (vm1NodeId == -1) throw new Error("no nodes available to complete this test");
  let vm2NodeId = await getOnlineNode(vm2Nodes);
  if (vm2NodeId == -1) throw new Error("no nodes available to complete this test");
  let maxCount = 3;
  while (vm1NodeId == vm2NodeId && maxCount > 0) {
    vm2NodeId = await getOnlineNode(vm2Nodes);
    if (vm2NodeId == -1) throw new Error("no nodes available to complete this test");
    maxCount--;
  }
  const vmNodes = [vm1NodeId, vm2NodeId];

  //Vm Model
  const vm1: MachineModel = {
    name: vmName[0],
    node_id: vmNodes[0],
    cpu: vmCpu[0],
    memory: vmMemory[0],
    rootfs_size: vmRootfs[0],
    disks: vmDisks,
    flist: "https://hub.grid.tf/tf-official-apps/base:latest.flist",
    entrypoint: "/sbin/zinit init",
    public_ip: vmPublicIP,
    planetary: true,
    mycelium: true,
    env: {
      SSH_KEY: config.ssh_key,
      TEST_KEY: vmEnvVarValue[0],
    },
  };

  const vm2: MachineModel = {
    name: vmName[1],
    node_id: vmNodes[1],
    cpu: vmCpu[1],
    memory: vmMemory[1],
    rootfs_size: vmRootfs[1],
    disks: vmDisks,
    flist: "https://hub.grid.tf/tf-official-apps/base:latest.flist",
    entrypoint: "/sbin/zinit init",
    public_ip: vmPublicIP,
    planetary: true,
    mycelium: true,
    env: {
      SSH_KEY: config.ssh_key,
      TEST_KEY: vmEnvVarValue[1],
    },
  };

  //VMs Model
  const vms: MachinesModel = {
    name: deploymentName,
    network: {
      name: networkName,
      ip_range: ipRange,
    },
    machines: [vm1, vm2],
    metadata: metadata,
    description: description,
  };

  const res = await gridClient.machines.deploy(vms);
  log(res);

  //Contracts Assertions
  expect(res.contracts.created).toHaveLength(2);
  expect(res.contracts.updated).toHaveLength(0);
  expect(res.contracts.deleted).toHaveLength(0);

  const vmsList = await gridClient.machines.list();
  log(vmsList);

  //VM List Assertions
  expect(vmsList.length).toBeGreaterThanOrEqual(1);
  expect(vmsList).toContain(vms.name);

  const result = await gridClient.machines.getObj(vms.name);
  log(result);

  let startIndex;
  let index;

  if (result[0].name == vmName[0]) {
    startIndex = 0;
    index = 1;
  } else {
    startIndex = 1;
    index = -1;
  }
  let maxIterations = 0;

  for (let currentIndex = startIndex; maxIterations < result.length; currentIndex += index) {
    //VM Assertions
    expect(result[currentIndex].nodeId).toBe(vmNodes[maxIterations]);
    expect(result[currentIndex].status).toBe("ok");
    expect(result[currentIndex].name).toBe(vmName[maxIterations]);
    expect(result[currentIndex].flist).toBe(vms.machines[currentIndex].flist);
    expect(result[currentIndex].entrypoint).toBe(vms.machines[currentIndex].entrypoint);
    expect(result[currentIndex].mounts).toHaveLength(0);
    expect(result[currentIndex].interfaces[0]["network"]).toBe(vms.network.name);
    expect(result[currentIndex].interfaces[0]["ip"]).toContain(splitIP(vms.network.ip_range));
    expect(result[currentIndex].interfaces[0]["ip"]).toMatch(ipRegex);
    expect(result[currentIndex].capacity["cpu"]).toBe(vmCpu[maxIterations]);
    expect(result[currentIndex].capacity["memory"]).toBe(vmMemory[maxIterations]);
    expect(result[currentIndex].planetary).toBeDefined();
    expect(result[currentIndex].myceliumIP).toBeDefined();
    expect(result[currentIndex].publicIP).toBeNull();
    expect(result[currentIndex].description).toBe(description);

    const vmhost = result[currentIndex].planetary;
    const vmuser = "root";

    //SSH to the VM
    const ssh = await RemoteRun(vmhost, vmuser);

    try {
      //Verify that the added env var was successfully passed to the VM.
      await ssh.execCommand("cat /proc/1/environ").then(async function (result) {
        log(result.stdout);
        expect(result.stdout).toContain(vmEnvVarValue[maxIterations]);
      });
      await ssh.execCommand("apk add util-linux").then(function (result) {
        if (result.stderr) {
          throw new Error("Failed to install util-linux");
        }
      });
      //Verify VM Resources(CPU)
      await ssh.execCommand("lscpu").then(async function (result) {
        const splittedRes = result.stdout.split("\n");
        log(splittedRes[4]);
        expect(splittedRes[4]).toContain(vmCpu[maxIterations].toString());
      });
      //Verify VM Resources(Memory)
      await ssh.execCommand("free -m").then(async function (result) {
        const splittedRes = result.stdout.split("\n");
        log(splittedRes[1]);
        const memoryValue = splittedRes[1].match(/^\d+|\d+\b|\d+(?=\w)/g);
        expect(+memoryValue[0]).toBeGreaterThanOrEqual(vmMemory[maxIterations] - vmMemory[maxIterations] * 0.2);
        expect(+memoryValue[0]).toBeLessThan(vmMemory[maxIterations]);
      });
    } finally {
      //Disconnect from the machine
      await ssh.dispose();
    }

    maxIterations++;
  }
});

afterAll(async () => {
  const vmNames = await gridClient.machines.list();
  for (const name of vmNames) {
    const res = await gridClient.machines.delete({ name });
    log(res);
    expect(res.created).toHaveLength(0);
    expect(res.updated).toHaveLength(0);
    expect(res.deleted).toBeDefined();
  }
  return await gridClient.disconnect();
}, 130000);
