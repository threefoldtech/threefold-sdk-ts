import axios from "axios";
import { setTimeout } from "timers/promises";

import {
  Features,
  FilterOptions,
  GatewayNameModel,
  generateString,
  GridClient,
  MachinesModel,
  randomChoice,
} from "../../src";
import { config, getClient } from "../client_loader";
import { generateInt, getOnlineNode, log, splitIP } from "../utils";

jest.setTimeout(300000);

let gridClient: GridClient;
let deploymentName: string;

beforeAll(async () => {
  gridClient = await getClient();
  deploymentName = generateString(15);
  gridClient.clientOptions.projectName = `vm/${deploymentName}`;
  gridClient._connect();
  return gridClient;
});

async function waitForGateway(domain: string) {
  for (let i = 0; i < 30; i++) {
    try {
      await axios.get(domain);
      return true;
    } catch (error) {
      await setTimeout(5000, "Waiting for gateway to be ready");
    }
  }
  return false;
}

async function testGateway(gateway: GatewayNameModel) {
  const gatewayRes = await gridClient.gateway.deploy_name(gateway);
  log(gatewayRes);

  //Contracts Assertions
  expect(gatewayRes.contracts.created).toHaveLength(1);
  expect(gatewayRes.contracts.updated).toHaveLength(0);
  expect(gatewayRes.contracts.deleted).toHaveLength(0);
  expect(gatewayRes.contracts.created[0].contractType.nodeContract.nodeId).toBe(gateway.node_id);

  const gatewayResult = await gridClient.gateway.getObj(gateway.name);
  log(gatewayResult);

  //Gateway Assertions
  expect(gatewayResult[0].name).toBe(gateway.name);
  expect(gatewayResult[0].status).toBe("ok");
  expect(gatewayResult[0].type).toContain("name");
  expect(gatewayResult[0].domain).toContain(gateway.name);
  expect(gatewayResult[0].tls_passthrough).toBe(gateway.tls_passthrough);
  expect(gatewayResult[0].backends).toStrictEqual(gateway.backends);

  const domain = "https://" + gatewayResult[0].domain;

  if (await waitForGateway(domain)) {
    axios.get(domain).then(res => {
      log(res.data);
      expect(res.status).toBe(200);
      expect(res.statusText).toBe("OK");
      expect(res.data).toContain("Directory listing for /");
      expect(res.data).toContain("bin/");
      expect(res.data).toContain("dev/");
      expect(res.data).toContain("etc/");
    });
  } else {
    throw new Error("Gateway is unreachable after multiple retries");
  }
}

//Private IP Regex
const ipRegex = /(^127\.)|(^10\.)|(^172\.1[6-9]\.)|(^172\.2[0-9]\.)|(^172\.3[0-1]\.)|(^192\.168\.)/;

