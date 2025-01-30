import { plainToClass } from "class-transformer";

import {
  DeploymentResult,
  Encryption,
  MachineInterface,
  Mycelium,
  MyceliumIP,
  NetworkLight,
  Peer,
  QuantumCompression,
  QuantumSafeConfig,
  QuantumSafeFSConfig,
  QuantumSafeMeta,
  ResultStates,
  Workload,
  WorkloadTypes,
  ZdbBackend,
  ZdbGroup,
  ZdbModes,
  ZmachineLight,
  ZmachineLightNetwork,
} from "../../src";
import {
  ComputeCapacity,
  GatewayFQDNProxy,
  GatewayNameProxy,
  Mount,
  PublicIP,
  QuantumSafeFS,
  Volume,
  Zdb,
  Zlogs,
  Zmachine,
  ZmachineNetwork,
  Zmount,
  Znet,
} from "../../src";
import { PublicIPv4 } from "../../src/zos/ipv4";

let workload: Workload;

const createDataInstance = (type: WorkloadTypes) => {
  let instance;
  const network = new ZmachineNetwork();
  const networklight = new ZmachineLightNetwork();
  const interfaces = new MachineInterface();
  const myceliumip = new MyceliumIP();

  const computeCapacity = new ComputeCapacity();
  computeCapacity.cpu = 1;
  computeCapacity.memory = 256 * 1024 ** 2;
  const disks = new Mount();
  disks.name = "zdisk";
  disks.mountpoint = "/mnt/data";
  const peer = new Peer();
  peer.subnet = "10.0.1.0/24";
  peer.wireguard_public_key = "9I8H7G6F5E4D3C2B1A0J";
  peer.allowed_ips = ["10.0.1.6"];
  peer.endpoint = "185.206.122.31:5566";
  const mycelium = new Mycelium();
  mycelium.hex_key = "abc123";

  const rootfs_size = 2;
  const size = 100 * 1024 ** 2;
  const qsfsConfig = new QuantumSafeFSConfig();
  const encryption = new Encryption();
  const meta = new QuantumSafeMeta();
  const config = new QuantumSafeConfig();
  const backends = new ZdbBackend();
  const groups = new ZdbGroup();
  const compression = new QuantumCompression();
  const qsfsCache = 262144000;

  switch (type) {
    case WorkloadTypes.zmachine:
      instance = new Zmachine();
      network.planetary = true;
      network.public_ip = "10.249.0.0/16";
      network.interfaces = [
        {
          network: "znetwork",
          ip: "10.20.2.2",
        },
      ];
      network.mycelium = {
        network: "mycelium_net",
        hex_seed: "abc123",
      };

      instance.flist = "https://hub.grid.tf/tf-official-vms/ubuntu-22.04.flist";
      instance.network = network;
      instance.size = rootfs_size * 1024 ** 3;
      instance.mounts = [disks];
      instance.entrypoint = "/sbin/zinit init";
      instance.compute_capacity = computeCapacity;
      instance.env = { key: "value" };
      instance.corex = false;
      instance.gpu = ["AMD", "NIVIDIA"];
      break;
    case WorkloadTypes.zmachinelight:
      instance = new ZmachineLight();
      instance.flist = "https://hub.grid.tf/tf-official-vms/ubuntu-22.04.flist";
      interfaces.network = "znetwork";
      interfaces.ip = "10.20.2.2";
      networklight.interfaces = [interfaces];
      myceliumip.network = "mycelium_net";
      myceliumip.hex_seed = "abc123";
      networklight.mycelium = myceliumip;
      instance.network = networklight;
      instance.size = rootfs_size * 1024 ** 3;
      instance.compute_capacity = computeCapacity;
      instance.mounts = [disks];
      instance.env = { key: "value" };
      instance.entrypoint = "/sbin/zinit init";
      instance.corex = false;
      instance.gpu = ["AMD", "NIVIDIA"];
      break;
    case WorkloadTypes.zmount:
      instance = new Zmount();
      instance.size = size;
      break;

    case WorkloadTypes.volume:
      instance = new Volume();
      instance.size = size;
      break;

    case WorkloadTypes.network:
      instance = new Znet();
      instance.subnet = "10.0.0.1/32";
      instance.ip_range = "10.0.0.2/32";
      instance.wireguard_private_key = "2BwI0a7lVYxeKsh7jklashakdfjasdf7jksdHf";
      instance.wireguard_listen_port = 5566;
      instance.peers = [peer];
      instance.mycelium = mycelium;
      break;
    case WorkloadTypes.networklight:
      instance = new NetworkLight();
      instance.subnet = "10.0.0.1/32";
      instance.mycelium = mycelium;
      break;
    case WorkloadTypes.zdb:
      instance = new Zdb();
      instance.size = size;
      instance.mode = ZdbModes.user;
      instance.password = "123456";
      instance.public = false;
      break;

    case WorkloadTypes.ip:
      instance = new PublicIP();
      instance.v4 = true;
      instance.v6 = false;
      break;

    case WorkloadTypes.ipv4:
      instance = new PublicIPv4();
      break;

    case WorkloadTypes.qsfs:
      instance = new QuantumSafeFS();

      qsfsConfig.minimal_shards = 2;
      qsfsConfig.expected_shards = 3;
      qsfsConfig.redundant_groups = 0;
      qsfsConfig.redundant_nodes = 0;
      qsfsConfig.max_zdb_data_dir_size = 2;
      encryption.algorithm = "algorithm";
      encryption.key = "EncryptionKey12345678";
      qsfsConfig.encryption = encryption;
      meta.type = "qsfs";
      config.prefix = "qsfs";
      config.encryption = encryption;
      backends.address = "localhost";
      backends.namespace = "http://localhost";
      backends.password = "password";
      groups.backends = [backends];
      qsfsConfig.groups = [groups];
      config.backends = [backends];
      meta.config = config;
      qsfsConfig.meta = meta;
      compression.algorithm = "algorithm";
      qsfsConfig.compression = compression;

      instance.cache = qsfsCache;
      instance.config = qsfsConfig;
      break;

    case WorkloadTypes.zlogs:
      instance = new Zlogs();
      instance.zmachine = "zmachine";
      instance.output = "zlog";
      break;

    case WorkloadTypes.gatewayfqdnproxy:
      instance = new GatewayFQDNProxy();
      instance.fqdn = "dmftv9qfff.gent02.dev.grid.tf";
      instance.tls_passthrough = false;
      instance.backends = ["http://185.206.122.43:80"];
      break;

    case WorkloadTypes.gatewaynameproxy:
      instance = new GatewayNameProxy();
      instance.name = "GatewayNameProxy";
      instance.tls_passthrough = false;
      instance.backends = ["http://185.206.122.43:80"];
      break;

    default:
      throw new Error(`Invalid WorkloadType: ${type}`);
  }

  return instance;
};

