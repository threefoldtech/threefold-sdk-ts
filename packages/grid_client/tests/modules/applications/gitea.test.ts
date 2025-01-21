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
} from "../../../src";
import { config, getClient } from "../../client_loader";
import { generateInt, getOnlineNode, log } from "../../utils";

jest.setTimeout(1250000);

let gridClient: GridClient;
let deploymentName: string;

beforeAll(async () => {
  gridClient = await getClient();
  deploymentName = "gt" + generateString(10);
  gridClient.clientOptions.projectName = `gitea/${deploymentName}`;
  gridClient._connect();
  return gridClient;
});

test("TC2954 - Applications: Deploy Gitea", async () => {
  /**********************************************
     Test Suite: Grid3_Client_TS (Automated)
     Test Cases: TC2954 - Applications: Deploy Gitea
     Scenario:
        - Generate Test Data/Gitea Config/Gateway Config.
        - Select a Node To Deploy the Gitea on.
        - Select a Gateway Node To Deploy the gateway on.
        - Deploy the Gitea solution.
        - Assert that the generated data matches
          the deployment details.
        - Pass the IP of the Created Gitea to the Gateway
          Config.
        - Deploy the Gateway.
        - Assert that the generated data matches
          the deployment details.
        - Assert that the Gateway points at the IP
          of the created Gitea.
        - Assert that the returned domain is working
          and returns correct data.
    **********************************************/
  const name = "gw" + generateString(10).toLowerCase();
  const tlsPassthrough = false;
  const cpu = 1;
  const memory = 2;
  const rootfsSize = 2;
  const diskSize = 15;
  const networkName = generateString(15);
  const vmName = generateString(15);
  const diskName = generateString(15);
  const mountPoint = "/var/lib/docker";
  const publicIp = false;
  const ipRangeClassA = "10." + generateInt(1, 255) + ".0.0/16";
  const ipRangeClassB = "172." + generateInt(16, 31) + ".0.0/16";
  const ipRangeClassC = "192.168.0.0/16";
  const ipRange = randomChoice([ipRangeClassA, ipRangeClassB, ipRangeClassC]);
  const metadata = "{'deploymentType': 'gitea'}";
  const description = "test deploying Gitea via ts grid3 client";

  // Gateway Node Selection
  const gatewayNodes = await gridClient.capacity.filterNodes({
    features: [Features.wireguard, Features.mycelium],
    gateway: true,
    farmId: 1,
    availableFor: await gridClient.twins.get_my_twin_id(),
  } as FilterOptions);
  if (gatewayNodes.length === 0) throw new Error("No nodes available to complete this test");
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
  if (nodeId === -1) throw new Error("No nodes available to complete this test");
  const domain = name + "." + GatewayNode.publicConfig.domain;

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
        flist: "https://hub.grid.tf/petep.3bot/threefolddev-gitea-latest.flist",
        entrypoint: "/sbin/zinit init",
        public_ip: publicIp,
        planetary: true,
        mycelium: true,
        env: {
          SSH_KEY: config.ssh_key,
          GITEA__HOSTNAME: domain,
          GITEA__ROOT_EMAIL: "admin@gitea.com",
          GITEA__ROOT_PASSWORD: "adminpassword",
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
  const backends = ["http://[" + result[0].planetary + "]:3000"];
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

  const site = "https://" + gatewayResult[0].domain;
  let reachable = false;

  for (let i = 0; i <= 250; i++) {
    const wait = await setTimeout(5000, "Waiting for gateway to be ready");
    log(wait);

    await axios
      .get(site)
      .then(res => {
        log("Gateway is reachable");
        log(res.status);
        log(res.statusText);
        expect(res.status).toBe(200);
        reachable = true;
      })
      .catch(() => {
        log("Gateway is not reachable");
      });
    if (reachable) break;
    if (i === 250) throw new Error("Gateway is unreachable after retries");
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
