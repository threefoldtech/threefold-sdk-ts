import { FilterOptions, generateString, MachinesModel } from "../src";
import { config, getClient } from "./client_loader";
import { log } from "./utils";

async function deploy(client, vms) {
  const res = await client.machines.deploy(vms);
  log("================= Deploying VM =================");
  log(res);
  log("================= Deploying VM =================");
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
  const name = "vm" + generateString(8);
  const grid3 = await getClient(`vm/${name}`);

  const vmQueryOptions: FilterOptions = {
    cru: 8,
    mru: 16, // GB
    sru: 1000,
    availableFor: grid3.twinId,
    hasGPU: true,
    rentedBy: grid3.twinId,
  };

  const nodes = await grid3.capacity.filterNodes(vmQueryOptions);
  if (nodes.length === 0) {
    throw Error(`Couldn't find a node satisfying these filter options: ${JSON.stringify(vmQueryOptions)}`);
  }
  const nodeId = +nodes[0].nodeId;

  let gpuList = await grid3.zos.getNodeGPUInfo({ nodeId: nodeId });
  gpuList = gpuList.filter(g => g.contract === 0);
  if (gpuList.length <= 0) {
    throw Error(`Couldn't find GPU card available on node ${nodeId}`);
  }

  const vms: MachinesModel = {
    name,
    network: {
      name: "vmgpuNetwork",
      ip_range: "10.249.0.0/16",
    },
    machines: [
      {
        name: "vm" + generateString(8),
        node_id: nodeId,
        disks: [
          {
            name: "vmgpuDisk",
            size: 100,
            mountpoint: "/testdisk",
          },
        ],
        public_ip: false,
        public_ip6: false,
        planetary: true,
        mycelium: true,
        cpu: 8,
        memory: 1024 * 16,
        rootfs_size: 0,
        flist: "https://hub.grid.tf/tf-official-vms/ubuntu-22.04.flist",
        entrypoint: "/",
        env: {
          SSH_KEY: config.ssh_key,
        },
        gpus: [gpuList[0].id],
      },
    ],
    metadata: "",
    description: "test deploying VM with GPU via ts grid3 client",
  };

  //Deploy VMs
  await deploy(grid3, vms);

  //Get the deployment
  await getDeployment(grid3, name);

  //Uncomment the line below to cancel the deployment
  // await cancel(grid3, { name });

  await grid3.disconnect();
}

main();
