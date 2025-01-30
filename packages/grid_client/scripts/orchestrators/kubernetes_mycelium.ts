import { FilterOptions, generateString, K8SModel } from "../../src";
import { config, getClient } from "../client_loader";
import { log } from "../utils";

async function deploy(client, k8s) {
  const res = await client.k8s.deploy(k8s);
  log("================= Deploying K8s =================");
  log(res);
  log("================= Deploying K8s =================");
}

async function getDeployment(client, k8s) {
  const res = await client.k8s.getObj(k8s);
  log("================= Getting deployment information =================");
  log(res);
  log("================= Getting deployment information =================");
}

async function cancel(client, k8s) {
  const res = await client.k8s.delete(k8s);
  log("================= Canceling the deployment =================");
  log(res);
  log("================= Canceling the deployment =================");
}

async function main() {
  const name = "k8s" + generateString(8);
  const grid3 = await getClient(`kubernetes/${name}`);

  const k: K8SModel = {
    name,
    secret: "secret",
    network: {
      name: "monNetwork",
      ip_range: "10.238.0.0/16",
      addAccess: true,
      // myceliumSeeds: [
      //   {
      //     nodeId: 153,
      //     seed: "a5f0ea16a744af2c0c23fc878d727a6f355079f82d979ad4bc75dd8fb5ebc90e", //(HexSeed of length 32)
      //   },
      //   {
      //     nodeId: 31,
      //     seed: "7edd9c250f834cb326c3cf116040cf2214f38c669bf27a72e2f5b9e44fc7b27e", //(HexSeed of length 32)
      //   },
      //   {
      //     nodeId: 177,
      //     seed: "3162379d1d2530e2113ae2c7142370cc195628238fa1059f2f25ef51c113e892", //(HexSeed of length 32)
      //   },
      // ],
    },
    masters: [
      {
        name: "masterMy",
        node_id: 153,
        cpu: 1,
        memory: 1024,
        rootfs_size: 0,
        disk_size: 1,
        public_ip: false,
        public_ip6: false,
        planetary: true,
        mycelium: true,
        // myceliumSeed: "1791fed39e0f", //(HexSeed of length 6)
      },
    ],
    workers: [
      {
        name: "worker1",
        node_id: 31,
        cpu: 1,
        memory: 1024,
        rootfs_size: 0,
        disk_size: 1,
        public_ip: false,
        public_ip6: false,
        planetary: true,
        mycelium: true,
        // myceliumSeed: "580bafd349f5", //(HexSeed of length 6)
      },
      {
        name: "worker2",
        node_id: 177,
        cpu: 1,
        memory: 1024,
        rootfs_size: 0,
        disk_size: 1,
        public_ip: false,
        public_ip6: false,
        planetary: true,
        mycelium: true,
        // myceliumSeed: "0378c83a7e1f", //(HexSeed of length 6)
      },
    ],
    metadata: "",
    description: "test deploying k8s with mycelium via ts grid3 client",
    ssh_key: config.ssh_key,
  };

  //Deploy K8s
  await deploy(grid3, k);

  //Get the deployment
  await getDeployment(grid3, name);

  //Uncomment the line below to cancel the deployment
  // await cancel(grid3, { name });

  await grid3.disconnect();
}

main();
