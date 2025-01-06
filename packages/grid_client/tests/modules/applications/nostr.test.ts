import axios from "axios";
import { setTimeout } from "timers/promises";

import { FilterOptions, GatewayNameModel, generateString, GridClient, MachinesModel, randomChoice } from "../../../src";
import { config, getClient } from "../../client_loader";
import { GBToBytes, generateInt, getOnlineNode, log, RemoteRun, splitIP } from "../../utils";

jest.setTimeout(1250000);

let gridClient: GridClient;
let deploymentName: string;

beforeAll(async () => {
  gridClient = await getClient();
  deploymentName = "ns" + generateString(10);
  gridClient.clientOptions.projectName = `nostr/${deploymentName}`;
  gridClient._connect();
  return gridClient;
});

// Private IP Regex
const ipRegex = /(^127\.)|(^10\.)|(^172\.1[6-9]\.)|(^172\.2[0-9]\.)|(^172\.3[0-1]\.)|(^192\.168\.)/;

test("TC2955 - Applications: Deploy Nostr", async () => {
  /**********************************************
     Test Suite: Grid3_Client_TS (Automated)
     Test Cases: TC2955 - Applications: Deploy Nostr
     Scenario:
        - Generate Test Data/Nostr Config/Gateway Config.
        - Select a Node To Deploy the Nostr instance on.
        - Select a Gateway Node To Deploy the Gateway on.
        - Deploy the Nostr solution.
        - Assert that the generated data matches
          the deployment details.
        - Pass the IP of the Created Nostr instance to the Gateway
          Config.
        - Deploy the Gateway.
        - Assert that the generated data matches
          the deployment details.
        - Assert that the Gateway points at the IP
          of the created Nostr instance.
        - Assert that the returned domain is working
          and returns correct data.
**********************************************/

  // Test Data
  const name = "gw" + generateString(10).toLowerCase();
  const tlsPassthrough = false;
  const cpu = 2;
  const memory = 4;
  const rootfsSize = 2;
  const diskSize = 50;
  const networkName = generateString(15);
  const vmName = generateString(15);
  const diskName = generateString(15);
  const mountPoint = "/mnt/data";
  const publicIp = false;
  const ipRangeClassA = "10." + generateInt(1, 255) + ".0.0/16";
  const ipRangeClassB = "172." + generateInt(16, 31) + ".0.0/16";
  const ipRangeClassC = "192.168.0.0/16";
  const ipRange = randomChoice([ipRangeClassA, ipRangeClassB, ipRangeClassC]);
  const metadata = "{'deploymentType': 'nostr'}";
  const description = "Test deploying Nostr via ts grid3 client";

  // Gateway Node Selection
  const gatewayNodes = await gridClient.capacity.filterNodes({
    gateway: true,
    farmId: 1,
    availableFor: await gridClient.twins.get_my_twin_id(),
  } as FilterOptions);
  if (gatewayNodes.length == 0) throw new Error("No nodes available to complete this test");
  const GatewayNode = gatewayNodes[generateInt(0, gatewayNodes.length - 1)];

  // Node Selection
  const nodes = await gridClient.capacity.filterNodes({
    cru: cpu,
    mru: memory,
    sru: rootfsSize + diskSize,
    farmId: 1,
    availableFor: await gridClient.twins.get_my_twin_id(),
  } as FilterOptions);
  const nodeId = await getOnlineNode(nodes);
  if (nodeId == -1) throw new Error("No nodes available to complete this test");
  const domain = name + "." + GatewayNode.publicConfig.domain;

  const fs = require("fs");
  // VM Model
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
        flist: "https://hub.grid.tf/tf-official-apps/nostr_relay-mycelium.flist",
        entrypoint: "/sbin/zinit init",
        public_ip: publicIp,
        planetary: true,
        mycelium: true,
        env: {
          SSH_KEY: config.ssh_key,
          NOSTR_HOSTNAME: domain,
        },
      },
    ],
    metadata: metadata,
    description: description,
  };

  const res = await gridClient.machines.deploy(vms);
  log(res);

  // Contracts Assertions
  expect(res.contracts.created).toHaveLength(1);
  expect(res.contracts.updated).toHaveLength(0);
  expect(res.contracts.deleted).toHaveLength(0);

  const result = await gridClient.machines.getObj(vms.name);
  log(result);

  // Gateway Backend Configuration
  const backends = ["http://[" + result[0].planetary + "]:8080"];
  log(backends);

  // Gateway Model
  const gw: GatewayNameModel = {
    name: name,
    node_id: GatewayNode.nodeId,
    tls_passthrough: tlsPassthrough,
    backends: backends,
  };

  const gatewayRes = await gridClient.gateway.deploy_name(gw);
  log(gatewayRes);

  // Gateway Assertions
  expect(gatewayRes.contracts.created).toHaveLength(1);

  const gatewayResult = await gridClient.gateway.getObj(gw.name);
  log(gatewayResult);

  // Gateway Assertions
  expect(gatewayResult[0].name).toBe(name);
  expect(gatewayResult[0].backends).toStrictEqual(backends);

  const host = result[0].planetary;
  const user = "root";

  // SSH to the Created VM
  const ssh = await RemoteRun(host, user);

  try {
    // Allow Nostr's port through UFW
    await ssh.execCommand("curl localhost:8080").then(async function (result) {
      log(result.stdout);
      expect(result.stdout).toContain("Please use a Nostr client to connect.");
    });
  } finally {
    // Disconnect from the machine
    await ssh.dispose();
  }
});

afterAll(async () => {
  const vmNames = await gridClient.machines.list();
  for (const name of vmNames) {
    const res = await gridClient.machines.delete({ name });
    log(res);
  }

  const gwNames = await gridClient.gateway.list();
  for (const name of gwNames) {
    const res = await gridClient.gateway.delete_name({ name });
    log(res);
  }

  return await gridClient.disconnect();
}, 130000);
