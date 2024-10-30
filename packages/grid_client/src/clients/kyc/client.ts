import { Keyring } from "@polkadot/keyring";
import { KeyringPair } from "@polkadot/keyring/types";
import { waitReady } from "@polkadot/wasm-crypto";
import { InsufficientBalanceError, KycBaseError, KycErrors, ValidationError } from "@threefold/types";
import axios, { AxiosError, HttpStatusCode } from "axios";
import { Buffer } from "buffer";
import urlJoin from "url-join";

import { bytesFromHex, formatErrorMessage, KeypairType, stringToHex } from "../..";
import { KycHeaders, KycStatus, VerificationDataResponse } from "./types";
const API_PREFIX = "/api/v1/";
/**
 * The KYC class provides methods to interact with a TFGid KYC (Know Your Customer) service.
 * It allows fetching verification data, status, and token by preparing necessary headers
 * and sending requests to the specified API domain.
 *
 * @class KYC
 * @example
 * ```typescript
 * const kyc = new KYC("https://api.example.com", KeypairType.sr25519, "mnemonic");
 * const data = await kyc.data();
 * const status = await kyc.status();
 * const token = await kyc.getToken();
 * ```
 * @param {string} apiDomain - The API domain for the KYC service.
 * @param {KeypairType} [keypairType=KeypairType.sr25519] - The type of keypair to use.
 * @param {string} mnemonic - The mnemonic for generating the keypair.
 * @method data - Fetches the verification data from the KYC service.
 * @method status - Fetches the verification status from the KYC service.
 * @method getToken - Fetches the token from the KYC service.
 */
export class KYC {
  private keypair: KeyringPair;
  public address: string;
  /**
   * Creates an instance of KYC.
   * @param apiDomain - The API domain for the TFGrid KYC service.
   * @param keypairType - The type of keypair to use (default is sr25519).
   * @param mnemonic - The mnemonic for generating the keypair.
   */
  constructor(
    public apiDomain: string,
    private mnemonic: string,
    public keypairType: KeypairType = KeypairType.sr25519,
  ) {
    if (mnemonic === "") {
      throw new ValidationError("mnemonic is required");
    }
    /** The api domain should not contains any prefix or postfix */
    this.apiDomain = this.apiDomain.replace(/https?:\/\//, "").replace(/\/$/, "");
  }

  /**
   * Setup the keypair and the address
   *
   * @returns {Promise<void>}
   * @private
   */
  private async setupKeyring() {
    const keyring = new Keyring({ type: this.keypairType });
    await waitReady();
    this.keypair = keyring.addFromUri(this.mnemonic);
    this.address = this.keypair.address;
  }

  /**
   * Prepares the headers required for TFGrid KYC requests.
   *
   * This method generates a set of headers that include a timestamp-based challenge,
   * a signed challenge using the user's key, and other necessary information.
   *
   * @returns {Promise<Record<string, string>>} A promise that resolves to an object containing the prepared headers.
   *
   */
  private async prepareHeaders(): Promise<Record<string, string>> {
    if (!this.keypair) await this.setupKeyring();
    const timestamp = Date.now();
    const challenge = stringToHex(`${this.apiDomain}:${timestamp}`);
    const signedChallenge = this.keypair.sign(bytesFromHex(challenge));
    const signedMsgHex = Buffer.from(signedChallenge).toString("hex");

    const headers: KycHeaders = {
      "content-type": "application/json",
      "X-Client-ID": this.address,
      "X-Challenge": challenge,
      "X-Signature": signedMsgHex,
    };
    return headers as unknown as Record<string, string>;
  }

  /**
   * Throws specific KYC-related errors based on the provided error .
   * @param {Error} error - The error to evaluate.
   * @param {string} errorMessage - The error message to evaluate.
   * @throws {KycErrors | KycBaseError} If the error message indicates a malformed address.
   */
  private throwKycError(error: Error, messagePrefix: string) {
    if (!(error instanceof AxiosError)) return new KycBaseError(error.message);
    const { response, status } = error as AxiosError;
    if (response?.data) error.message = (response?.data as { error: string })?.error || error.message;
    const errorMessage = formatErrorMessage(messagePrefix, error);
    switch (true) {
      case status === HttpStatusCode.BadRequest:
        return new KycErrors.BadRequest(`${errorMessage}. Please contact support.`);

      case status === HttpStatusCode.Unauthorized:
        return new KycErrors.Unauthorized(`${errorMessage}. Please contact support.`);

      case status === HttpStatusCode.NotFound:
        return new KycErrors.Unverified(errorMessage);

      case status === HttpStatusCode.TooManyRequests:
        return new KycErrors.RateLimit(errorMessage);

      case status === HttpStatusCode.Conflict:
        return new KycErrors.AlreadyVerified(errorMessage);

      case status === HttpStatusCode.PaymentRequired:
        return new InsufficientBalanceError(errorMessage);

      default:
        return new KycBaseError(errorMessage);
    }
  }

  /**
   * Fetches the verification data from the API.
   *
   * @returns {Promise<VerificationDataResponse>} A promise that resolves to the verification data response.
   * @throws {KycErrors.TFGridKycError | KycBaseError} If there is an issue with fetching the data.
   */
  async data(): Promise<VerificationDataResponse> {
    try {
      const headers = await this.prepareHeaders();
      return await axios.get(urlJoin("https://", this.apiDomain, API_PREFIX, "data"), { headers });
    } catch (error) {
      throw this.throwKycError(error, "Failed to get authentication data from KYC service.");
    }
  }

  /**
   * Retrieves the current verification status.
   *
   * @returns {Promise<KycStatus>} A promise that resolves to the verification status.
   * @throws {KycErrors | KycBaseError} If there is an issue with fetching the status data.
   */
  async status(): Promise<KycStatus> {
    try {
      if (!this.keypair) await this.setupKeyring();
      const res = (
        await axios.get(urlJoin("https://", this.apiDomain, API_PREFIX, "status"), {
          params: { client_id: this.address },
        })
      ).data;
      if (!res.result.status)
        throw new KycErrors.InvalidResponse("Failed to get status due to: Response does not contain status field");
      return res.result.status;
    } catch (error) {
      if (error instanceof AxiosError && error.status === HttpStatusCode.NotFound) return KycStatus.unverified;
      throw this.throwKycError(error, "Failed to get authentication status from KYC service.");
    }
  }
  /**
   * Retrieves a token data from the KYC service API.
   *
   * @returns {Promise<string>} A promise that resolves to a string representing the idenify auth token .
   * @throws {KycErrors.TFGridKycError | KycBaseError} If there is an issue with fetching the token data.
   */
  async getToken(): Promise<string> {
    try {
      const headers = await this.prepareHeaders();
      const res = (await axios.post(urlJoin("https://", this.apiDomain, API_PREFIX, "token"), "", { headers })).data;
      if (!res.result.authToken)
        throw new KycErrors.InvalidResponse("Failed to get token due to: Response does not contain authToken field");
      return res.result.authToken;
    } catch (error) {
      throw this.throwKycError(error, "Failed to get auth token from KYC service.");
    }
  }

  /**
   * Checks the health status of the KYC service.
   *
   * @returns {Promise<boolean>} A promise that resolves to `true` if the service is healthy, otherwise `false`.
   *
   * @throws Will return `false` if there is an error during the request.
   */
  async isHealthy(): Promise<boolean> {
    try {
      const res = await axios.get(urlJoin("https://", this.apiDomain, API_PREFIX, "health"));
      const { status } = res.data;
      if (status !== `Healthy`) return false;
      return true;
    } catch (error) {
      return false;
    }
  }
}
