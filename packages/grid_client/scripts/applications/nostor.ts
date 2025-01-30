import { Features, FilterOptions, GatewayNameModel, GridClient, MachinesModel } from "../../src";
import { config, getClient } from "../client_loader";
import { log, pingNodes } from "../utils";

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

async function main() {
  const name = "newnostr1";
  const grid3 = await getClient(`nostr/${name}`);
  const subdomain = `ntt${grid3.twinId}${name}`;
  const instanceCapacity = { cru: 2, mru: 4, sru: 50 };

  // VM Query Options
  const vmQueryOptions: FilterOptions = {
    features: [Features.wireguard, Features.mycelium],
    cru: instanceCapacity.cru,
    mru: instanceCapacity.mru,
    sru: instanceCapacity.sru,
    availableFor: grid3.twinId,
    farmId: 1,
  };

  // Gateway Query Options
  const gatewayQueryOptions: FilterOptions = {
    features: [Features.wireguard, Features.mycelium],
    gateway: true,
    availableFor: grid3.twinId,
  };

  const gatewayNode = (await grid3.capacity.filterNodes(gatewayQueryOptions))[0];
  const nodes = await grid3.capacity.filterNodes(vmQueryOptions);
  const vmNode = await pingNodes(grid3, nodes);
  const domain = `${subdomain}.${gatewayNode.publicConfig.domain}`;

  const vms: MachinesModel = {
    name,
    network: {
      name: "nostrnet",
      ip_range: "10.252.0.0/16",
      addAccess: true,
      accessNodeId: gatewayNode.nodeId,
    },
    machines: [
      {
        name: "nostr",
        node_id: vmNode,
        disks: [
          {
            name: "nsDisk",
            size: instanceCapacity.sru,
            mountpoint: "/mnt/data",
          },
        ],
        planetary: true,
        public_ip: false,
        public_ip6: false,
        mycelium: true,
        cpu: instanceCapacity.cru,
        memory: 1024 * instanceCapacity.mru,
        rootfs_size: 0,
        flist: "https://hub.grid.tf/tf-official-apps/nostr_relay-mycelium.flist",
        entrypoint: "/sbin/zinit init",
        env: {
          SSH_KEY: config.ssh_key,
          NOSTR_HOSTNAME: domain,
        },
      },
    ],
    metadata: "",
    description: "Deploying Nostr instance via TS Grid3 client",
  };

  // Deploy VM and Gateway
  await deploy(grid3, vms, subdomain, gatewayNode);

  // Get the deployment details
  await getDeployment(grid3, name, subdomain);

  // Uncomment the line below to cancel the deployment
  // await cancel(grid3, name, subdomain);

  await grid3.disconnect();
}

main();
