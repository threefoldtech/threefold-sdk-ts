import { GridClient, MachinesModel } from "../src";
import { type ZmachineData } from "../src/helpers/types";
import { config, getClient } from "./client_loader";
import { log } from "./utils";

async function deploy(client: GridClient, vms: MachinesModel) {
  const res = await client.machines.deploy(vms);
  log("================= Deploying VM =================");
  log(res);
  log("================= Deploying VM =================");
}

async function getDeployment(client: GridClient, name: string): Promise<ZmachineData[]> {
  const res = await client.machines.getObj(name);
  log("================= Getting deployment information =================");
  log(res);
  log("================= Getting deployment information =================");
  return res;
}

async function cancel(client: GridClient, name: string) {
  const res = await client.machines.delete({ name: name });
  log("================= Canceling the deployment =================");
  log(res);
  log("================= Canceling the deployment =================");
}

async function main() {
  const name = "newVMS";
  const grid3 = await getClient(`vm/${name}`);

  const vms: MachinesModel = {
    name,
    network: {
      name: "wedtest",
      ip_range: "10.249.0.0/16",
    },
    machines: [
      {
        name: "testvm",
        node_id: 11,
        disks: [
          {
            name: "wedDisk",
            size: 8,
            mountpoint: "/testdisk",
          },
        ],
        public_ip: false,
        public_ip6: false,
        planetary: true,
        mycelium: true,
        cpu: 1,
        memory: 1024 * 2,
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

  //Uncomment the line below to cancel the deployment
  // await cancel(grid3, name);

  await grid3.disconnect();
}

main();
