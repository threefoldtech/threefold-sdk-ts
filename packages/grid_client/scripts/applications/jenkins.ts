import { FilterOptions, GatewayNameModel, MachinesModel } from "../../src";
import { config, getClient } from "../client_loader";
import { log, pingNodes } from "../utils";

async function deploy(client, vms, subdomain, gatewayNode) {
  const resultVM = await client.machines.deploy(vms);
  log("================= Deploying VM =================");
  log(resultVM);
  log("================= Deploying VM =================");

  const vmPlanetary = (await client.machines.getObj(vms.name))[0].planetary;
  // Name Gateway Model
  const gw: GatewayNameModel = {
    name: subdomain,
    node_id: gatewayNode.nodeId,
    tls_passthrough: false,
    backends: ["http://[" + vmPlanetary + "]:80"],
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
  const name = "newjenkins";
  const grid3 = await getClient(`jenkins/${name}`);
  const subdomain = "jk" + grid3.twinId + name;
  const instanceCapacity = { cru: 2, mru: 4, sru: 50 }; // Medium flavor as an example

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
      name: "jknet",
      ip_range: "10.254.0.0/16",
    },
    machines: [
      {
        name: "jenkins",
        node_id: vmNode,
        disks: [
          {
            name: "jkDisk",
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
        flist: "https://hub.grid.tf/tf-official-apps/jenkins-latest.flist",
        entrypoint: "/sbin/zinit init",
        env: {
          SSH_KEY: config.ssh_key,
          JENKINS_HOSTNAME: domain,
          JENKINS_ADMIN_USERNAME: "admin", // Default username
          JENKINS_ADMIN_PASSWORD: "12345678", // Default password
        },
      },
    ],
    metadata: "",
    description: "test deploying Jenkins via ts grid3 client",
  };

  // Deploy VMs
  await deploy(grid3, vms, subdomain, gatewayNode);

  // Get the deployment
  await getDeployment(grid3, vms, subdomain);

  // Uncomment the line below to cancel the deployment
  // await cancel(grid3, { name }, { name: subdomain });

  await grid3.disconnect();
}

main();