describe.each(Object.values(WorkloadTypes))("Workload Tests for %s", type => {
  beforeEach(() => {
    const dataInstance = createDataInstance(type);
    workload = new Workload();
    workload.version = 1;
    workload.name = "Test Workload";
    workload.type = type;
    workload.metadata = "Metadata";
    workload.description = "A test for workload";
    workload.data = dataInstance;
    workload.result = new DeploymentResult();
    workload.result.created = Date.now();
    workload.result.state = ResultStates.ok;
    workload.result.message = "Deployment successful";
    workload.result.data = workload.data;
  });

  test("should create a valid Workload instance", () => {
    expect(workload).toBeInstanceOf(Workload);
  });

  test("should handle valid Workload properties", () => {
    expect(workload.version).toBe(1);
    expect(workload.name).toBe("Test Workload");
    expect(workload.type).toBe(type);
    expect(workload.metadata).toBe("Metadata");
    expect(workload.description).toBe("A test for workload");
    expect(workload.result.created).toBeGreaterThan(0);
    expect(workload.result.state).toBe(ResultStates.ok);
    expect(workload.result.message).toBe("Deployment successful");
  });

  test("should correctly serialize and deserialize Workload", () => {
    const serialized = JSON.stringify(workload);
    const deserialized = plainToClass(Workload, JSON.parse(serialized));
    expect(deserialized).toBeInstanceOf(Workload);
    expect(deserialized).toEqual(workload);
  });

  test("should correctly compute the challenge string", () => {
    const expectedChallenge =
      workload.version.toString() +
      workload.name +
      workload.type.toString() +
      workload.metadata +
      workload.description +
      workload.data.challenge();

    expect(workload.challenge()).toBe(expectedChallenge);
  });

  test("should handle invalid DeploymentResult", () => {
    const invalidResult = new DeploymentResult();
    invalidResult.created = Date.now();
    invalidResult.state = "invalid-state" as any;
    invalidResult.message = "Deployment successful";
    invalidResult.data = workload.data;

    workload.result = invalidResult;

    expect(() => workload.challenge()).not.toThrow();
  });
});
