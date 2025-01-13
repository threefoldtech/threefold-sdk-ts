import { plainToClass } from "class-transformer";

import { ComputeCapacity, MachineInterface, Mount, ZmachineLight, ZmachineLightNetwork } from "../../src";

let zmachineLight = new ZmachineLight();
const computeCapacity = new ComputeCapacity();
const network = new ZmachineLightNetwork();
const disks = new Mount();

beforeEach(() => {
  computeCapacity.cpu = 1;
  computeCapacity.memory = 256 * 1024 ** 2;

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

  const rootfs_size = 2;

  disks.name = "zdisk";
  disks.mountpoint = "/mnt/data";

  zmachineLight.flist = "https://hub.grid.tf/tf-official-vms/ubuntu-22.04.flist";
  zmachineLight.network = network;
  zmachineLight.size = rootfs_size * 1024 ** 3;
  zmachineLight.mounts = [disks];
  zmachineLight.entrypoint = "/sbin/zinit init";
  zmachineLight.compute_capacity = computeCapacity;
  zmachineLight.env = { key: "value" };
  zmachineLight.corex = false;
  zmachineLight.gpu = ["AMD", "NVIDIA"];
});

describe("ZmachineLight Class Tests", () => {
  it("should create a valid ZmachineLight instance", () => {
    expect(zmachineLight).toBeInstanceOf(ZmachineLight);
  });

  it("should correctly serialize and deserialize a ZmachineLight instance", () => {
    const serialized = JSON.stringify(zmachineLight);
    const deserialized = plainToClass(ZmachineLight, JSON.parse(serialized));

    expect(deserialized).toBeInstanceOf(ZmachineLight);
    expect(deserialized.challenge()).toBe(zmachineLight.challenge());
  });

  it("should correctly handle env vars", () => {
    const challenge = zmachineLight.challenge();

    expect(challenge).toContain("key=value");
  });

  it("should correctly compute the challenge string", () => {
    const expectedChallenge =
      zmachineLight.flist +
      network.challenge() +
      zmachineLight.size +
      computeCapacity.challenge() +
      zmachineLight.mounts[0].challenge() +
      zmachineLight.entrypoint +
      JSON.stringify(zmachineLight.env)
        .replace(/[{"}"]/g, "")
        .replace(":", "=") +
      zmachineLight.gpu?.toString().replace(",", "");

    expect(zmachineLight.challenge()).toBe(expectedChallenge);
    expect(zmachineLight.challenge()).toContain("key=value");
  });

  it("should correctly handle the gpu array", () => {
    expect(zmachineLight.gpu).toContain("NVIDIA");

    zmachineLight.gpu = [];

    expect(zmachineLight.challenge()).not.toContain("NVIDIA");

    zmachineLight.gpu = ["NVIDIA", "AMD"];

    expect(zmachineLight.challenge()).toContain("NVIDIA");
    expect(zmachineLight.challenge()).toContain("AMD");
  });

  it("should fail validation for entering invalid flist", () => {
    const emptyFlist = () => (zmachineLight.flist = "");
    const invalidURL = () => (zmachineLight.flist = "www.invalid-url");

    expect(emptyFlist).toThrow();
    expect(invalidURL).toThrow();
  });

  it("should fail validation for entering invalid entrypoint", () => {
    const invalidEntrypoint = () => (zmachineLight.entrypoint = undefined as any);

    expect(invalidEntrypoint).toThrow();
  });

  it("should fail validation for entering invalid size", () => {
    const maxSize = () => (zmachineLight.size = 10 * 1024 ** 5);
    const decimalSize = () => (zmachineLight.size = 1.2);
    const negativeSize = () => (zmachineLight.size = -1);

    expect(maxSize).toThrow();
    expect(decimalSize).toThrow();
    expect(negativeSize).toThrow();
  });

  it("should throw error if network interfaces values are invalid", () => {
    const invalidNetwork = new ZmachineLightNetwork();
    invalidNetwork.interfaces = [new MachineInterface()];
    zmachineLight.network.interfaces[0].network = ""; // invalid network
    zmachineLight.network.interfaces[0].ip = ""; // invalid IP

    const result = () => {
      zmachineLight.network = invalidNetwork;
    };

    expect(result).toThrow();
  });

  it("should throw an error if mount name is empty", () => {
    const invalidMount = new Mount();
    invalidMount.name = "";
    invalidMount.mountpoint = "/mnt/data";

    const result = () => {
      zmachineLight.mounts = [invalidMount];
    };

    expect(result).toThrow();
  });

  it("should fail if zmachineLight is parsed to an invalid object", () => {
    const invalidZmachineLight = `{
      "flist": "",
      "network": "invalid_network_object",
      "size": "not_a_number",
      "compute_capacity": {},
      "mounts": "not_an_array",
      "entrypoint": 123,
      "env": "not_an_object",
      "corex": "not_a_boolean",
      "gpu": [123, "valid_string", false]
    }`;

    const result = () => {
      zmachineLight = plainToClass(ZmachineLight, JSON.parse(invalidZmachineLight));
    };

    expect(result).toThrow();
  });
});
