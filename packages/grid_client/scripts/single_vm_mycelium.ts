import { generateRandomHexSeed, generateString, GridClient, MachinesDeleteModel, MachinesModel } from "../src";
import { config, getClient } from "./client_loader";
import { log } from "./utils";

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

async function cancel(client: GridClient, options: MachinesDeleteModel) {
  const res = await client.machines.delete(options);
  log("================= Canceling the deployment =================");
  log(res);
  log("================= Canceling the deployment =================");
}

async function main() {
  const name = "vm" + generateString(8);
  const grid3 = await getClient(`vm/${name}`);

  const vms: MachinesModel = {
    name,
    network: {
      name: "hellotest",
      ip_range: "10.249.0.0/16",
      myceliumSeeds: [
        {
          nodeId: 168,
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
        node_id: 168,
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
    description: "test deploying single VM with mycelium via ts grid3 client",
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
