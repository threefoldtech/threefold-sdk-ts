# Deployment Flow

This document outlines the process for determining whether to deploy on a zos3 or a zos4 node.

## Machine Model Initialization

The deployment process begins with initializing the machine model as follows:

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

## Deployment Execution

- The next step is invoking the `deploy` function:
  - Takes the `MachinesModel` object as a parameter
  - Checks if a machine with the same name already exists and if so throws an error
  - If not, then it calls the `_createDeployment` function along some othe functions
  - Finally, the function returns the created contracts. If the deployment is on a zos3 node, then the wireguard configuration is returned as well.

```ts
await client.machines.deploy(vms);
```

- The `_createDeployment` function:
  - Takes the `MachinesModel` object as a parameter
  - Retrieves the features of the node using: `await this.rmb.request([nodeTwinId], "zos.system.node_features_get", "", 20, 3);`
  - Examines the retrieved features to determine the network's primitive type (`Network` or `ZNetworkLight`) and initializes it accordingly.
  - Sets the contractMetadata based on the network type.
  - Invokes the `create` function

```ts
await this._createDeployment(options);
```

- The `create` function
  - Validates or assigns IP addresses based on the network type.
  - Determines network type (`network` or `network-light`) based on node features.
  - Adds access points and updates network configurations as necessary.
  - Initialize the VM primitive (`VMPrimitive` or `VMLightPrimitive`) based on the network type
  - Configures the VM with networking, storage, and environment variables.
  - Generates a Mycelium seed if not provided.
  - Generate the deployments
  - Finally, the function returns the created contracts. If the deployment is on a zos3 node, then the wireguard configuration is returned as well.

```ts
await this.vm.create(
  machine.name,
  machine.node_id,
  machine.flist,
  machine.cpu,
  machine.memory,
  machine.rootfs_size,
  machine.disks!,
  machine.public_ip,
  machine.public_ip6!,
  machine.planetary,
  machine.mycelium,
  machine.myceliumSeed!,
  network,
  options.network.myceliumSeeds!,
  machine.entrypoint,
  machine.env,
  contractMetadata,
  options.metadata,
  options.description,
  machine.qsfs_disks,
  this.config.projectName,
  options.network.addAccess,
  options.network.accessNodeId,
  machine.ip,
  machine.corex,
  machine.solutionProviderId!,
  machine.zlogsOutput,
  machine.gpus,
);
```
