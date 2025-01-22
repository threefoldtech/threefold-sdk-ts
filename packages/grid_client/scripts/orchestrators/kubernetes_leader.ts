import { Features, FilterOptions, K8SModel } from "../../src";
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
  const name = "testk8s";
  const grid3 = await getClient(`kubernetes/${name}`);

  const masterQueryOptions: FilterOptions = {
    cru: 2,
    mru: 2, // GB
    sru: 6,
    availableFor: grid3.twinId,
    farmId: 1,
    features: [Features.wireguard],
  };

  const workerQueryOptions: FilterOptions = {
    cru: 1,
    mru: 1, // GB
    sru: 3,
    availableFor: grid3.twinId,
    farmId: 1,
  };

  const k: K8SModel = {
    name,
    secret: "secret",
    network: {
      name: "monNetwork",
      ip_range: "10.238.0.0/16",
      addAccess: true,
    },
    masters: [
      {
        name: "master",
        node_id: +(await grid3.capacity.filterNodes(masterQueryOptions))[0].nodeId,
        cpu: 1,
        memory: 1024,
        rootfs_size: 0,
        disk_size: 1,
        public_ip: false,
        public_ip6: false,
        planetary: true,
        mycelium: true,
      },
    ],
    workers: [
      {
        name: "worker",
        node_id: +(await grid3.capacity.filterNodes(workerQueryOptions))[0].nodeId,
        cpu: 1,
        memory: 1024,
        rootfs_size: 0,
        disk_size: 1,
        public_ip: false,
        public_ip6: false,
        planetary: true,
        mycelium: true,
      },
    ],
    metadata: "",
    description: "test deploying k8s via ts grid3 client",
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
