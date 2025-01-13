import {
  AddMachineModel,
  DeleteMachineModel,
  DiskModel,
  type FilterOptions,
  type GridClient,
  MachineModel,
  MachinesModel,
  QSFSDiskModel,
  randomChoice,
} from "@threefold/grid_client";

import { generateName } from "../utils/strings";
import { createNetwork, type Network } from "./deploy_helpers";
import { getWireguardConfig } from "./load_deployment";

export async function deployVM(grid: GridClient, options: DeployVMOptions) {
  const vms = new MachinesModel();
  vms.name = options.name;
  await grid.machines.getObj(vms.name); //invalidating the cashed keys
  vms.network = createNetwork(options.network);
  vms.machines = await Promise.all(options.machines.map(createMachine));
  vms.metadata = options.metadata;
  vms.description = options.description;
  await grid.machines.deploy(vms);
  return loadVM(grid, vms.name);
}

export async function loadVM(grid: GridClient, name: string) {
  const vm = (await grid.machines.getObj(name)) as any;
  vm.deploymentName = name;
  vm.projectName = grid.clientOptions.projectName;
  const wireguard = await getWireguardConfig(grid, vm[0].interfaces[0].network, vm[0].interfaces[0].ip).catch(() => []);
  vm.wireguard = wireguard[0];
  return vm;
}

async function createMachine(machine: Machine): Promise<MachineModel> {
  const vm = new MachineModel();
  vm.name = machine.name;
  vm.node_id = machine.nodeId!;

  vm.disks = createDisks(machine.disks);
  vm.gpus = machine.gpus;
  vm.public_ip = machine.publicIpv4 || false;
  vm.public_ip6 = machine.publicIpv6 || false;
  vm.planetary = machine.planetary ?? true;
  vm.mycelium = machine.mycelium || false;
  vm.cpu = machine.cpu;
  vm.memory = machine.memory;
  vm.rootfs_size = machine.rootFilesystemSize || 0;
  vm.flist = machine.flist;
  vm.entrypoint = machine.entryPoint;
  vm.env = createEnvs(machine.envs);
  vm.solutionProviderId = +process.env.INTERNAL_SOLUTION_PROVIDER_ID!;
  vm.qsfs_disks = createQsfsDisks(machine.qsfsDisks);
  return vm;
}

function createQsfsDisks(disks: QsfsDisk[] = []): QSFSDiskModel[] {
  return disks.map(disk => {
    const qsfs = new QSFSDiskModel();
    qsfs.name = disk.name;
    qsfs.cache = disk.cache;
    qsfs.mountpoint = disk.mountpoint;
    qsfs.encryption_key = disk.encryption_key || disk.name;
    qsfs.prefix = disk.prefix || disk.name;
    qsfs.qsfs_zdbs_name = disk.zdbsName || disk.name;
    return qsfs;
  });
}

function createEnvs(envs: Env[] = []): { [key: string]: string } {
  return envs.reduce((result, env) => {
    result[env.key] = env.value;
    return result;
  }, {} as { [key: string]: string });
}

function createDisks(disks: Disk[] = []): DiskModel[] {
  return disks.map(disk => {
    const d = new DiskModel();
    d.name = disk.name || generateName({ prefix: "disk" });
    d.size = disk.size;
    d.mountpoint = disk.mountPoint;
    return d;
  });
}

export interface Env {
  key: string;
  value: string;
}

export interface Disk {
  name?: string;
  size: number;
  mountPoint: string;
}

export interface QsfsDisk {
  name: string;
  cache: number;
  mountpoint: string;
  encryption_key?: string;
  prefix?: string;
  zdbsName?: string;
}

export interface Machine {
  name: string;
  farmId?: number;
  farmName?: string;
  publicIpv4?: boolean;
  publicIpv6?: boolean;
  planetary?: boolean;
  mycelium?: boolean;
  cpu: number;
  memory: number;
  rootFilesystemSize?: number;
  flist: string;
  entryPoint: string;
  envs?: Env[];
  disks?: Disk[];
  country?: string;
  region?: string;
  qsfsDisks?: QsfsDisk[];
  gpus?: string[];
  hasGPU?: boolean;
  certified?: boolean;
  rentedBy?: number;
  nodeId?: number;
}

export interface DeployVMOptions {
  name: string;
  network?: Network;
  machines: Machine[];
  metadata?: string;
  description?: string;
}

export type AddMachineOptions = Machine & { deploymentName: string };

export async function addMachine(grid: GridClient, options: AddMachineOptions) {
  const filters: FilterOptions = {
    cru: options.cpu,
    mru: Math.round(options.memory / 1024),
    country: options.country,
    region: options.region,
    farmId: options.farmId,
    farmName: options.farmName,
    hru: options.qsfsDisks?.reduce((total, disk) => total + disk.cache, 0),
    sru: options.disks?.reduce((total, disk) => total + disk.size, options.rootFilesystemSize || 0),
    publicIPs: options.publicIpv4,
    availableFor: grid.twinId,
    hasGPU: options.hasGPU,
    rentedBy: options.hasGPU ? grid.twinId : undefined,
    planetary: options.planetary,
    mycelium: options.mycelium,
  };

  const machine = new AddMachineModel();
  machine.deployment_name = options.deploymentName;
  machine.cpu = options.cpu;
  machine.memory = options.memory;
  machine.disks = createDisks(options.disks);
  machine.node_id = +randomChoice(await grid.capacity.filterNodes(filters)).nodeId;
  machine.public_ip = options.publicIpv4 || false;
  machine.public_ip6 = options.publicIpv6 || false;
  machine.name = options.name;
  machine.planetary = options.planetary || true;
  machine.mycelium = options.mycelium || false;
  machine.flist = options.flist;
  machine.entrypoint = options.entryPoint;
  machine.qsfs_disks = createQsfsDisks(options.qsfsDisks);
  machine.rootfs_size = options.rootFilesystemSize || 0;
  machine.env = createEnvs(options.envs);
  machine.solutionProviderId = +process.env.INTERNAL_SOLUTION_PROVIDER_ID!;

  await grid.machines.add_machine(machine);
  return loadVM(grid, options.deploymentName);
}

export interface DeleteMachineOptions {
  deploymentName: string;
  name: string;
}
export async function deleteMachine(grid: GridClient, options: DeleteMachineOptions) {
  const machine = new DeleteMachineModel();
  machine.deployment_name = options.deploymentName;
  machine.name = options.name;

  const deletedMachine = await grid.machines.delete_machine(machine);

  if (!deletedMachine.deleted && !deletedMachine.updated) {
    throw new Error("Failed to delete machine");
  }

  return deletedMachine;
}
