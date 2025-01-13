import { PublicIPResult, ResultStates, WorkloadTypes } from "../zos";

interface NetworkInterface {
  /** The network identifier */
  network: string;
  /** The IP address of the interface */
  ip: string;
}

interface ComputeCapacity {
  /** Number of CPU cores allocated */
  cpu: number;
  /** Amount of memory allocated in MB */
  memory: number;
}

interface BaseMountData {
  /** The name of the mount */
  name: string;
  /** The mount point in the filesystem */
  mountPoint: string;
}

interface ExtendedMountData extends Partial<BaseMountData> {
  /** The size of the mount (optional) */
  size?: number;
  /** The state of the mount result (optional) */
  state?: ResultStates;
  /** Message providing additional information about the mount result (optional) */
  message?: string;
  /** Cache information (optional) */
  cache?: any;
  /** Prefix information (optional) */
  prefix?: any;
  /** Minimal shards (optional) */
  minimal_shards?: number;
  /** Expected shards (optional) */
  expected_shards?: number;
  /** QSFS ZDBs name (optional) */
  qsfs_zdbs_name?: string;
  /** Metrics endpoint (optional) */
  metricsEndpoint?: string;
}

// Union type for the mount data
type MountData = BaseMountData | ExtendedMountData;
enum Features {
  ipv4 = "ipv4",
  ip = "ip",
  mycelium = "mycelium",
  wireguard = "wireguard",
  yggdrasil = "yggdrasil",
  gatewayfqdnproxy = "gateway-fqdn-proxy",
  gatewaynameproxy = "gateway-name-proxy",
  zmachine = "zmachine",
  zmount = "zmount",
  volume = "volume",
  network = "network",
  zdb = "zdb",
  qsfs = "qsfs",
  zlogs = "zlogs",
  networklight = "network-light",
  zmachinelight = "zmachine-light",
}
interface ZmachineData {
  /** The version of the workload */
  version: number;
  /** The type of the workload */
  type: WorkloadTypes;
  /** The contract ID associated with the workload */
  contractId: number;
  /** The node ID where the workload is deployed */
  nodeId: string;
  /** The name of the workload */
  name: string;
  /** The creation timestamp of the workload result */
  created: number;
  /** The current state of the workload */
  status: string;
  /** Message providing additional information about the workload state */
  message: string;
  /** The flist (file list) used by the workload */
  flist: string;
  /** The public IP address obtained by the machine */
  publicIP: PublicIPResult;
  /** The planetary IP address of the machine */
  planetary: string;
  /** The Mycelium IP address of the machine, if applicable */
  myceliumIP: string;
  /** List of network interfaces */
  interfaces: NetworkInterface[];
  /** The compute capacity (CPU and memory) allocated to the machine */
  capacity: ComputeCapacity;
  /** List of mounts associated with the machine */
  mounts: MountData[];
  /** Environment variables set for the workload */
  env: Record<string, unknown>;
  /** The entrypoint command for the workload */
  entrypoint: string;
  /** Metadata associated with the workload */
  metadata: string;
  /** Description of the workload */
  description: string;
  /** Size of the root filesystem */
  rootfs_size: number;
  /** Indicates if corex is enabled */
  corex: boolean;
  /** The list of the GPUs */
  gpu: string[] | undefined;
}

interface VM extends ZmachineData {
  customDomain?: string;
  deploymentName: string;
  projectName: string;
  wireguard: string;
}

interface GatewayDeploymentData {
  version: number;
  contractId: number;
  name: string;
  created: number;
  status: string;
  message: string;
  type: string;
  domain: string;
  tls_passthrough: boolean;
  backends: string[];
  metadata: string;
  description: string;
}

export { ZmachineData, VM, ExtendedMountData, GatewayDeploymentData, Features };
