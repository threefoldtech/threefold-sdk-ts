import { Features, FilterOptions, generateString, MachinesModel } from "../../src";
import { config, getClient } from "../client_loader";
import { log } from "../utils";

async function deploy(client, vms) {
  const res = await client.machines.deploy(vms);
  log("================= Deploying Caprover cluster =================");
  log(res);
  log("================= Deploying Caprover cluster =================");
}

async function getDeployment(client, vms) {
  const res = await client.machines.getObj(vms);
  log("================= Getting deployment information =================");
  log(res);
  log(`You can access Caprover via the browser using: http://captain.${res[0].env.CAPROVER_ROOT_DOMAIN}`);
  log("================= Getting deployment information =================");
}

async function cancel(client, vms) {
  const res = await client.machines.delete(vms);
  log("================= Canceling the deployment =================");
  log(res);
  log("================= Canceling the deployment =================");
}

async function main() {
  const name = "cr" + generateString(8);
  const grid3 = await getClient(`caprover/${name}`);

  const vmQueryOptions: FilterOptions = {
    cru: 4,
    mru: 4, // GB
    sru: 10,
    farmId: 1,
    availableFor: grid3.twinId,
    features: [Features.wireguard, Features.ip, Features.ipv4],
  };

  const vms: MachinesModel = {
    name,
    network: {
      name: "wedtest",
      ip_range: "10.249.0.0/16",
    },
    machines: [
      {
        name: "testvm",
        node_id: +(await grid3.capacity.filterNodes(vmQueryOptions))[0].nodeId,
        disks: [
          {
            name: "wedDisk",
            size: 8,
            mountpoint: "/var/lib/docker",
          },
        ],
        public_ip: true,
        public_ip6: false,
        planetary: false,
        mycelium: true,
        cpu: 4,
        memory: 1024 * 4,
        rootfs_size: 0,
        flist: "https://hub.grid.tf/tf-official-apps/tf-caprover-latest.flist",
        entrypoint: "/sbin/zinit init",
        env: {
          PUBLIC_KEY: config.ssh_key,
          SWM_NODE_MODE: "leader",
          CAPROVER_ROOT_DOMAIN: "rafy.grid.tf", // update me
          DEFAULT_PASSWORD: "captain42",
          CAPTAIN_IMAGE_VERSION: "latest",
        },
      },
    ],
    metadata: "",
    description: "caprover leader machine/node",
  };

  //Deploy Caprover cluster
  await deploy(grid3, vms);

  //Get the deployment
  await getDeployment(grid3, name);

  //Uncomment the line below to cancel the deployment
  // await cancel(grid3, { name });

  await grid3.disconnect();
}

main();
