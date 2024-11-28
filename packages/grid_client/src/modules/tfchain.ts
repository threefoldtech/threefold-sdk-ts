import { Keyring } from "@polkadot/keyring";
import { waitReady } from "@polkadot/wasm-crypto";
import { TFChainError } from "@threefold/tfchain_client";
import { Balance, ExtrinsicResult } from "@threefold/tfchain_client";
import { BaseError, ValidationError } from "@threefold/types";
import axios from "axios";
import { generateMnemonic } from "bip39";
import { Buffer } from "buffer";
import MD5 from "crypto-js/md5";
import * as PATH from "path";

import { TFClient } from "../clients/tf-grid/client";
import { GridClientConfig } from "../config";
import { formatErrorMessage } from "../helpers";
import { expose } from "../helpers/expose";
import { validateInput } from "../helpers/validator";
import { appPath, BackendStorage, BackendStorageType, StorageUpdateAction } from "../storage/backend";
import { KeypairType } from "../zos";
import blockchainInterface, { blockchainType } from "./blockchainInterface";
import {
  BlockchainAssetsModel,
  BlockchainCreateResultModel,
  BlockchainDeleteModel,
  BlockchainGetModel,
  BlockchainGetResultModel,
  BlockchainListResultModel,
  BlockchainSignModel,
  TfchainCreateModel,
  TfchainDaoVoteModel,
  TfchainWalletBalanceByAddressModel,
  TfchainWalletInitModel,
  TfchainWalletTransferModel,
} from "./models";

class TFChain implements blockchainInterface {
  fileName = "tfchain.json";
  backendStorage: BackendStorage;
  substrateURL: string;
  activationURL: string;
  mnemonic: string;
  storeSecret: string;
  keypairType: KeypairType;
  network: string;
  tfClient: TFClient;

  /**
   * TFChain class that implements the blockchainInterface.
   * Manages accounts and transactions on the TFChain blockchain.
   *
   * @param {GridClientConfig} config - The configuration object for the GridClient.
   */
  constructor(public config: GridClientConfig) {
    this.backendStorage = new BackendStorage(
      config.backendStorageType,
      config.substrateURL,
      config.mnemonic,
      config.storeSecret,
      config.keypairType,
      config.backendStorage,
      config.seed,
    );
    this.substrateURL = config.substrateURL;
    this.activationURL = config.activationURL;
    this.mnemonic = config.mnemonic;
    this.storeSecret = config.storeSecret as string;
    this.keypairType = config.keypairType;
    this.network = config.network;
    this.tfClient = config.tfclient;
  }

  /**
   * Returns the path by joining the application path and the file name.
   *
   * @returns {string} The full path of the file.
   */
  getPath(): string {
    return PATH.join(appPath, this.fileName);
  }

  /**
   * Loads data from the backend storage using the path obtained from the `getPath` method.
   * If no data is found, an empty object is returned.
   *
   * @returns {Promise<[string, any]>} A promise that resolves to an array containing the path and the loaded data.
   */
  async _load(): Promise<[string, any]> {
    const path = this.getPath();
    let data = await this.backendStorage.load(path);
    if (!data) {
      data = {};
    }
    return [path, data];
  }

  private async saveIfKVStoreBackend(extrinsics: ExtrinsicResult<any>[]) {
    if (this.config.backendStorageType === BackendStorageType.tfkvstore && extrinsics && extrinsics.length > 0) {
      extrinsics = extrinsics.filter(e => e !== undefined);
      if (extrinsics.length > 0) {
        await this.tfClient.connect();
        await this.tfClient.applyAllExtrinsics(extrinsics);
      }
    }
  }

  /**
   * Saves the provided mnemonic under the given name in the backend storage.
   * If an account with the same name already exists, a ValidationError is thrown.
   *
   * @param {string} name - The name of the account to save.
   * @param {string} mnemonic - The mnemonic to save for the account.
   * @returns {Promise<void>} A promise that resolves once the mnemonic is saved.
   */
  async save(name: string, mnemonic: string): Promise<void> {
    const [path, data] = await this._load();
    if (data[name]) {
      throw new ValidationError(`An account with the same name ${name} already exists.`);
    }
    const updateOperations = await this.backendStorage.update(path as string, name, mnemonic);
    await this.saveIfKVStoreBackend(updateOperations);
  }

  /**
   * Loads the TFChain wallet with the provided options.
   *
   * @param {TfchainWalletInitModel} options - The options for loading the wallet, including name and secret.
   * @returns {Promise<string>} A promise that resolves to the address of the initialized wallet.
   * @decorators
   * - `@expose`: Exposes the method for external use.
   * - `@validateInput`: Validates the input options.
   */
  @expose
  @validateInput
  async init(options: TfchainWalletInitModel): Promise<string> {
    const client = new TFClient(this.substrateURL, options.secret, this.storeSecret, this.keypairType);
    await client.connect();
    await this.save(options.name, client.mnemonic);
    return client.address;
  }

