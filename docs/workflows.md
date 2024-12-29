# Workflows

There are some pipelines to make sure everything works fine, here is an idea about them:

## Grid Clients

### [Build](/.github/workflows/build.yml)

On **Pull Request**, and **Push** to development branch: It will do a clean install of node dependencies, cache/restore them to make the process faster, and build the source code using `lerna run build --no-private`.

### [Publish](/.github/workflows/publish.yml)

On **Release**: It will do a clean install of node dependencies, cache/restore them to make the process faster, and build the source code using `lerna run build --no-private` then publish the latest version to npm. Also it build a docker image for grid client from the released version.

### [Lint](/.github/workflows/lint.yml)

On **Pull Request**, and **Push** to development branch: It will check if the code formatted well using Eslint and Prettier.

### [Grid Client Tests](/.github/workflows/grid_client_tests.yml)

Runs daily for the last code and installs dependencies, runs tests and checks if tests passes or not.

### [Grid Client Nightly](/.github/workflows/grid_client_nightly.yml)

Runs daily on all networks for the relevant release and it will check if the latest version runs without errors.

## Playground

### [Build](/.github/workflows/playground_build.yml)

On **Pull Request**, and **Push** to development branch that has changes in the playground package: It will do a clean install of node dependencies, cache/restore them to make the process faster, and build the source code using `yarn build`.

### [Docker](/.github/workflows/playground_docker.yml)

On **Release** published: It will build and push a new docker image based on project release tag.

We are using _VERSION_, and _NETWORK_ arguments in this workflow that will be propagated into the builds [config](/packages/playground/scripts/build-env.sh), The values of those arguments could be as follows:

```js
NETWORK = "dev" | "qa" | "test" | "main" (default: dev)
VERSION = "release tag or the first 7 chars of commit hash"
```

### [CD](/.github/workflows/playground_cd.yml)

On **Push** to the development branch, this workflow will do the following:

- clean install of node dependencies
- cache/restore dependencies
- build source code
- copy artifacts to `staging.dashboard.dev.grid.tf` using SSH
- deploy to the staging server

> **NOTE**: If any changes are made to the dashboard's dependencies, this workflow must be manually triggered to apply the updates to the dashboard.

## Stats

### [Build](/.github/workflows/stats_build.yaml)

On **Pull Request**, and **Push** to development branch that has changes in the stats package: It will do a clean install of node dependencies, cache/restore them to make the process faster, and build the source code using `yarn workspace @threefold/stats build`.

### [Docker](/.github/workflows/stats_docker.yaml)

On **Release** published: It will build and push a new docker image based on project release tag.

## Threefold UI

### [Build](/.github/workflows/threefold_ui_build.yaml)

On **Pull Request**, and **Push** to development branch: It will do a clean install of node dependencies, cache/restore them to make the process faster, and build the source code using `lerna run build --no-private`.
