import {
  Features,
  FilterOptions,
  GatewayNameModel,
  generateString,
  GridClient,
  MachinesModel,
  NodeInfo,
} from "../../src";
import { config, getClient } from "../client_loader";
import { log, pingNodes } from "../utils";

async function deploy(client: GridClient, vms: MachinesModel, subdomain: string, gatewayNode: NodeInfo) {
  // Deploying VM
  const resultVM = await client.machines.deploy(vms);
  log("================= Deploying VM =================");
  log(resultVM);
  log("================= Deploying VM =================");
  //Name Gateway Model
  const vmPlanetary = (await client.machines.getObj(vms.name))[0].planetary;
  const gw: GatewayNameModel = {
    name: subdomain,
    node_id: gatewayNode.nodeId,
    tls_passthrough: false,
    backends: ["http://[" + vmPlanetary + "]:9000"],
  };
  // Deploying Gateway
  const resultGateway = await client.gateway.deploy_name(gw);
  log("================= Deploying name gateway =================");
  log(resultGateway);
  log("================= Deploying name gateway =================");
}

async function getDeployment(client: GridClient, vms: MachinesModel, gw: string) {
  const resultVM = await client.machines.getObj(vms.name);
  const resultGateway = await client.gateway.getObj(gw);
  log("================= Getting deployment information =================");
  log(resultVM);
  log(resultGateway);
  log("https://" + resultGateway[0].domain);
  log("================= Getting deployment information =================");
}

async function cancel(client: GridClient, vms: string, gw: string) {
  const resultVM = await client.machines.delete({ name: vms });
  const resultGateway = await client.gateway.delete_name({ name: gw });
  log("================= Canceling the deployment =================");
  log(resultVM);
  log(resultGateway);
  log("================= Canceling the deployment =================");
}

async function main() {
  const name = "sw" + generateString(8);
  const grid3 = await getClient(`staticwebsite/${name}`);
  const subdomain = "sw" + grid3.twinId + name;
  const instanceCapacity = { cru: 1, mru: 2, sru: 50 }; // Update the instance capacity values according to your requirements.

  //VMNode Selection
  const vmQueryOptions: FilterOptions = {
    cru: instanceCapacity.cru,
    mru: instanceCapacity.mru,
    sru: instanceCapacity.sru,
    availableFor: grid3.twinId,
    farmId: 1,
    features: [Features.wireguard],
  };
  //GatewayNode Selection
  const gatewayQueryOptions: FilterOptions = {
    gateway: true,
    availableFor: grid3.twinId,
  };
  const gatewayNode = (await grid3.capacity.filterNodes(gatewayQueryOptions))[0];
  const nodes = await grid3.capacity.filterNodes(vmQueryOptions);
  const vmNode = await pingNodes(grid3, nodes);
  const domain = subdomain + "." + gatewayNode.publicConfig.domain;

  const vms: MachinesModel = {
    name,
    network: {
      name: "wedtest",
      ip_range: "10.249.0.0/16",
    },
    machines: [
      {
        name: "sw" + generateString(8),
        node_id: vmNode,
        disks: [
          {
            name: "wedDisk",
            size: instanceCapacity.sru,
            mountpoint: "/var/lib/docker",
          },
        ],
        planetary: true,
        public_ip: false,
        public_ip6: false,
        mycelium: true,
        cpu: instanceCapacity.cru,
        memory: 1024 * instanceCapacity.mru,
        rootfs_size: 0,
        flist: "https://hub.grid.tf/tf-official-apps/staticwebsite-latest.flist",
        entrypoint: "/sbin/zinit init",
        env: {
          SSH_KEY: config.ssh_key,
          STATICWEBSITE_DOMAIN: domain,
          // Enter the HTTPS URL for the Git repository that needs to be cloned.
          GITHUB_URL: "https://github.com/cloudacademy/static-website-example",
          GITHUB_BRANCH: "", // Optional, Enter the Git Branch if available
          HTML_DIR: "website", // Optional, Enter the html directory that needs to be served if available
        },
      },
    ],
    metadata: "",
    description: "test deploying Static Website via ts grid3 client",
  };

  //Deploy VMs
  await deploy(grid3, vms, subdomain, gatewayNode);

  //Get the deployment
  await getDeployment(grid3, vms, subdomain);

  // Uncomment the line below to cancel the deployment
  await cancel(grid3, name, subdomain);

  await grid3.disconnect();
}

main();