  /**
   * Retrieves the mnemonic associated with the specified account name.
   *
   * @param {string} name - The name of the account to retrieve the mnemonic for.
   * @returns {Promise<string>} A promise that resolves to the mnemonic of the specified account.
   * @throws {ValidationError} If an account with the provided name does not exist.
   */
  async getMnemonics(name: string): Promise<string> {
    const [, data] = await this._load();
    if (!data[name]) {
      throw new ValidationError(`An account with the name ${name} does not exist.`);
    }
    return data[name];
  }

  /**
   * Retrieves the account information for the specified account name.
   *
   * @param {BlockchainGetModel} options - The options containing the name of the account to retrieve.
   * @returns {Promise<BlockchainGetResultModel>} A promise that resolves to the account information including name, public key, mnemonic, and blockchain type.
   * @throws {`ValidationError`} If an account with the provided name does not exist.
   * @decorators
   * - `@expose`: Exposes the method for external use.
   * - `@validateInput`: Validates the input options.
   */
  @expose
  @validateInput
  async get(options: BlockchainGetModel): Promise<BlockchainGetResultModel> {
    const mnemonics = await this.getMnemonics(options.name);
    const client = new TFClient(this.substrateURL, mnemonics, this.storeSecret, this.keypairType);
    await client.connect();
    const account = {
      name: options.name,
      public_key: client.address,
      mnemonic: mnemonics,
      blockchain_type: blockchainType.tfchain,
    };
    return account;
  }

  /**
   * Updates the mnemonic for the specified account with the provided options.
   * If the account does not exist, a ValidationError is thrown.
   *
   * @param {TfchainWalletInitModel} options - The options for updating the mnemonic, including name and secret.
   * @returns {Promise<string>} A promise that resolves to the address of the updated account.
   * @throws {`ValidationError`} If the account with the provided name does not exist.
   * @decorators
   * - `@expose`: Exposes the method for external use.
   * - `@validateInput`: Validates the input options.
   */
  @expose
  @validateInput
  async update(options: TfchainWalletInitModel): Promise<string> {
    if (!(await this.exist(options))) {
      throw new ValidationError(`Couldn't find an account with name ${options.name}.`);
    }
    const client = new TFClient(this.substrateURL, options.secret, this.storeSecret, this.keypairType);
    await client.connect();

    try {
      const path = this.getPath();
      const updateOperations = await this.backendStorage.update(
        path,
        options.name,
        options.secret,
        StorageUpdateAction.add,
      );
      await this.saveIfKVStoreBackend(updateOperations);
    } catch (e) {
      if (e instanceof BaseError) {
        e.message = formatErrorMessage(`Could not update account mnemonics`, e);
        throw e;
      }
      throw new TFChainError({
        message: `Could not update account mnemonics: ${e}`,
      });
    }
    return client.address;
  }

  /**
   * Checks if an account with the provided name exists.
   *
   * @param {BlockchainGetModel} options - The options containing the name of the account to check.
   * @returns {Promise<boolean>} A promise that resolves to true if an account with the provided name exists, false otherwise.
   * @throws {`ValidationError`} If an error occurs during the existence check.
   * @decorators
   * - `@expose`: Exposes the method for external use.
   * - `@validateInput`: Validates the input options.
   */
  @expose
  @validateInput
  async exist(options: BlockchainGetModel): Promise<boolean> {
    return (await this.list()).map(account => account.name == options.name).includes(true);
  }

  /**
   * Retrieves a list of accounts from the backend storage.
   *
   * @returns {Promise<BlockchainListResultModel[]>} A promise that resolves to an array of account information, including name, public key, and blockchain type.
   * @throws {ValidationError} If an error occurs during the retrieval process.
   * @decorators
   * - `@expose`: Exposes the method for external use.
   * - `@validateInput`: Validates the input options.
   */
  @expose
  @validateInput
  async list(): Promise<BlockchainListResultModel[]> {
    const [, data] = await this._load();
    const accounts: BlockchainListResultModel[] = [];

    for (const name of Object.keys(data)) {
      const mnemonics = await this.getMnemonics(name);
      const client = new TFClient(this.substrateURL, mnemonics, this.storeSecret, this.keypairType);
      await client.connect();
      accounts.push({
        name: name,
        public_key: client.address,
        blockchain_type: blockchainType.tfchain,
      });
    }
    return accounts;
  }

