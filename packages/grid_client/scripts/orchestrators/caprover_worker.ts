import { Features, FilterOptions, MachinesModel } from "../../src";
import { config, getClient } from "../client_loader";
import { log } from "../utils";

async function deploy(client, vms) {
  const res = await client.machines.deploy(vms);
  log("================= Deploying Worker =================");
  log(res);
  log("================= Deploying Worker =================");
}

async function getDeployment(client, vms) {
  const res = await client.machines.getObj(vms);
  log("================= Getting deployment information =================");
  log(res);
  log("================= Getting deployment information =================");
}

async function cancel(client, vms) {
  const res = await client.machines.delete(vms);
  log("================= Canceling the deployment =================");
  log(res);
  log("================= Canceling the deployment =================");
}

async function main() {
  const name = "newVMS5";
  const grid3 = await getClient(`caprover/${name}`);

  const vmQueryOptions: FilterOptions = {
    cru: 4,
    mru: 4, // GB
    sru: 10,
    farmId: 1,
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
        name: "capworker1",
        node_id: +(await grid3.capacity.filterNodes(vmQueryOptions))[1].nodeId,
        disks: [
          {
            name: "wedDisk",
            size: 10,
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
          // These env. vars needed to be changed based on the leader node.
          PUBLIC_KEY: config.ssh_key,
          SWM_NODE_MODE: "worker",
          LEADER_PUBLIC_IP: "185.206.122.157",
          CAPTAIN_IMAGE_VERSION: "latest",
        },
      },
    ],
    metadata: "",
    description: "caprover worker machine/node",
  };

  //Deploy Caprover worker
  await deploy(grid3, vms);

  //Get the deployment
  await getDeployment(grid3, name);

  //Uncomment the line below to cancel the deployment
  // await cancel(grid3, { name });

  await grid3.disconnect();
}

main();
