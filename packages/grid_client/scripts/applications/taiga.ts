import { Features, FilterOptions, GatewayNameModel, generateString, MachinesModel } from "../../src";
import { config, getClient } from "../client_loader";
import { log, pingNodes } from "../utils";

async function deploy(client, vms, subdomain, gatewayNode) {
  const resultVM = await client.machines.deploy(vms);
  log("================= Deploying VM =================");
  log(resultVM);
  log("================= Deploying VM =================");

  const vmPlanetary = (await client.machines.getObj(vms.name))[0].planetary;
  //Name Gateway Model
  const gw: GatewayNameModel = {
    name: subdomain,
    node_id: gatewayNode.nodeId,
    tls_passthrough: false,
    backends: ["http://[" + vmPlanetary + "]:9000"],
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
  const name = "tg" + generateString(8);
  const grid3 = await getClient(`taiga/${name}`);
  const subdomain = "tg" + grid3.twinId + name;
  const instanceCapacity = { cru: 2, mru: 4, sru: 50 }; // Update the instance capacity values according to your requirements.

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
        name: "tg" + generateString(8),
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
        flist: "https://hub.grid.tf/tf-official-apps/grid3_taiga_docker-latest.flist",
        entrypoint: "/sbin/zinit init",
        env: {
          SSH_KEY: config.ssh_key,
          DOMAIN_NAME: domain,
          // These email, username and password will be used as admin credentials, so please update them with your own.
          ADMIN_USERNAME: "admin123",
          ADMIN_PASSWORD: "admin123",
          ADMIN_EMAIL: "admin123@taiga.com",
          /* The SMTP server is optional, if you would like to enable the access of the SMTP server, you need to send these values.
           These credentials will be used as admin credentials, so please configure them with your own. */
          // EMAIL_HOST: "false",
          // EMAIL_PORT: "admin123@taiga.com",
          // EMAIL_HOST_USER: "admin123",
          // EMAIL_HOST_PASSWORD: "admin123",
          // EMAIL_USE_TLS: "false",
          // EMAIL_USE_SSL: "false",
        },
      },
    ],
    metadata: "",
    description: "test deploying Taiga via ts grid3 client",
  };

  //Deploy VMs
  await deploy(grid3, vms, subdomain, gatewayNode);

  //Get the deployment
  await getDeployment(grid3, vms, subdomain);

  //Uncomment the line below to cancel the deployment
  // await cancel(grid3, { name }, { name: subdomain });

  await grid3.disconnect();
}

main();