  /**
   * Retrieves the assets associated with the specified account name.
   *
   * @param {BlockchainGetModel} options - The options containing the name of the account to retrieve assets for.
   * @returns {Promise<BlockchainAssetsModel>} A promise that resolves to the assets of the specified account, including name, public key, blockchain type, and asset details.
   * @throws {`ValidationError`} If an account with the provided name does not exist.
   * @decorators
   * - `@expose`: Exposes the method for external use.
   * - `@validateInput`: Validates the input options.
   */
  @expose
  @validateInput
  async assets(options: BlockchainGetModel): Promise<BlockchainAssetsModel> {
    if (!(await this.exist(options))) {
      throw new ValidationError(`Couldn't find an account with name ${options.name}.`);
    }
    const mnemonics = await this.getMnemonics(options.name);
    const client = new TFClient(this.substrateURL, mnemonics, this.storeSecret, this.keypairType);
    await client.connect();
    const balance = await client.balances.get({ address: client.address });
    const assets = {
      name: options.name,
      public_key: client.address,
      blockchain_type: blockchainType.tfchain,
      assets: [
        {
          amount: balance.free,
          asset: "TFT",
        },
      ],
    };
    return assets;
  }

  /**
   * Retrieves the balance for a specific address.
   *
   * @param {TfchainWalletBalanceByAddressModel} options - The options containing the address for which to retrieve the balance.
   * @returns {Promise<Balance>} A promise that resolves to the balance information for the specified address.
   * @decorators
   * - `@expose`: Exposes the method for external use.
   * - `@validateInput`: Validates the input options.
   */
  @expose
  @validateInput
  async balanceByAddress(options: TfchainWalletBalanceByAddressModel): Promise<Balance> {
    const client = new TFClient(this.substrateURL, this.mnemonic, this.storeSecret, this.keypairType);
    await client.connect();
    const balance = await client.balances.get(options);
    return balance;
  }

  /**
   * Initiates a transfer of a specified amount to the provided destination address.
   * Retrieves the mnemonic associated with the specified account name to authorize the transfer.
   *
   * @param {TfchainWalletTransferModel} options - The options for the transfer, including the account name, destination address, and amount.
   * @returns {Promise<void>} A promise that resolves once the transfer is completed.
   * @throws {`ValidationError`} If the account with the provided name does not exist or if the transfer fails.
   * @decorators
   * - `@expose`: Exposes the method for external use.
   * - `@validateInput`: Validates the input options.
   */
  @expose
  @validateInput
  async pay(options: TfchainWalletTransferModel): Promise<void> {
    const mnemonics = await this.getMnemonics(options.name);
    const sourceClient = new TFClient(this.substrateURL, mnemonics, this.storeSecret, this.keypairType);
    await sourceClient.connect();
    try {
      await (await sourceClient.balances.transfer({ address: options.address_dest, amount: options.amount })).apply();
    } catch (e) {
      //TODO error should be handled in tfchain?
      if (e instanceof BaseError) {
        e.message = formatErrorMessage(`Could not complete transfer transaction`, e);
        throw e;
      }
      throw new TFChainError({
        message: `Could not complete transfer transaction: ${e}`,
      });
    }
  }

  /**
   * Initiates a vote on the TFChain DAO using the provided options.
   *
   * @param {TfchainDaoVoteModel} options - The options for the vote, including the voter's name, address, farm ID, hash, and approval status.
   * @returns {Promise<void>} A promise that resolves once the vote is completed.
   * @throws {`ValidationError`} If the voter's account does not exist or if the vote fails.
   * @decorators
   * - `@expose`: Exposes the method for external use.
   * - `@validateInput`: Validates the input options.
   */
  @expose
  @validateInput
  async vote(options: TfchainDaoVoteModel): Promise<void> {
    const mnemonics = await this.getMnemonics(options.name);
    const sourceClient = new TFClient(this.substrateURL, mnemonics, this.storeSecret, this.keypairType);
    await sourceClient.connect();
    try {
      await (
        await sourceClient.dao.vote({
          farmId: options.farmId,
          hash: options.hash,
          approve: options.approve,
        })
      ).apply();
    } catch (e) {
      if (e instanceof BaseError) {
        e.message = formatErrorMessage(`Could not complete transfer transaction`, e);
        throw e;
      }
      throw new TFChainError({
        message: `Could not complete transfer transaction: ${e}`,
      });
    }
  }

