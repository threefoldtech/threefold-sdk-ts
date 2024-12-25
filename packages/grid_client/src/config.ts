import { Client as RMBClient } from "@threefold/rmb_direct_client";

import { TFClient } from "./clients/tf-grid/client";
import { BackendStorageType } from "./storage/backend";
import BackendStorageInterface from "./storage/BackendStorageInterface";
import { KeypairType } from "./zos/deployment";

enum NetworkEnv {
  dev = "dev",
  test = "test",
  main = "main",
  qa = "qa",
}

class GridClientConfig {
  network: NetworkEnv;
  mnemonic: string;
  storeSecret: string | Uint8Array;
  rmbClient: RMBClient;
  tfclient: TFClient;
  projectName: string;
  backendStorageType: BackendStorageType;
  backendStorage?: BackendStorageInterface;
  keypairType: KeypairType;
  storePath: string;
  graphqlURL: string;
  relayURL: string;
  proxyURL: string;
  substrateURL: string;
  activationURL: string;
  twinId: number;
  seed?: string;
  deploymentTimeoutMinutes: number;
  kycURL: string;
}
class ClientOptions {
  constructor(
    public mnemonic: string,
    public network: NetworkEnv,
    public storeSecret?: string,
    public projectName?: string,
    public backendStorageType?: BackendStorageType,
    public keypairType?: KeypairType,
    public backendStorage?: BackendStorageInterface,
    public seed?: string,
    public proxyURL?: string,
    public graphqlURL?: string,
    public substrateURL?: string,
    public relayURL?: string,
    public activationURL?: string,
    public deploymentTimeoutMinutes?: number,
    public keepReconnectingToChain?: boolean,
    public KycURL?: string,
  ) {}
}

export { GridClientConfig, NetworkEnv, ClientOptions };
