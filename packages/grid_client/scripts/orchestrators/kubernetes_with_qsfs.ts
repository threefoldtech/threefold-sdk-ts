import { FilterOptions, GridClient, K8SModel, QSFSZDBSModel } from "../../src";
import { config, getClient } from "../client_loader";
import { log, pingNodes } from "../utils";

async function deployQsfs(client: GridClient, qsfs: QSFSZDBSModel) {
  const res = await client.qsfs_zdbs.deploy(qsfs);
  log("================= Deploying QSFS =================");
  log(res);
  log("================= Deploying QSFS =================");
}

async function deploy(client: GridClient, k8s: K8SModel) {
  const res = await client.k8s.deploy(k8s);
  log("================= Deploying K8s =================");
  log(res);
  log("================= Deploying K8s =================");
}

async function getDeployment(client: GridClient, k8s: string) {
  const res = await client.k8s.getObj(k8s);
  log("================= Getting deployment information =================");
  log(res);
  log("================= Getting deployment information =================");
}

async function cancel(client: GridClient, k8s: string) {
  const res = await client.k8s.delete({ name: k8s });
  log("================= Canceling the deployment =================");
  log(res);
  log("================= Canceling the deployment =================");
}

async function deleteQsfs(client: GridClient, qsfs: string) {
  const res = await client.qsfs_zdbs.delete({ name: qsfs });
  log("================= Deleting QSFS =================");
  log(res);
  log("================= Deleting QSFS =================");
}

async function main() {
  const name = "testk8sqsfs";
  const grid3 = await getClient(`kubernetes/${name}`);

  const qsfs_name = "testQsfsK8sq1";
  const disk_size = 1;
  const count = 8;
  const options: FilterOptions = {
    cru: 2,
    mru: 2, // GB
    sru: 6,
    availableFor: grid3.twinId,
    farmId: 1,
    features: ["wireguard"],
  };

  const qsfsQueryOptions: FilterOptions = {
    hru: count * disk_size,
    availableFor: grid3.twinId,
    farmId: 1,
  };

  async function getNodeId(client: GridClient, options: FilterOptions) {
    const nodes = await client.capacity.filterNodes(options);
    const nodeId = await pingNodes(client, nodes);
    return nodeId;
  }

  const qsfsNode = await getNodeId(grid3, qsfsQueryOptions);
  const masterNode = await getNodeId(grid3, options);
  const workerNode = await getNodeId(grid3, { ...options, nodeExclude: [masterNode] });

  //create qsfs object
  const qsfs: QSFSZDBSModel = {
    name: qsfs_name,
    count,
    node_ids: [qsfsNode],
    password: "mypassword1",
    disk_size,
    description: "my qsfs test",
    metadata: "",
  };

  const k: K8SModel = {
    name,
    secret: "secret",
    network: {
      name: "k8sqsfsNetwork",
      ip_range: "10.238.0.0/16",
    },
    masters: [
      {
        name: "master",
        node_id: masterNode,
        cpu: 1,
        memory: 1024,
        rootfs_size: 0,
        disk_size: 1,
        public_ip: false,
        public_ip6: false,
        planetary: true,
        mycelium: true,
        qsfs_disks: [
          {
            qsfs_zdbs_name: qsfs_name,
            name: "testQsfsK8sd1",
            minimal_shards: 2,
            expected_shards: 4,
            encryption_key: "hamada",
            prefix: "hamada",
            cache: 1,
            mountpoint: "/myqsfsdisk",
          },
        ],
      },
    ],
    workers: [
      {
        name: "worker",
        node_id: workerNode,
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

  //Deploy QSFS
  await deployQsfs(grid3, qsfs);

  //Deploy K8s
  await deploy(grid3, k);

  //Get the deployment
  await getDeployment(grid3, name);

  // //Uncomment the line below to cancel the deployment
  // await cancel(grid3, k.name);
  // await deleteQsfs(grid3, qsfs_name);

  await grid3.disconnect();
}

main();
