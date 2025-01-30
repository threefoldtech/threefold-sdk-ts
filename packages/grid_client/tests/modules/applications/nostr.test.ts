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

beforeAll(async () => {
  gridClient = await getClient();
  return gridClient;
});

async function deploy(client: GridClient, vms: MachinesModel, subdomain: string, gatewayNode: any) {
  // Deploy VM
  const resultVM = await client.machines.deploy(vms);
  log("================= Deploying VM =================");
  log(resultVM);
  log("================= Deploying VM =================");

  // Get WG interface details
  const wgnet = (await client.machines.getObj(vms.name))[0].interfaces[0];

  // Deploy Gateway
  const gateway: GatewayNameModel = {
    name: subdomain,
    network: wgnet.network,
    node_id: gatewayNode.nodeId,
    tls_passthrough: false,
    backends: [`http://${wgnet.ip}:8080`],
  };

  const resultGateway = await client.gateway.deploy_name(gateway);
  log("================= Deploying Gateway =================");
  log(resultGateway);
  log("================= Deploying Gateway =================");
}

async function getDeployment(client: GridClient, name: string, subdomain: string) {
  // Get VM deployment
  const resultVM = await client.machines.getObj(name);
  log("================= Getting VM Deployment =================");
  log(resultVM);
  log("================= Getting VM Deployment =================");

  // Get Gateway deployment
  const resultGateway = await client.gateway.getObj(subdomain);
  log("================= Getting Gateway Deployment =================");
  log(resultGateway);
  log(`https://${resultGateway[0].domain}`);
  log("================= Getting Gateway Deployment =================");
}

async function cancel(client: GridClient, name: string, subdomain: string) {
  // Cancel VM deployment
  const resultVM = await client.machines.delete({ name });
  log("================= Canceling VM Deployment =================");
  log(resultVM);
  log("================= Canceling VM Deployment =================");

  // Cancel Gateway deployment
  const resultGateway = await client.gateway.delete_name({ name: subdomain });
  log("================= Canceling Gateway Deployment =================");
  log(resultGateway);
  log("================= Canceling Gateway Deployment =================");
}
test("TCXXXX - Applications: Deploy Nostr with WireGuard", async () => {
  /**********************************************
     Test Suite: Grid3_Client_TS (Automated)
     Test Cases: TCXXXX - Applications: Deploy Nostr with WireGuard
     Scenario:
        - Generate Test Data/Nostr Config/Gateway Config.
        - Select a Node To Deploy the Nostr on.
        - Select a Gateway Node To Deploy the gateway on.
        - Deploy the Nostr solution.
        - Assert that the generated data matches
          the deployment details.
        - Pass the WireGuard IP of the Created Nostr instance
          to the Gateway Config.
        - Deploy the Gateway.
        - Assert that the generated data matches
          the deployment details.
        - Assert that the Gateway points at the WireGuard IP
          of the created Nostr.
        - Assert that the returned domain is working
          and returns correct data.
    **********************************************/

  // Test Data
  const name = "gw" + generateString(10).toLowerCase();
  const tlsPassthrough = false;
  const cpu = 2;
  const memory = 4;
  const rootfsSize = 0;
  const diskSize = 50;
  const networkName = generateString(15);
  const vmName = generateString(15);
  const diskName = generateString(15);
  const mountPoint = "/mnt/data";
  const publicIp = false;
  const ipRange = "10.252.0.0/16";
  const metadata = "{'deploymentType': 'nostr'}";
  const description = "Test deploying Nostr via ts grid3 client with WireGuard";

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
    features: [Features.wireguard, Features.mycelium],
    cru: cpu,
    mru: memory,
    sru: rootfsSize + diskSize,
    farmId: 1,
    availableFor: await gridClient.twins.get_my_twin_id(),
  } as FilterOptions);
  const nodeId = await getOnlineNode(nodes);
  if (nodeId === -1) throw new Error("No nodes available to complete this test");

  // VM Model
  const vms: MachinesModel = {
    name: name,
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
        planetary: false, // Planetary disabled
        mycelium: true,
        env: {
          SSH_KEY: config.ssh_key,
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

  // Retrieve the WireGuard network details of the VM
  const wgnet = result[0].interfaces[0];

  // Gateway Backend Configuration
  const backends = [`http://${wgnet.ip}:8080`];
  log(backends);

  // Gateway Model
  const gw: GatewayNameModel = {
    name: name,
    network: wgnet.network,
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

  // Gateway reachability check
  const site = `http://${wgnet.ip}:8080/`;
  log(`Testing Gateway URL: ${site}`);
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
