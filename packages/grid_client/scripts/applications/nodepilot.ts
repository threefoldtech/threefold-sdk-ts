import { FilterOptions, MachinesModel } from "../../src";
import { config, getClient } from "../client_loader";
import { log, pingNodes } from "../utils";

async function deploy(client, vms) {
  const resultVM = await client.machines.deploy(vms);
  log("================= Deploying VM =================");
  log(resultVM);
  log("================= Deploying VM =================");
}

async function getDeployment(client, vms) {
  const resultVM = await client.machines.getObj(vms.name);
  log("================= Getting deployment information =================");
  log(resultVM);
  log("================= Getting deployment information =================");
}

async function cancel(client, vms) {
  const resultVM = await client.machines.delete(vms);
  log("================= Canceling the deployment =================");
  log(resultVM);
  log("================= Canceling the deployment =================");
}

async function main() {
  const name = "newnodepilot";
  const grid3 = await getClient(`nodepilot/${name}`);
  const instanceCapacity = { cru: 8, mru: 8, sru: 32 }; // Update the instance capacity values according to your requirements.

  //VMNode Selection
  const vmQueryOptions: FilterOptions = {
    cru: instanceCapacity.cru,
    mru: instanceCapacity.mru,
    sru: instanceCapacity.sru,
    availableFor: grid3.twinId,
    farmId: 1,
    features: ["ipv4", "wiregaurd", "ip"],
  };
  const nodes = await grid3.capacity.filterNodes(vmQueryOptions);
  const vmNode = await pingNodes(grid3, nodes);

  const vms: MachinesModel = {
    name,
    network: {
      name: "wedtest",
      ip_range: "10.249.0.0/16",
    },
    machines: [
      {
        name: "nodepilot",
        node_id: vmNode,
        disks: [
          {
            name: "disk1",
            size: 15,
            mountpoint: "/mnt/disk1",
          },
          {
            name: "disk2",
            size: 15,
            mountpoint: "/mnt/disk2",
          },
        ],
        planetary: false,
        public_ip: true,
        public_ip6: true,
        mycelium: true,
        cpu: instanceCapacity.cru,
        memory: 1024 * instanceCapacity.mru,
        rootfs_size: 2,
        flist: "https://hub.grid.tf/tf-official-vms/node-pilot-zdbfs.flist",
        entrypoint: "/",
        env: {
          SSH_KEY: config.ssh_key,
        },
      },
    ],
    metadata: "",
    description: "test deploying Node Pilot via ts grid3 client",
  };

  //Deploy VMs
  await deploy(grid3, vms);

  //Get the deployment
  await getDeployment(grid3, vms);

  //Uncomment the line below to cancel the deployment
  // await cancel(grid3, { name });

  await grid3.disconnect();
}

main();
