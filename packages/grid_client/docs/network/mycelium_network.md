# Mycelium Network

## Overview

Mycelium is a fresh approach to networking that aims to transform how we connect devices online. It's an IPv6 overlay network, designed to create a more efficient and secure internet experience.

The primary goal is to revolutionize the way data travels between devices by prioritizing speed, security, and reliability. It's built to handle communication more effectively, like upgrading from a regular road system to a superhighway with advanced traffic management.

By being really smart about how it sends data, Mycelium promises faster and smoother connections. It figures out the quickest paths for data to travel, ensuring minimal delays and optimal performance. Plus, everything sent between devices is encrypted, making it super secure.

Ultimately, Mycelium's goal is to offer a more scalable, reliable, and adaptable networking solution above IPv6. Its innovative features and focus on user experience make it a promising contender in the future of internet connectivity.

## Configuration

This configuration is set on [workload data](../../src/zos/zmachine.ts) and [network workload](../../src/zos/znet.ts)

In case user needs to support mycelium:

- flag `mycelium` field in workload with true.
- User can support hex seed which ip will be generated from or they'll be generated automatically.
- providing seeds, that's what makes ip fixed from anywhere.
  > Note user can't use same network seed in multiple nodes.

```ts
const vms: MachinesModel = {
  name: "newMY",
  network: {
    name: "hellotest",
    ip_range: "10.249.0.0/16",
    myceliumSeeds: [
      {
        nodeId: 168,
        seed: "050d109829d8492d48bfb33b711056080571c69e46bfde6b4294c4c5bf468a76", //(HexSeed of length 32)
      },
    ],
  },
  machines: [
    {
      name: "testvmMY",
      node_id: 168,
      disks: [
        {
          name: "wedDisk",
          size: 8,
          mountpoint: "/testdisk",
        },
      ],
      public_ip: false,
      public_ip6: false,
      planetary: true,
      mycelium: true,
      myceliumSeed: "1e1404279b3d", //(HexSeed of length 6)
      cpu: 1,
      memory: 1024 * 2,
      rootfs_size: 0,
      flist: "https://hub.grid.tf/tf-official-apps/base:latest.flist",
      entrypoint: "/sbin/zinit init",
      env: {
        SSH_KEY: config.ssh_key,
      },
    },
  ],
  metadata: "",
  description: "test deploying single VM with mycelium via ts grid3 client",
};
```

- User can deploy vm without mycelium, then add machine on the same network requesting mycelium.

```ts
const vms: MachinesModel = {
  name: "newVMS",
  network: {
    name: "wedtest",
    ip_range: "10.249.0.0/16",
  },
  machines: [
    {
      name: "testvm1",
      node_id: 11,
      disks: [
        {
          name: "wedDisk",
          size: 8,
          mountpoint: "/testdisk",
        },
      ],
      public_ip: false,
      public_ip6: false,
      planetary: true,
      mycelium: false,
      cpu: 1,
      memory: 1024 * 2,
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
```

then add `testvm2` requesting `mycelium`:

```ts
const vms: MachinesModel = {
  name: "newVMS2",
  network: {
    name: "wedtest",
    ip_range: "10.249.0.0/16",
  },
  machines: [
    {
      name: "testvm2",
      node_id: 11,
      disks: [
        {
          name: "wedDisk",
          size: 8,
          mountpoint: "/testdisk",
        },
      ],
      public_ip: false,
      public_ip6: false,
      planetary: true,
      mycelium: true,
      cpu: 1,
      memory: 1024 * 2,
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
```
