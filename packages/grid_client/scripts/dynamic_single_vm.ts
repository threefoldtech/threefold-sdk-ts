import { Features, FilterOptions, generateRandomHexSeed, MachinesModel } from "../src";
import { config, getClient } from "./client_loader";
import { log, pingNodes } from "./utils";

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
  const name = "dynamicVMS";
  const grid3 = await getClient(`vm/${name}`);

  const vmQueryOptions: FilterOptions = {
    cru: 1,
    mru: 1, // GB
    sru: 7,
    availableFor: grid3.twinId,
    country: "Belgium",
    features: [Features.mycelium, Features.yggdrasil],
  };

  const nodes = await grid3.capacity.filterNodes(vmQueryOptions);
  const vmNode = await pingNodes(grid3, nodes);
  const vms: MachinesModel = {
    name,
    network: {
      name: "dynamictest",
      ip_range: "10.249.0.0/16",
      myceliumSeeds: [
        {
          nodeId: vmNode,
          /**
           * ### Mycelium Network Seed:
           * - The `seed` is an optional field used to provide a specific seed for the Mycelium network.
           * - If not provided, the `GridClient` will generate a seed automatically when the `mycelium` flag is enabled.
           * - **Use Case:** If you need the new machine to have the same IP address as a previously deleted machine, set the `seed` field to the old seed value.
           */
          seed: generateRandomHexSeed(32),
        },
      ],
    },
    machines: [
      {
        name: "testvm",
        node_id: +(await grid3.capacity.filterNodes(vmQueryOptions))[0].nodeId,
        disks: [
          {
            name: "dynamicDisk",
            size: 5,
            mountpoint: "/testdisk",
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

  //Uncomment the line below to cancel the deployment
  // await cancel(grid3, { name });

  await grid3.disconnect();
}

main();
