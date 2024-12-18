import { FilterOptions, GatewayNameModel, MachinesModel } from "../../src";
import { config, getClient } from "../client_loader";
import { log, pingNodes } from "../utils";

async function deploy(client, vms, subdomain, gatewayNode) {
  const resultVM = await client.machines.deploy(vms);
  log("================= Deploying VM =================");
  log(resultVM);
  log("================= Deploying VM =================");

  const GatewayIP = (await client.machines.getObj(vms.name))[0].publicIP;

  // Name Gateway Model
  const gw: GatewayNameModel = {
    name: subdomain,
    node_id: gatewayNode.nodeId,
    tls_passthrough: false,
    backends: [`http://[${VMmyceliumIP}]:3000`],
  };

  const resultGateway = await client.gateway.deploy_name(gw);
  log("================= Deploying name gateway =================");
  log(resultGateway);
  log("================= Deploying name gateway =================");
}

async function getDeployment(client, vms, gw) {
  const resultVM = await client.machines.getObj(vms.name);
  const resultGateway = await client.gateway.getObj(gw);
  log("================= Getting deployment information =================");
  log(resultVM);
  log(resultGateway);
  log("https://" + resultGateway[0].domain);
  log("================= Getting deployment information =================");
}

async function cancel(client, vms, gw) {
  const resultVM = await client.machines.delete(vms);
  const resultGateway = await client.gateway.delete_name(gw);
  log("================= Canceling the deployment =================");
  log(resultVM);
  log(resultGateway);
  log("================= Canceling the deployment =================");
}

async function main() {
  const name = `newgitea${Math.random().toString(36).substring(2, 8)}`;
  const networkName = `net${Math.random().toString(36).substring(2, 8)}`;
  const grid3 = await getClient(`gitea/${name}`);
  const instanceCapacity = { cru: 2, mru: 4, sru: 50 };
  const subdomain = `gt${grid3.twinId}${name}${Math.random().toString(36).substring(2, 6)}`;

  // VMNode Selection
  const vmQueryOptions: FilterOptions = {
    cru: instanceCapacity.cru,
    mru: instanceCapacity.mru,
    sru: instanceCapacity.sru,
    availableFor: grid3.twinId,
    farmId: 1,
  };

  // GatewayNode Selection
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
      name: networkName,
      ip_range: "10.253.0.0/16",
    },
    machines: [
      {
        name: `vm${Math.random().toString(36).substring(2, 8)}`,
        node_id: vmNode,
        disks: [
          {
            name: `disk${Math.random().toString(36).substring(2, 8)}`,
            size: instanceCapacity.sru,
            mountpoint: "/mnt/data",
          },
        ],
        planetary: true,
        public_ip: true,
        public_ip6: false,
        mycelium: true,
        cpu: instanceCapacity.cru,
        memory: 1024 * instanceCapacity.mru,
        rootfs_size: 0,
        flist: "https://hub.grid.tf/tf-official-apps/gitea-mycelium.flist",
        entrypoint: "/sbin/zinit init",
        env: {
          SSH_KEY: config.ssh_key,
          GITEA__HOSTNAME: domain,
          // GITEA__mailer__PROTOCOL: "smtp", // Optional: SMTP Configuration
          // GITEA__mailer__ENABLED: "false", // Set to true if enabling mail server
          // GITEA__mailer__HOST: "smtp.example.com",
          // GITEA__mailer__FROM: "admin@example.com",
          // GITEA__mailer__PORT: "587",
          // GITEA__mailer__USER: "admin",
          // GITEA__mailer__PASSWD: "password123",
        },
      },
    ],
    metadata: "",
    description: "Deploying Gitea via TS Grid3 client",
  };

  // Deploy VMs
  await deploy(grid3, vms, subdomain, gatewayNode);

  // Get the deployment
  await getDeployment(grid3, vms, subdomain);

  // Uncomment to cancel the deployment
  // await cancel(grid3, { name }, { name: subdomain });

  await grid3.disconnect();
}

main();
