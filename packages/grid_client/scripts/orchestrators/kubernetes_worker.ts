import { AddWorkerModel, FilterOptions } from "../../src";
import { getClient } from "../client_loader";
import { log } from "../utils";

// Please run kubernetes script first before running this one to create the cluster.

async function addWorker(client, worker) {
  const res = await client.k8s.add_worker(worker);
  log("================= Adding worker =================");
  log(res);
  log("================= Adding worker =================");
}

async function getWorker(client, worker) {
  const res = await client.k8s.getObj(worker);
  log("================= Getting worker information =================");
  log(res);
  log("================= Getting worker information =================");
}

async function deleteWorker(client, worker) {
  const res = await client.k8s.delete_worker(worker);
  log("================= Deleting the worker =================");
  log(res);
  log("================= Deleting the worker =================");
}

async function main() {
  const name = "testk8s";
  const grid3 = await getClient(`kubernetes/${name}`);

  const workerQueryOptions: FilterOptions = {
    cru: 2,
    mru: 1, // GB
    sru: 10,
    farmId: 1,
  };

  const worker: AddWorkerModel = {
    deployment_name: name,
    name: "worker2",
    node_id: +(await grid3.capacity.filterNodes(workerQueryOptions))[0].nodeId,
    cpu: 2,
    memory: 1024,
    rootfs_size: 0,
    disk_size: 8,
    public_ip: false,
    public_ip6: false,
    planetary: true,
    mycelium: true,
  };

  //Add Worker
  await addWorker(grid3, worker);

  //Get worker information
  await getWorker(grid3, name);

  //Uncomment the line below to delete the worker
  // await deleteWorker(grid3, { name: worker.name, deployment_name: name });

  await grid3.disconnect();
}

main();