test("TC1237 - Gateways: Expose a VM Over Gateway", async () => {
  /**********************************************
     Test Suite: Grid3_Client_TS (Automated)
     Test Cases: TC1237 - Gateways: Expose a VM Over Gateway
     Scenario:
        - Generate Test Data/VM Config/Gateway Config.
        - Select a Node To Deploy the VM on.
        - Select a Gateway Node To Deploy the gateway on.
        - Deploy the VM.
        - Assert that the generated data matches
          the deployment details.
        - Pass the IP of the Created VM to the Gateway
          Config.
        - Deploy the Gateway
        - Assert that the generated data matches
          the deployment details.
        - Assert that the Gateway points at the IP
          of the created VM.
        - Assert that the returned domain is working
          and returns correct data.
    **********************************************/

  //Test Data
  const name = "gw" + generateString(10).toLowerCase();
  const tlsPassthrough = false;
  let cpu = generateInt(1, 4);
  let memory = generateInt(256, 4096);
  let rootfsSize = generateInt(2, 5);
  const networkName = generateString(15);
  const vmName = generateString(15);
  const disks = [];
  const ipRangeClassA = "10." + generateInt(1, 255) + ".0.0/16";
  const ipRangeClassB = "172." + generateInt(16, 31) + ".0.0/16";
  const ipRangeClassC = "192.168.0.0/16";
  const ipRange = randomChoice([ipRangeClassA, ipRangeClassB, ipRangeClassC]);
  const metadata = "{'deploymentType': 'vm'}";
  const description = "test deploying VMs via ts grid3 client";
  const envVarValue = generateString(30);

  //GatewayNode Selection
  const gatewayNodes = await gridClient.capacity.filterNodes({
    gateway: true,
    farmId: 1,
    availableFor: await gridClient.twins.get_my_twin_id(),
    features: [Features.gatewayfqdnproxy, Features.gatewaynameproxy],
  } as FilterOptions);
  const gatewayNodeId = await getOnlineNode(gatewayNodes);
  if (gatewayNodeId == -1) throw new Error("no nodes available to complete this test");

  //Node Selection
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

  //VM Model
  const vms: MachinesModel = {
    name: deploymentName,
    network: {
      name: networkName,
      ip_range: ipRange,
      addAccess: true,
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
        entrypoint: "/usr/bin/python3 -m http.server --bind ::",
        public_ip: true,
        public_ip6: true,
        planetary: true,
        mycelium: true,
        env: {
          SSH_KEY: config.ssh_key,
          Test_KEY: envVarValue,
        },
        solutionProviderId: undefined,
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
  expect(result[0].publicIP["ip"]).toBeDefined();
  expect(result[0].publicIP["ip6"]).toBeDefined();
  expect(result[0].description).toBe(description);

  //--------------------Planetary--------------------
  let backends = ["http://[" + result[0].planetary + "]:8000"];
  log(backends);

  //Name Gateway Model
  const gw: GatewayNameModel = {
    name: name + "planetary",
    node_id: gatewayNodeId,
    tls_passthrough: tlsPassthrough,
    backends: backends,
  };

  await testGateway(gw);

  //--------------------Mycelium--------------------
  backends = ["http://[" + result[0].myceliumIP + "]:8000"];
  log(backends);

  //Name Gateway Model
  const gw1: GatewayNameModel = {
    name: name + "mycelium",
    node_id: gatewayNodeId,
    tls_passthrough: tlsPassthrough,
    backends: backends,
  };

  await testGateway(gw1);

  //--------------------IPv6--------------------
  backends = ["http://[" + result[0].publicIP["ip6"].split("/")[0] + "]:8000"];
  log(backends);

  //Name Gateway Model
  const gw2: GatewayNameModel = {
    name: name + "ipv6",
    node_id: gatewayNodeId,
    tls_passthrough: tlsPassthrough,
    backends: backends,
  };

  await testGateway(gw2);

  //--------------------IPv4--------------------
  backends = ["http://" + result[0].publicIP["ip"].split("/")[0] + ":8000"];
  log(backends);

  //Name Gateway Model
  const gw3: GatewayNameModel = {
    name: name + "ipv4",
    node_id: gatewayNodeId,
    tls_passthrough: tlsPassthrough,
    backends: backends,
  };

  await testGateway(gw3);

  //--------------------Wireguard--------------------
  const IP = result[0].interfaces[0].ip;
  const wireguardNetworkName = result[0].interfaces[0].network;
  backends = ["http://" + IP + ":8000"];
  log(backends);

  //Name Gateway Model
  const gw4: GatewayNameModel = {
    name: name + "wireguard",
    node_id: gatewayNodeId,
    tls_passthrough: tlsPassthrough,
    backends: backends,
  };

  gw4.network = wireguardNetworkName;
  const [x, y] = IP.split(".");
  const data = {
    name: wireguardNetworkName,
    ipRange: `${x}.${y}.0.0/16`,
    nodeId: gatewayNodeId,
    mycelium: false,
  };

  const hasNode = await gridClient.networks.hasNode(data);

  if (!hasNode) {
    await gridClient.networks.addNode(data);
  }

  await testGateway(gw4);
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
