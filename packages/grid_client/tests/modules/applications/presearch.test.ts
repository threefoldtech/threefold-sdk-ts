import { clean, gte } from "semver";
import { setTimeout } from "timers/promises";

import { FilterOptions, generateString, GridClient, MachinesModel, randomChoice } from "../../../src";
import { config, getClient } from "../../client_loader";
import { GBToBytes, generateInt, getOnlineNode, log, RemoteRun, splitIP } from "../../utils";

jest.setTimeout(900000);

let gridClient: GridClient;
let deploymentName: string;

beforeAll(async () => {
  gridClient = await getClient();
  deploymentName = "pr" + generateString(10);
  gridClient.clientOptions.projectName = `presearch/${deploymentName}`;
  gridClient._connect();
  return gridClient;
});

//Private IP Regex
const ipRegex = /(^127\.)|(^10\.)|(^172\.1[6-9]\.)|(^172\.2[0-9]\.)|(^172\.3[0-1]\.)|(^192\.168\.)/;

test("TC2728 - Applications: Deploy Presearch", async () => {
  /**********************************************
     Test Suite: Grid3_Client_TS (Automated)
     Test Cases: TC2728 - Applications: Deploy Presearch
     Scenario:
        - Generate Test Data/Presearch Config.
        - Select a Node To Deploy the Presearch on.
        - Deploy the Presearch solution.
        - Assert that the generated data matches
          the deployment details.
        - SSH into the VM.
        - Assert that the Presearch is working
          and returns correct data.
    **********************************************/

  //Test Data
  const cpu = 1;
  const memory = 1;
  const rootfsSize = 2;
  const diskSize = 10;
  const networkName = generateString(15);
  const vmName = generateString(15);
  const diskName = generateString(15);
  const mountPoint = "/var/lib/docker";
  const publicIp = false;
  const ipRangeClassA = "10." + generateInt(1, 255) + ".0.0/16";
  const ipRangeClassB = "172." + generateInt(16, 31) + ".0.0/16";
  const ipRangeClassC = "192.168.0.0/16";
  const ipRange = randomChoice([ipRangeClassA, ipRangeClassB, ipRangeClassC]);
  const metadata = "{'deploymentType': 'presearch'}";
  const description = "test deploying Presearch via ts grid3 client";

  //Node Selection
  const nodes = await gridClient.capacity.filterNodes({
    cru: cpu,
    mru: memory,
    sru: rootfsSize + diskSize,
    farmId: 1,
    publicIPs: publicIp,
    availableFor: await gridClient.twins.get_my_twin_id(),
  } as FilterOptions);
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
        memory: 1024 * memory,
        rootfs_size: rootfsSize,
        disks: [
          {
            name: diskName,
            size: diskSize,
            mountpoint: mountPoint,
          },
        ],
        flist: "https://hub.grid.tf/tf-official-apps/presearch-v2.3.flist",
        entrypoint: "/sbin/zinit init",
        public_ip: publicIp,
        planetary: true,
        mycelium: true,
        env: {
          SSH_KEY: config.ssh_key,
          PRESEARCH_REGISTRATION_CODE: "130b4f9393d3c852b50a65f2996586b4",
        },
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
  expect(result[0].mounts).toHaveLength(1);
  expect(result[0].interfaces[0]["network"]).toBe(vms.network.name);
  expect(result[0].interfaces[0]["ip"]).toContain(splitIP(vms.network.ip_range));
  expect(result[0].interfaces[0]["ip"]).toMatch(ipRegex);
  expect(result[0].capacity["cpu"]).toBe(cpu);
  expect(result[0].capacity["memory"]).toBe(memory * 1024);
  expect(result[0].planetary).toBeDefined();
  expect(result[0].myceliumIP).toBeDefined();
  expect(result[0].publicIP).toBeNull();
  expect(result[0].description).toBe(description);
  expect(result[0].mounts[0]["name"]).toBe(diskName);
  expect(result[0].mounts[0]["size"]).toBe(GBToBytes(diskSize));
  expect(result[0].mounts[0]["mountPoint"]).toBe(mountPoint);
  expect(result[0].mounts[0]["state"]).toBe("ok");

  const host = result[0].planetary;
  const user = "root";

  //SSH to the Created VM
  const ssh = await RemoteRun(host, user);

  try {
    let dockerContainer;
    //Verify that presearch is wokring correctly.
    for (let i = 0; i < 180; i++) {
      const wait = await setTimeout(5000, "Waiting for Presearch to be ready");
      log(wait);

      await ssh.execCommand("docker ps").then(async function (result) {
        log(result);
        dockerContainer = result.stdout.split("\n");
      });
      if (dockerContainer.length > 1) break;
    }
    for (let i = 0; i < dockerContainer.length; i++) {
      if (dockerContainer[i].includes("presearch/node")) {
        const containerID = dockerContainer[i].slice(0, 11);
        let attemp = 180;
        while (attemp > 0) {
          await ssh.execCommand("docker logs " + containerID).then(async function (result) {
            if (result.stdout != "") {
              log(result);
              const versionToCheck = clean(result.stdout.match(/v(\d+\.\d+\.\d+)/)?.[1]);
              gte(versionToCheck, "1.2.33");
              expect(result.stdout).toContain("presearch-node");
              attemp = 0;
            } else {
              attemp -= 1;
            }
          });
        }
      }
    }
  } finally {
    //Disconnect from the machine
    await ssh.dispose();
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

  const gwNames = await gridClient.gateway.list();
  for (const name of gwNames) {
    const res = await gridClient.gateway.delete_name({ name });
    log(res);
    expect(res.created).toHaveLength(0);
    expect(res.updated).toHaveLength(0);
    expect(res.deleted).toBeDefined();
  }

  return await gridClient.disconnect();
}, 130000);
