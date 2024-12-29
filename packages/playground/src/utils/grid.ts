import { BackendStorageType, GridClient, KeypairType, NetworkEnv } from "@threefold/grid_client";
import { InsufficientBalanceError } from "@threefold/types";
import { markRaw } from "vue";

import type { SSHKeyData } from "@/types";

import type { Profile } from "../stores/profile_manager";
const network = (process.env.NETWORK as NetworkEnv) || window.env.NETWORK;
export async function getGrid(
  profile: Pick<Profile, "mnemonic"> & Partial<Pick<Profile, "keypairType">>,
  projectName?: string,
) {
  if (!profile) return null;
  const grid = markRaw(
    new GridClient({
      mnemonic: profile.mnemonic,
      network,
      backendStorageType: BackendStorageType.tfkvstore,
      keypairType: profile.keypairType || KeypairType.sr25519,
      projectName,
      substrateURL: window.env.SUBSTRATE_URL,
      proxyURL: window.env.GRIDPROXY_URL,
      graphqlURL: window.env.GRAPHQL_URL,
      activationURL: window.env.ACTIVATION_SERVICE_URL,
      relayURL: window.env.RELAY_DOMAIN,
      KycURL: window.env.KYC_URL,
    }),
  );
  try {
    await grid.connect();
  } catch (e) {
    if (!(e instanceof InsufficientBalanceError)) throw e;
  }
  return grid;
}

interface UpdateGridOptions {
  projectName?: string;
}
export function updateGrid(grid: GridClient, options: UpdateGridOptions) {
  grid.clientOptions!.projectName = options.projectName;
  grid._connect();
  return grid;
}

export function createAccount() {
  const grid = new GridClient({
    network,
    mnemonic: "",
    storeSecret: "test",
    substrateURL: window.env.SUBSTRATE_URL,
    proxyURL: window.env.GRIDPROXY_URL,
    graphqlURL: window.env.GRAPHQL_URL,
    activationURL: window.env.ACTIVATION_SERVICE_URL,
    relayURL: window.env.RELAY_DOMAIN,
  });
  grid._connect();
  const relay = grid.getDefaultUrls(network).relay.slice(6);
  return grid.tfchain.createAccount(relay);
}

export function activateAccountAndCreateTwin(mnemonic: string) {
  const grid = new GridClient({
    network,
    mnemonic,
    storeSecret: mnemonic,
    substrateURL: window.env.SUBSTRATE_URL,
    proxyURL: window.env.GRIDPROXY_URL,
    graphqlURL: window.env.GRAPHQL_URL,
    activationURL: window.env.ACTIVATION_SERVICE_URL,
    relayURL: window.env.RELAY_DOMAIN,
  });
  grid._connect();
  const relay = grid.getDefaultUrls(network).relay.slice(6);
  return grid.tfchain.activateAccountAndCreateTwin(mnemonic, relay, true);
}

export interface Balance {
  free: number;
  reserved: number;
}
export async function loadBalance(grid: GridClient): Promise<Balance> {
  const balance = await grid.balance.getMyBalance();
  return {
    free: +balance.free,
    reserved: +balance.reserved,
  };
}

export async function loadProfile(grid: GridClient): Promise<Profile> {
  return {
    mnemonic: grid.clientOptions!.mnemonic,
    ssh: await readSSH(grid),
    twinId: grid!.twinId,
    address: grid.tfclient.address,
    relay: grid.getDefaultUrls(network).relay.slice(6),
    pk: (await grid.twins.get({ id: grid!.twinId })).pk,
    keypairType: grid.clientOptions!.keypairType,
    email: await readEmail(grid),
  };
}

export async function getMetadata(grid: GridClient): Promise<{ [key: string]: any }> {
  try {
    const metadata = await grid.tfchain.backendStorage.load("metadata");
    return metadata;
  } catch (e) {
    console.log(`Error while trying to get metadata due: ${e}`);
    return {};
  }
}

export async function readSSH(grid: GridClient): Promise<SSHKeyData[]> {
  const metadata = await getMetadata(grid);
  return metadata.sshkey;
}

export async function storeSSH(grid: GridClient, newSSH: SSHKeyData[]): Promise<void> {
  const metadata = await getMetadata(grid);
  const ext = await grid.tfchain.backendStorage.dump("metadata", {
    ...metadata,
    sshkey: newSSH,
  });

  await grid.tfclient.applyAllExtrinsics(ext);
}

export async function readEmail(grid: GridClient): Promise<string> {
  const metadata = await getMetadata(grid);

  return metadata.email || "";
}

export async function storeEmail(grid: GridClient, newEmail: string): Promise<void> {
  const metadata = await getMetadata(grid);
  const email = metadata.email;
  if (email === newEmail) return;

  const ext = await grid.tfchain.backendStorage.dump("metadata", {
    ...metadata,
    email: newEmail,
  });

  await grid.tfclient.applyAllExtrinsics(ext);
}
