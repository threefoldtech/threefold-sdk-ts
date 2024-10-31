import axios from "axios";
import { setTimeout } from "timers/promises";

import { FilterOptions, GatewayNameModel, generateString, GridClient, MachinesModel, randomChoice } from "../../../src";
import { config, getClient } from "../../client_loader";
import { GBToBytes, generateInt, getOnlineNode, log, splitIP } from "../../utils";

jest.setTimeout(1250000);

let gridClient: GridClient;
let deploymentName: string;

beforeAll(async () => {
  gridClient = await getClient();
  deploymentName = "ss" + generateString(10);
  gridClient.clientOptions.projectName = `subsquid/${deploymentName}`;
  gridClient._connect();
  return gridClient;
});

//Private IP Regex
const ipRegex = /(^127\.)|(^10\.)|(^172\.1[6-9]\.)|(^172\.2[0-9]\.)|(^172\.3[0-1]\.)|(^192\.168\.)/;

test("TC2693 - Applications: Deploy Subsquid", async () => {
  /**********************************************
     Test Suite: Grid3_Client_TS (Automated)
     Test Cases: TC2693 - Applications: Deploy Subsquid
     Scenario:
        - Generate Test Data/Subsquid Config/Gateway Config.
        - Select a Node To Deploy the Subsquid on.
        - Select a Gateway Node To Deploy the gateway on.
        - Deploy the Subsquid solution.
        - Assert that the generated data matches
          the deployment details.
        - Pass the IP of the Created Subsquid to the Gateway
          Config.
        - Deploy the Gateway.
        - Assert that the generated data matches
          the deployment details.
        - Assert that the Gateway points at the IP
          of the created Subsquid.
        - Assert that the returned domain is working
          and returns correct data.
    **********************************************/

  //Test Data
  const name = "gw" + generateString(10).toLowerCase();
  const tlsPassthrough = false;
  const cpu = 1;
  const memory = 2;
  const rootfsSize = 2;
  const diskSize = 50;
  const networkName = generateString(15);
  const vmName = generateString(15);
  const diskName = generateString(15);
  const mountPoint = "/var/lib/docker";
  const publicIp = false;
  const ipRangeClassA = "10." + generateInt(1, 255) + ".0.0/16";
  const ipRangeClassB = "172." + generateInt(16, 31) + ".0.0/16";
  const ipRangeClassC = "192.168.0.0/16";
  const ipRange = randomChoice([ipRangeClassA, ipRangeClassB, ipRangeClassC]);
  const metadata = "{'deploymentType': 'subsquid'}";
  const description = "test deploying Subsquid via ts grid3 client";

  //GatewayNode Selection
  const gatewayNodes = await gridClient.capacity.filterNodes({
    gateway: true,
    farmId: 1,
    availableFor: await gridClient.twins.get_my_twin_id(),
  } as FilterOptions);
  if (gatewayNodes.length == 0) throw new Error("no nodes available to complete this test");
  const GatewayNode = gatewayNodes[generateInt(0, gatewayNodes.length - 1)];

  //Node Selection
  const nodes = await gridClient.capacity.filterNodes({
    cru: cpu,
    mru: memory,
    sru: rootfsSize + diskSize,
    farmId: 1,
    availableFor: await gridClient.twins.get_my_twin_id(),
  } as FilterOptions);
  const nodeId = await getOnlineNode(nodes);
  if (nodeId == -1) throw new Error("no nodes available to complete this test");
  const domain = name + "." + GatewayNode.publicConfig.domain;

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
        flist: "https://hub.grid.tf/tf-official-apps/subsquid-latest.flist",
        entrypoint: "/sbin/zinit init",
        public_ip: publicIp,
        planetary: true,
        mycelium: true,
        env: {
          SSH_KEY: config.ssh_key,
          SUBSQUID_WEBSERVER_HOSTNAME: domain,
          CHAIN_ENDPOINT: "wss://ws.elysiumchain.tech",
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

  const backends = ["http://[" + result[0].planetary + "]:4444"];
  log(backends);

  //Name Gateway Model
  const gw: GatewayNameModel = {
    name: name,
    node_id: GatewayNode.nodeId,
    tls_passthrough: tlsPassthrough,
    backends: backends,
  };

  const gatewayRes = await gridClient.gateway.deploy_name(gw);
  log(gatewayRes);

  //Contracts Assertions
  expect(gatewayRes.contracts.created).toHaveLength(1);
  expect(gatewayRes.contracts.updated).toHaveLength(0);
  expect(gatewayRes.contracts.deleted).toHaveLength(0);
  expect(gatewayRes.contracts.created[0].contractType.nodeContract.nodeId).toBe(GatewayNode.nodeId);

  const gatewayResult = await gridClient.gateway.getObj(gw.name);
  log(gatewayResult);

  //Gateway Assertions
  expect(gatewayResult[0].name).toBe(name);
  expect(gatewayResult[0].status).toBe("ok");
  expect(gatewayResult[0].type).toContain("name");
  expect(gatewayResult[0].domain).toContain(name);
  expect(gatewayResult[0].tls_passthrough).toBe(tlsPassthrough);
  expect(gatewayResult[0].backends).toStrictEqual(backends);

  const site = "https://" + gatewayResult[0].domain + "/graphql";
  let reachable = false;

  for (let i = 0; i <= 250; i++) {
    const wait = await setTimeout(5000, "Waiting for gateway to be ready");
    log(wait);

    await axios
      .get(site)
      .then(res => {
        log("gateway is reachable");
        log(res.status);
        log(res.statusText);
        log(res.data);
        expect(res.status).toBe(200);
        expect(res.statusText).toBe("OK");
        expect(res.data).toContain("Query node playground");
        reachable = true;
      })
      .catch(() => {
        log("gateway is not reachable");
      });
    if (reachable) {
      break;
    } else if (i == 250) {
      throw new Error("Gateway is unreachable after multiple retries");
    }
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
