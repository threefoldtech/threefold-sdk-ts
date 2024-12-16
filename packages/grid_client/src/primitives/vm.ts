import { ComputeCapacity } from "../zos/computecapacity";
import { Workload, WorkloadTypes } from "../zos/workload";
import { Mount, Zmachine, ZmachineNetwork, ZNetworkInterface } from "../zos/zmachine";
import { MachineInterface, ZmachineLight, ZmachineLightNetwork } from "../zos/zmachine_light";

abstract class VMBase {
  // Method to create compute capacity to be overidden
  _createComputeCapacity(cpu: number, memory: number): ComputeCapacity {
    const compute_capacity = new ComputeCapacity();
    compute_capacity.cpu = cpu;
    compute_capacity.memory = memory * 1024 ** 2; // Convert memory to bytes
    return compute_capacity;
  }

  // Method to create network interface to be overidden
  _createNetworkInterface(networkName: string, ip: string): ZNetworkInterface | MachineInterface {
    throw new Error("Method '_createNetworkInterface' must be implemented in a subclass");
  }

  // Method to create machine network to be overidden
  _createMachineNetwork(
    networkName: string,
    ip: string,
    planetary: boolean,
    mycelium: boolean,
    myceliumSeed: string,
    public_ip = "",
  ): ZmachineNetwork | ZmachineLightNetwork {
    throw new Error("Method '_createMachineNetwork' must be implemented in a subclass");
  }

  // Method for creating a workload based on wokload type
  _createWorkload(
    name: string,
    flist: string,
    cpu: number,
    memory: number,
    rootfs_size: number,
    disks: Mount[],
    networkName: string,
    ip: string,
    planetary: boolean,
    mycelium: boolean,
    myceliumSeed: string,
    public_ip: string,
    entrypoint: string,
    env: Record<string, unknown>,
    metadata: string,
    description: string,
    version: number,
    corex: boolean,
    gpus: string[],
    vm_data: Zmachine | ZmachineLight,
    workloadType: WorkloadTypes,
  ): Workload {
    const compute_capacity = this._createComputeCapacity(cpu, memory);
    const vm_network = this._createMachineNetwork(networkName, ip, planetary, mycelium, myceliumSeed, public_ip);

    const vm_workload = new Workload();
    vm_workload.version = version || 0;
    vm_workload.name = name;
    vm_workload.type = workloadType;
    vm_workload.data = vm_data;
    vm_workload.metadata = metadata;
    vm_workload.description = description;

    vm_data.flist = flist;
    vm_data.network = vm_network;
    vm_data.size = rootfs_size * 1024 ** 3; // Convert rootfs size to bytes
    vm_data.mounts = disks;
    vm_data.entrypoint = entrypoint;
    vm_data.compute_capacity = compute_capacity;
    vm_data.env = env;
    vm_data.corex = corex;
    vm_data.gpu = gpus;

    return vm_workload;
  }
}

// VMPrimitive class, extending VMBasePrimitive
class VMPrimitive extends VMBase {
  // Override _createNetworkInterface method
  _createNetworkInterface(networkName: string, ip: string): ZNetworkInterface {
    const znetwork_interface = new ZNetworkInterface();
    znetwork_interface.network = networkName;
    znetwork_interface.ip = ip;
    return znetwork_interface;
  }

  // Override _createMachineNetwork method
  _createMachineNetwork(
    networkName: string,
    ip: string,
    planetary: boolean,
    mycelium: boolean,
    myceliumSeed: string,
    public_ip = "",
  ): ZmachineNetwork {
    const zmachine_network = new ZmachineNetwork();
    zmachine_network.planetary = planetary;
    zmachine_network.interfaces = [this._createNetworkInterface(networkName, ip)];
    zmachine_network.public_ip = public_ip;

    if (mycelium) {
      zmachine_network.mycelium = {
        hex_seed: myceliumSeed,
        network: networkName,
      };
    }
    return zmachine_network;
  }

  // Create method to create VM workload
  create(
    name: string,
    flist: string,
    cpu: number,
    memory: number,
    rootfs_size: number,
    disks: Mount[],
    networkName: string,
    ip: string,
    planetary: boolean,
    mycelium: boolean,
    myceliumSeed: string,
    public_ip: string,
    entrypoint: string,
    env: Record<string, unknown>,
    metadata = "",
    description = "",
    version = 0,
    corex = false,
    gpus: string[] = [],
  ): Workload {
    const zmachine = new Zmachine();
    return this._createWorkload(
      name,
      flist,
      cpu,
      memory,
      rootfs_size,
      disks,
      networkName,
      ip,
      planetary,
      mycelium,
      myceliumSeed,
      public_ip,
      entrypoint,
      env,
      metadata,
      description,
      version,
      corex,
      gpus,
      zmachine,
      WorkloadTypes.zmachine,
    );
  }
}

// VMLightPrimitive class, extending VMBasePrimitive
class VMLightPrimitive extends VMBase {
  // Override _createNetworkInterface
  _createNetworkInterface(networkName: string, ip: string): MachineInterface {
    const zlightnetwork_interface = new MachineInterface();
    zlightnetwork_interface.network = networkName;
    zlightnetwork_interface.ip = ip;
    return zlightnetwork_interface;
  }

  // Override _createMachineNetwork method
  _createMachineNetwork(
    networkName: string,
    ip: string,
    planetary: boolean,
    mycelium: boolean,
    myceliumSeed: string,
    public_ip = "",
  ): ZmachineLightNetwork {
    const zmachine_lightnetwork = new ZmachineLightNetwork();
    zmachine_lightnetwork.interfaces = [this._createNetworkInterface(networkName, ip)];

    if (mycelium) {
      zmachine_lightnetwork.mycelium = {
        hex_seed: myceliumSeed,
        network: networkName,
      };
    }
    return zmachine_lightnetwork;
  }

  // Create method to create VM light workload
  create(
    name: string,
    flist: string,
    cpu: number,
    memory: number,
    rootfs_size: number,
    disks: Mount[],
    networkName: string,
    ip: string,
    planetary: boolean,
    mycelium: boolean,
    myceliumSeed: string,
    public_ip: string,
    entrypoint: string,
    env: Record<string, string>,
    metadata = "",
    description = "",
    version = 0,
    corex = false,
    gpus: string[] = [],
  ): Workload {
    const zmachine_light = new ZmachineLight();
    return this._createWorkload(
      name,
      flist,
      cpu,
      memory,
      rootfs_size,
      disks,
      networkName,
      ip,
      planetary,
      mycelium,
      myceliumSeed,
      public_ip,
      entrypoint,
      env,
      metadata,
      description,
      version,
      corex,
      gpus,
      zmachine_light,
      WorkloadTypes.zmachinelight,
    );
  }
}

export { VMPrimitive, VMLightPrimitive };
