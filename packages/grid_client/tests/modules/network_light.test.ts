import { plainToClass } from "class-transformer";

import { NetworkLight } from "../../src";
let networkLight: NetworkLight;

beforeEach(() => {
  networkLight = new NetworkLight();
  networkLight.subnet = "192.168.0.0/16";
  networkLight.mycelium = {
    hex_key: "abc123",
    peers: ["peer1", "peer2"],
  };
});

describe("NetworkLight Class Tests", () => {
  it("should create a valid NetworkLight instance", () => {
    expect(networkLight).toBeInstanceOf(NetworkLight);
  });

  it("should correctly serialize and deserialize a NetworkLight instance", () => {
    const serialized = JSON.stringify(networkLight);
    const deserialized = plainToClass(NetworkLight, JSON.parse(serialized));

    expect(deserialized).toBeInstanceOf(NetworkLight);
    expect(deserialized.challenge()).toBe(networkLight.challenge());
  });

  it("should correctly compute the challenge string", () => {
    const expectedChallenge =
      networkLight.subnet + networkLight.mycelium.hex_key + networkLight.mycelium.peers?.join("");

    expect(networkLight.challenge()).toBe(expectedChallenge);
  });

  it("should correctly handle missing peers", () => {
    networkLight.mycelium.peers = undefined;

    const expectedChallenge = networkLight.subnet + networkLight.mycelium.hex_key;
    expect(networkLight.challenge()).toBe(expectedChallenge);
  });

  it("should throw an error if subnet is empty", () => {
    const setEmptySubnet = () => (networkLight.subnet = "");

    expect(setEmptySubnet).toThrow();
  });

  it("should handle an empty mycelium object correctly", () => {
    networkLight.mycelium = undefined as any;

    const expectedChallenge = networkLight.subnet;
    expect(networkLight.challenge()).toBe(expectedChallenge);
  });

  it("should correctly handle peers being empty", () => {
    networkLight.mycelium.peers = [];

    const expectedChallenge = networkLight.subnet + networkLight.mycelium.hex_key;
    expect(networkLight.challenge()).toBe(expectedChallenge);
  });
});
