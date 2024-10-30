import { FilterOptions, GatewayNameModel, MachineModel, MachinesModel, NetworkModel } from "../src";
import { config, getClient } from "./client_loader";
import { log } from "./utils";

const name = "newVMs";

function createNetworkModel(gwNode: number, name: string): NetworkModel {
  return {
    name,
    addAccess: true,
    accessNodeId: gwNode,
    ip_range: "10.238.0.0/16",
  } as NetworkModel;
}
function createMachineModel(node: number) {
  return {
    name: "testvm1",
    node_id: node,
    public_ip: false,
    planetary: true,
    mycelium: true,
    cpu: 1,
    memory: 1024 * 2,
    rootfs_size: 0,
    disks: [],
    flist: "https://hub.grid.tf/tf-official-apps/threefoldtech-ubuntu-22.04.flist",
    entrypoint: "/usr/bin/python3 -m http.server --bind ::",
    env: {
      SSH_KEY: config.ssh_key,
    },
  } as MachineModel;
}
function createMachinesModel(vm: MachineModel, network: NetworkModel): MachinesModel {
  return {
    name,
    network,
    machines: [vm],
    metadata: "",
    description: "test deploying VMs with wireguard via ts grid3 client",
  } as MachinesModel;
}
function createGwModel(node_id: number, ip: string, networkName: string, name: string, port: number) {
  return {
    name,
    node_id,
    tls_passthrough: false,
    backends: [`http://${ip}:${port}`],
    network: networkName,
  } as GatewayNameModel;
}

async function deployVM(client, vms) {
  const res = await client.machines.deploy(vms);
  log("================= Deploying VM =================");
  log(res);
  log("================= Deploying VM =================");
}

async function getVMDeployment(client, vms) {
  const res = await client.machines.getObj(vms);
  log("================= Getting deployment information =================");
  log(res);
  log("================= Getting deployment information =================");
  return res;
}

async function deployGw(client, gw) {
  const res = await client.gateway.deploy_name(gw);
  log("================= Deploying name gateway =================");
  log(res);
  log("================= Deploying name gateway =================");
}

async function getGwDeployment(client, gw) {
  const res = await client.gateway.getObj(gw);
  log("================= Getting deployment information =================");
  log(res);
  log("================= Getting deployment information =================");
}

async function deleteVM(client, vms) {
  const res = await client.machines.delete(vms);
  log("================= Canceling the VM deployment =================");
  log(res);
  log("================= Canceling the VM deployment =================");
}

async function deleteGw(client, gw) {
  const res = await client.gateway.delete_name(gw);
  log("================= Canceling the GW deployment =================");
  log(res);
  log("================= Canceling the GW deployment =================");
}

async function main() {
  const grid3 = await getClient(`vm/${name}`);

  const gwNode = +(await grid3.capacity.filterNodes({ gateway: true }))[0].nodeId;

  const vmQueryOptions: FilterOptions = {
    cru: 1,
    mru: 2, // GB
    availableFor: grid3.twinId,
    farmId: 1,
  };
  const vmNode = +(await grid3.capacity.filterNodes(vmQueryOptions))[0].nodeId;

  const network = createNetworkModel(gwNode, "monNetwork");
  const vm = createMachineModel(vmNode);
  const machines = createMachinesModel(vm, network);
  log(`Deploying vm on node: ${vmNode}, with network node: ${gwNode}`);

  // deploy the vm
  await deployVM(grid3, machines);

  //Get VM deployment
  const deployedVm = await getVMDeployment(grid3, name);

  const vmPrivateIP = (deployedVm as { interfaces: { ip: string }[] }[])[0].interfaces[0].ip;
  const gateway = createGwModel(gwNode, vmPrivateIP, network.name, "pyserver1", 8000);
  log(`deploying gateway ${network.name} on node ${gwNode}`);

  //Deploy GW
  await deployGw(grid3, gateway);

  //Get GW deployment
  await getGwDeployment(grid3, gateway.name);

  // delete
  await deleteVM(grid3, { name });
  // await deleteGw(grid3, { name: gateway.name });

  await grid3.disconnect();
}

main();