  /**
   * Deletes an account with the specified name.
   * If the account does not exist, a `ValidationError` is thrown.
   *
   * @param {BlockchainDeleteModel} options - The options containing the name of the account to delete.
   * @returns {Promise<string>} A promise that resolves to a message indicating the deletion was successful.
   * @throws {`ValidationError`} If the account with the provided name does not exist.
   * @decorators
   * - `@expose`: Exposes the method for external use.
   * - `@validateInput`: Validates the input options.
   */
  @expose
  @validateInput
  async delete(options: BlockchainDeleteModel): Promise<string> {
    if (!(await this.exist(options))) {
      throw new ValidationError(`Couldn't find an account with name ${options.name}.`);
    }
    const path = this.getPath();
    const updateOperations = await this.backendStorage.update(path, options.name, "", StorageUpdateAction.delete);
    await this.saveIfKVStoreBackend(updateOperations);
    return "Deleted";
  }

  /**
   * Creates a new account on the TFChain blockchain with the provided options.
   * If an account with the same name already exists, a `ValidationError` is thrown.
   *
   * @param {TfchainCreateModel} options - The options for creating the account, including the name and relay.
   * @returns {Promise<BlockchainCreateResultModel>} A promise that resolves to the created account information, including name, public key, mnemonic, twin ID, and blockchain type.
   * @throws {`ValidationError`} If an account with the same name already exists.
   * @decorators
   * - `@expose`: Exposes the method for external use.
   * - `@validateInput`: Validates the input options.
   */
  @expose
  @validateInput
  async create(options: TfchainCreateModel): Promise<BlockchainCreateResultModel> {
    if (await this.exist({ name: options.name })) {
      throw new ValidationError(`An account with the same name ${options.name} already exists.`);
    }
    const createdAccount = await this.createAccount(options.relay as string);
    await this.init({ name: options.name, secret: createdAccount.mnemonic });

    return {
      name: options.name,
      public_key: createdAccount.public_key,
      mnemonic: createdAccount.mnemonic,
      twinId: createdAccount.twinId,
      blockchain_type: blockchainType.tfchain,
    };
  }

  /**
   * Generates a new mnemonic and activates an account with the provided relay.
   *
   * @param {string} relay - The relay to use for account activation.
   * @param {boolean} disconnect - Flag indicating whether to disconnect after account creation. Default is false.
   * @returns {Promise<{ public_key: string, mnemonic: string, twinId: string }>} A promise that resolves to an object containing the public key, mnemonic, and twin ID of the created account.
   */
  async createAccount(
    relay: string,
    disconnect = false,
  ): Promise<{
    public_key: string;
    mnemonic: string;
    twinId: number;
  }> {
    const mnemonic = generateMnemonic();
    return this.activateAccountAndCreateTwin(mnemonic, relay, disconnect);
  }

  /**
   * Activates an account for the given mnemonic and creates a twin.
   *
   * @param relay The relay to use for the twin creation.
   * @param disconnect Flag indicating whether to disconnect after activating the account.
   * @returns A promise that resolves to an object containing the public key, mnemonic, and twin ID of the created account.
   */
  async activateAccountAndCreateTwin(mnemonic: string, relay: string, disconnect = false) {
    const client = new TFClient(this.substrateURL, mnemonic, this.storeSecret, this.keypairType);
    await client.connect();
    await axios.post(this.activationURL, {
      substrateAccountID: client.address,
    });
    const start = new Date().getTime();
    let balance = await client.balances.getMyBalance();
    while (new Date().getTime() < start + 10 * 1000) {
      balance = await client.balances.getMyBalance();
      if (balance.free > 0) break;
      await new Promise(f => setTimeout(f, 1000));
    }
    if (balance.free <= 0) {
      throw new TFChainError({
        message: `Couldn't activate the newly created account.`,
      });
    }
    await (
      await client.termsAndConditions.accept({ documentLink: "https://manual.grid.tf/knowledge_base/legal/terms_conditions_all3.html" })
    ).apply();
    const ret = await (await client.twins.create({ relay })).apply();
    if (disconnect) await client.disconnect();
    return {
      public_key: client.address,
      mnemonic,
      twinId: ret.id,
    };
  }

  /**
   * Signs a message using the mnemonic associated with the specified account name.
   *
   * @param {BlockchainSignModel} options - The options containing the name of the account and the content to sign.
   * @returns {Promise<string>} A promise that resolves to the signed message in hexadecimal format.
   * @throws {ValidationError} If an account with the provided name does not exist.
   * @decorators
   * - `@expose`: Exposes the method for external use.
   * - `@validateInput`: Validates the input options.
   */
  @expose
  @validateInput
  async sign(options: BlockchainSignModel): Promise<string> {
    const mnemonics = await this.getMnemonics(options.name);
    const hash = MD5(options.content);
    const message_bytes = Uint8Array.from(Buffer.from(hash.toString(), "hex"));
    const keyr = new Keyring({ type: this.keypairType });
    const key = keyr.addFromUri(mnemonics);
    await waitReady();
    const signed = key.sign(message_bytes);
    return Buffer.from(signed).toString("hex");
  }
}

export { TFChain as tfchain };
