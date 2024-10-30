import { FilterOptions, GridClient, MachinesModel } from "../src";
import { config, getClient } from "./client_loader";
import { log, pingNodes } from "./utils";

async function deploy(client: GridClient, vms: MachinesModel) {
  const res = await client.machines.deploy(vms);
  log("================= Deploying VM =================");
  log(res);
  log("================= Deploying VM =================");
}

async function getDeployment(client: GridClient, name: string) {
  const res = await client.machines.getObj(name);
  log("================= Getting deployment information =================");
  log(res);
  log("================= Getting deployment information =================");
}

async function cancel(client: GridClient, name: string) {
  const res = await client.machines.delete({ name });
  log("================= Canceling the deployment =================");
  log(res);
  log("================= Canceling the deployment =================");
}

async function getNodeId(client: GridClient, options: FilterOptions) {
  const nodes = await client.capacity.filterNodes(options);
  const nodeId = await pingNodes(client, nodes);
  return nodeId;
}

async function main() {
  const name = "monVMS2";
  const grid3 = await getClient(`vm/${name}`);

  const vmQueryOptions: FilterOptions = {
    cru: 1,
    mru: 1, // GB
    sru: 14,
    availableFor: grid3.twinId,
    farmId: 1,
  };

  const nodeId = await getNodeId(grid3, vmQueryOptions);

  const vms: MachinesModel = {
    name,
    network: {
      name: "monNetwork",
      ip_range: "10.238.0.0/16",
    },
    machines: [
      {
        name: "testvm1",
        node_id: nodeId!,
        disks: [
          {
            name: "newDisk1",
            size: 5,
            mountpoint: "/newDisk1",
          },
        ],
        public_ip: false,
        public_ip6: false,
        planetary: true,
        mycelium: true,
        cpu: 1,
        memory: 1024,
        rootfs_size: 0,
        flist: "https://hub.grid.tf/tf-official-apps/base:latest.flist",
        entrypoint: "/sbin/zinit init",
        env: {
          SSH_KEY: config.ssh_key,
        },
      },
      {
        name: "testvm2",
        node_id: nodeId!,
        disks: [
          {
            name: "newDisk2",
            size: 5,
            mountpoint: "/newDisk2",
          },
        ],
        public_ip: false,
        public_ip6: false,
        planetary: true,
        mycelium: true,
        cpu: 1,
        memory: 1024,
        rootfs_size: 0,
        flist: "https://hub.grid.tf/tf-official-apps/base:latest.flist",
        entrypoint: "/sbin/zinit init",
        env: {
          SSH_KEY: config.ssh_key,
        },
      },
    ],
    metadata: "",
    description: "test deploying VMs via ts grid3 client",
  };

  //Deploy VMs
  await deploy(grid3, vms);

  //Get the deployment
  await getDeployment(grid3, name);

  // //Uncomment the line below to cancel the deployment
  // await cancel(grid3, name);

  await grid3.disconnect();
}

main();
