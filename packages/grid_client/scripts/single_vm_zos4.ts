import { Features, FilterOptions, generateRandomHexSeed, GridClient, MachinesDeleteModel, MachinesModel } from "../src";
import { config, getClient } from "./client_loader";
import { log, pingNodes } from "./utils";

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
  const name = "vm";
  const grid3 = await getClient(`vm/${name}`);
  const instanceCapacity = { cru: 2, mru: 4, sru: 100 }; // Update the instance capacity values according to your requirements.

  //VMNode Selection
  const vmQueryOptions: FilterOptions = {
    cru: instanceCapacity.cru,
    mru: instanceCapacity.mru,
    sru: instanceCapacity.sru,
    availableFor: grid3.twinId,
    features: [Features.zmachinelight, Features.networklight, Features.mycelium],
    nodeExclude: [259],
  };
  const nodes = await grid3.capacity.filterNodes(vmQueryOptions);
  const vmNode = await pingNodes(grid3, nodes);

  const vms: MachinesModel = {
    name,
    network: {
      name: "vmNode",
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
        name: "testvmMY",
        node_id: vmNode,
        disks: [
          {
            name: "wedDisk",
            size: instanceCapacity.sru,
            mountpoint: "/testdisk",
          },
        ],
        planetary: false,
        public_ip: false,
        public_ip6: false,
        /**
         * ### Mycelium Flag Behavior:
         * - When the `mycelium` flag is enabled, there’s no need to manually provide the `myceliumSeed` flag.
         * - The `GridClient` will automatically generate the necessary seed for you.
         * - **However**, if you have **an existing seed** from a previously deleted machine and wish to deploy a new machine that retains the same IP address,
         * - **you can simply pass in the old seed during deployment instead of calling the `generateRandomHexSeed()` function**.
         */
        mycelium: true,
        /**
         * ### Mycelium Seed:
         * - The `myceliumSeed` is an optional field used to provide a specific seed for the Mycelium network.
         * - If not provided, the `GridClient` will generate a seed automatically when the `mycelium` flag is enabled.
         * - **Use Case:** If you need the new machine to have the same IP address as a previously deleted machine, set the `seed` field to the old seed value.         */
        myceliumSeed: generateRandomHexSeed(6), // (HexSeed of length 6)
        cpu: instanceCapacity.cru,
        memory: 1024 * instanceCapacity.mru,
        rootfs_size: 0,
        flist: "https://hub.grid.tf/tf-official-apps/base:latest.flist",
        entrypoint: "/sbin/zinit init",
        env: {
          SSH_KEY: config.ssh_key,
        },
      },
    ],
    metadata: "",
    description: "test deploying single ZOS4 VM with mycelium via ts grid3 client",
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
