import { FilterOptions, MachinesModel, QSFSZDBSModel } from "../src";
import { config, getClient } from "./client_loader";
import { log } from "./utils";

async function deployQsfs(client, qsfs) {
  const res = await client.qsfs_zdbs.deploy(qsfs);
  log("================= Deploying QSFS =================");
  log(res);
  log("================= Deploying QSFS =================");
}

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

async function deleteQsfs(client, qsfs) {
  const res = await client.qsfs_zdbs.delete(qsfs);
  log("================= Deleting QSFS =================");
  log(res);
  log("================= Deleting QSFS =================");
}

async function main() {
  const name = "wed2710t1";
  const grid3 = await getClient(`vm/${name}`);

  const qsfs_name = "wed2710q1";

  const vmQueryOptions: FilterOptions = {
    cru: 1,
    mru: 1, // GB
    sru: 7,
    availableFor: grid3.twinId,
    farmId: 1,
  };

  const qsfsQueryOptions: FilterOptions = {
    hru: 15,
    availableFor: grid3.twinId,
    farmId: 1,
  };

  const qsfsNodes: number[] = [];

  const allNodes = await grid3.capacity.filterNodes(qsfsQueryOptions);
  if (allNodes.length >= 2) {
    qsfsNodes.push(+allNodes[0].nodeId, +allNodes[1].nodeId);
  } else {
    throw Error("Couldn't find nodes for qsfs");
  }

  const vmNode = +(await grid3.capacity.filterNodes(vmQueryOptions))[0].nodeId;

  const qsfs: QSFSZDBSModel = {
    name: qsfs_name,
    count: 8,
    node_ids: qsfsNodes,
    password: "mypassword",
    disk_size: 1,
    description: "my qsfs test",
    metadata: "",
  };

  const vms: MachinesModel = {
    name,
    network: {
      name: "wed2710n1",
      ip_range: "10.201.0.0/16",
    },
    machines: [
      {
        name: "wed2710v1",
        node_id: vmNode,
        disks: [
          {
            name: "wed2710d1",
            size: 1,
            mountpoint: "/mydisk",
          },
        ],
        qsfs_disks: [
          {
            qsfs_zdbs_name: qsfs_name,
            name: "wed2710d2",
            minimal_shards: 2,
            expected_shards: 4,
            encryption_key: "hamada",
            prefix: "hamada",
            cache: 1,
            mountpoint: "/myqsfsdisk",
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

  //Deploy QSFS
  await deployQsfs(grid3, qsfs);

  //Deploy VMs
  await deploy(grid3, vms);

  //Get the deployment
  await getDeployment(grid3, name);

  //Uncomment the line below to cancel the deployment
  // await cancel(grid3, { name });
  // await deleteQsfs(grid3, { name: qsfs_name });

  await grid3.disconnect();
}

main();
