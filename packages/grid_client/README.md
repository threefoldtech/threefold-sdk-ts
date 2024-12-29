# grid_client

[![Version](https://img.shields.io/npm/v/@threefold/grid_client?color=blue)](https://www.npmjs.com/package/@threefold/grid_client)
[![Lint](https://github.com/threefoldtech/tfgrid-sdk-ts/actions/workflows/lint.yml/badge.svg)](https://github.com/threefoldtech/tfgrid-sdk-ts/actions/workflows/lint.yml)
[![Build](https://github.com/threefoldtech/tfgrid-sdk-ts/actions/workflows/build.yml/badge.svg)](https://github.com/threefoldtech/tfgrid-sdk-ts/actions/workflows/build.yml)
[![Tests](https://github.com/threefoldtech/tfgrid-sdk-ts/actions/workflows/grid_client_tests.yml/badge.svg)](https://github.com/threefoldtech/tfgrid-sdk-ts/actions/workflows/grid_client_tests.yml)
[![Nightly](https://github.com/threefoldtech/tfgrid-sdk-ts/actions/workflows/grid_client_nightly.yml/badge.svg)](https://github.com/threefoldtech/tfgrid-sdk-ts/actions/workflows/grid_client_nightly.yml)
[![Code Coverage](https://codecov.io/gh/threefoldtech/tfgrid-sdk-ts/branch/development/graph/badge.svg?flag=GridClient)](https://app.codecov.io/gh/threefoldtech/tfgrid-sdk-ts/flags?flags=GridClient)

Github repo: [grid_client](https://github.com/threefoldtech/tfgrid-sdk-ts.git)

grid_client is a client used for deploying workloads (VMs, ZDBs, k8s, etc.) on grid3.

## Prerequisites

- node 16.13.1 or higher
- npm 8.2.0 or higher
- may need to install libtool `apt-get install libtool`

## Installation

> **Warning**: For **Qanet**, Please use @2.6.3 version

> **Warning**: For **Testnet**, Please use @2.6.3 version

> **Warning**: For **Mainnet**, Please use @2.6.3 version

### External package

```bash
yarn add @threefold/grid_client
```

### Local usage

- Clone the repository

```bash
git clone https://github.com/threefoldtech/tfgrid-sdk-ts.git
```

- Install it

```bash
yarn install
```

> **Note:** If the used Python version is 3.12 or later, you need to install setuptools.

```bash
python3 -m pip install setuptools
```

## Getting started

### Client configuration

- Network environment: should select dev environment, qa, test or main.

- Wallet connector: mnemonics (12 random words in a unique order) for your account to interact with the chain. [Create one](https://www.manual.grid.tf/documentation/dashboard/wallet_connector.html)

- Store secret: it's any word that will be used for encrypting/decrypting the keys on threefold key-value store.

- Project name: it's a name to isolate the deployments into a namespace.

  **Note:** only network can't be isolated, all project can see the same network.

### Create client instance

- Here's a simple example of creating a client instance with the default configurations.

- or you can check more advanced configuration [here](./docs/client_configuration.md).

  ```ts
  async function getClient(): Promise<GridClient> {
    const gridClient = new GridClient({
      network: config.network,
      mnemonic: config.mnemonic,
    });
    await gridClient.connect();

    return gridClient;
  }
  ```

- You can set your configurations through environment variables or [JSON config file](./scripts/config.json) as seen [here](./scripts/client_loader.ts).

- With clientOptions being added, all urls are now configured. So, you can easily get the proxy URL for the used network simply by:

  ```ts
  const proxyURL = gridClient.clientOptions.proxyURL;
  ```

for more details, check [client options](./src/client.ts)

**Important Note**: grid client should be disconnected after finishing its usage.

```ts
gridClient.disconnect();
```

### Using the client

> This section assumes that you are using the client configuration from [client_loader.ts](./scripts/client_loader.ts)

- After creating a client instance you can call it in any of your scripts using `getClient()`.

  ```ts
  const grid3 = getClient();
  ```

- And then you can use this client instance with any of the client [modules](./docs/module.md).

- For example to deploy a VM you will need to use the machines module with the client and it can be used as follows. you can find the full example script [here](./scripts/single_vm.ts).

  - To deploy a VM

    ```ts
    await grid3.machines.deploy(vms);
    ```

  - To delete a VM

    ```ts
    await grid3.machines.delete({ name: vms.name });
    ```

- More example scripts can be found [here](./scripts)

### Running the scripts

- Before Running the scripts make sure you have a `tsconfig.json` file. here is an example file.

  ```json
  {
    "compilerOptions": {
      "noImplicitAny": false,
      "module": "commonjs",
      "target": "esnext",
      "lib": ["ESNext", "DOM"],
      "types": ["node", "jest"],
      "declaration": true,
      "declarationMap": true,
      "outDir": "./dist/node",
      "esModuleInterop": true,
      "emitDecoratorMetadata": true,
      "experimentalDecorators": true,
      "allowJs": true,
      "baseUrl": "."
    },
    "include": ["src/**/*"]
  }
  ```

- After following the previous examples to create a client instance and using it in a script, you can then execute this script using [ts-node](https://www.npmjs.com/ts-node).

  ```bash
  yarn run ts-node --project tsconfig-node.json filename.ts
  ```

## Usage examples

- [Scripts](./scripts/README.md)

## API Docs

<https://threefoldtech.github.io/tfgrid-sdk-ts/packages/grid_client/docs/api/index.html>

## Testing

- [How to run tests](./docs/tests.md)

## Related Documentations

- [Contribution Guide](./docs/contribution.md)
- [Grid Client documentation](https://manual.grid.tf/documentation/developers/javascript/grid3_javascript_readme.html)
