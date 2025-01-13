import { ComputeCapacity } from "../zos/computecapacity";
import { Workload, WorkloadTypes } from "../zos/workload";
import { Mount, Zmachine, ZmachineNetwork, ZNetworkInterface } from "../zos/zmachine";
import { MachineInterface, ZmachineLight, ZmachineLightNetwork } from "../zos/zmachine_light";

class VMPrimitive {
  _createComputeCapacity(cpu: number, memory: number): ComputeCapacity {
    const compute_capacity = new ComputeCapacity();
    compute_capacity.cpu = cpu;
    compute_capacity.memory = memory * 1024 ** 2;
    return compute_capacity;
  }
  _createNetworkInterface(networkName: string, ip: string): ZNetworkInterface {
    const znetwork_interface = new ZNetworkInterface();
    znetwork_interface.network = networkName;
    znetwork_interface.ip = ip;
    return znetwork_interface;
  }
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
    zmachine.flist = flist;
    zmachine.network = this._createMachineNetwork(networkName, ip, planetary, mycelium, myceliumSeed, public_ip);
    zmachine.size = rootfs_size * 1024 ** 3;
    zmachine.mounts = disks;
    zmachine.entrypoint = entrypoint;
    zmachine.compute_capacity = this._createComputeCapacity(cpu, memory);
    zmachine.env = env;
    zmachine.corex = corex;
    zmachine.gpu = gpus;

    const zmachine_workload = new Workload();
    zmachine_workload.version = version || 0;
    zmachine_workload.name = name;
    zmachine_workload.type = WorkloadTypes.zmachine;
    zmachine_workload.data = zmachine;
    zmachine_workload.metadata = metadata;
    zmachine_workload.description = description;
    return zmachine_workload;
  }
}

class VMLightPrimitive {
  _createComputeCapacity(cpu: number, memory: number): ComputeCapacity {
    const compute_capacity = new ComputeCapacity();
    compute_capacity.cpu = cpu;
    compute_capacity.memory = memory * 1024 ** 2;
    return compute_capacity;
  }
  _createNetworkInterface(networkName: string, ip: string): MachineInterface {
    const zlightnetwork_interface = new MachineInterface();
    zlightnetwork_interface.network = networkName;
    zlightnetwork_interface.ip = ip;
    return zlightnetwork_interface;
  }
  _createMachineLightNetwork(
    networkName: string,
    ip: string,
    mycelium: boolean,
    myceliumSeed: string,
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
    zmachine_light.flist = flist;
    zmachine_light.network = this._createMachineLightNetwork(networkName, ip, mycelium, myceliumSeed);
    zmachine_light.size = rootfs_size * 1024 ** 3;
    zmachine_light.mounts = disks;
    zmachine_light.entrypoint = entrypoint;
    zmachine_light.compute_capacity = this._createComputeCapacity(cpu, memory);
    zmachine_light.env = env;
    zmachine_light.corex = corex;
    zmachine_light.gpu = gpus;

    const zmachine_light_workload = new Workload();
    zmachine_light_workload.version = version || 0;
    zmachine_light_workload.name = name;
    zmachine_light_workload.type = WorkloadTypes.zmachinelight;
    zmachine_light_workload.data = zmachine_light;
    zmachine_light_workload.metadata = metadata;
    zmachine_light_workload.description = description;
    return zmachine_light_workload;
  }
}
export { VMPrimitive, VMLightPrimitive };
