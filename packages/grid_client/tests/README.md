# Tests

> Please be aware that before you can run the tests, you must have built the project and installed the prerequisites (some tests require the installation of Mycelium and Yggdrasil).

## Configure

- Set your grid3 client configuration in `config.json`

```json
{
  "network": "dev", // dev, qa, test, or main
  "mnemonic": "",
  "storeSecret": "secret",
  "ssh_key": "" // ed25519 SSH Key
}
```

> Please take note that you must either complete all of the configuration listed above OR leave it empty and export all of the data as environment variables, as shown below.

```bash
export NETWORK="dev"
export MNEMONIC=""
export STORE_SECRET="secret"
export SSH_KEY=""
```

## Run

```bash
npm run test --runInBand
```

or

```bash
yarn test --runInBand
```

> **Note:** `--coverage`: can be added to the running command to generate test coverage.
> `--runInBand`: Run tests serially.
> `--ci`: Indicate CI environment.
> `--coverage`: Collect and report coverage.
> `--colors`: Force colorful output.
> `--forceExit`: Force the process to exit after tests complete.
>
> **Note:** Some tests are using Mycelium for the SSH connection, which is why it is important for Mycelium to be running.
