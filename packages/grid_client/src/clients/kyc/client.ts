import { Keyring } from "@polkadot/keyring";
import { KeyringPair } from "@polkadot/keyring/types";
import { waitReady } from "@polkadot/wasm-crypto";
import { InsufficientBalanceError, KycBaseError, KycErrors, RequestError, ValidationError } from "@threefold/types";
import { HttpStatusCode } from "axios";
import { Buffer } from "buffer";
import urlJoin from "url-join";

import { bytesFromHex, formatErrorMessage, KeypairType, send, stringToHex } from "../..";
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
    this.apiDomain = apiDomain.replace("https://", "");
    this.apiDomain = apiDomain.replace("http://", "");
    this.apiDomain = apiDomain.replace("/", "");
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
   * Throws specific KYC-related errors based on the provided error message.
   *
   * @param errorMessage - The error message to evaluate.
   * @throws {KycErrors.KycInvalidAddressError} If the error message indicates a malformed address.
   * @throws {KycErrors.KycInvalidChallengeError} If the error message indicates a malformed or bad challenge.
   * @throws {KycErrors.KycInvalidSignatureError} If the error message indicates a malformed or bad signature.
   * @returns {undefined} If the error message does not match any known error patterns.
   */
  private ThrowHeadersRelatedError(errorMessage: string) {
    switch (true) {
      case errorMessage.includes("malformed address"):
        throw new KycErrors.KycInvalidAddressError(errorMessage);
      case errorMessage.includes("malformed challenge") || errorMessage.includes("bad challenge"):
        throw new KycErrors.KycInvalidChallengeError(errorMessage);
      case errorMessage.includes("malformed signature") || errorMessage.includes("bad signature"):
        throw new KycErrors.KycInvalidSignatureError(errorMessage);
      default:
        return undefined;
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
      return await send("GET", urlJoin("https://", this.apiDomain, API_PREFIX, "data"), "", headers);
    } catch (error) {
      const messagePrefix = "Failed to get authentication data from KYC service";
      const errorMessage = formatErrorMessage(messagePrefix, error);
      const statusCode = (error as RequestError).statusCode;
      this.ThrowHeadersRelatedError(errorMessage);
      if (statusCode === 404) throw new KycErrors.KycUnverifiedError(errorMessage);
      throw new KycBaseError(errorMessage);
    }
  }

  /**
   * Retrieves the current verification status.
   *
   * @returns {Promise<KycStatus>} A promise that resolves to the verification status.
   * @throws {KycErrors.TFGridKycError | KycBaseError} If there is an issue with fetching the status data.
   */
  async status(): Promise<KycStatus> {
    try {
      if (!this.keypair) await this.setupKeyring();
      const res = await send(
        "GET",
        urlJoin("https://", this.apiDomain, API_PREFIX, "status", `?client_id=${this.address}`),
        "",
        { "Content-Type": "application/json" },
      );
      if (!res.result.status)
        throw new KycErrors.KycInvalidResponseError(
          "Failed to get status due to: Response does not contain status field",
        );
      return res.result.status;
    } catch (error) {
      if (error instanceof RequestError && error.statusCode === HttpStatusCode.NotFound) return KycStatus.unverified;
      const messagePrefix = "Failed to get authentication status from KYC service";
      const errorMessage = formatErrorMessage(messagePrefix, error);
      this.ThrowHeadersRelatedError(errorMessage);
      throw new KycBaseError(errorMessage);
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
      const res = await send("POST", urlJoin("https://", this.apiDomain, API_PREFIX, "token"), "", headers);
      if (!res.result.authToken)
        throw new KycErrors.KycInvalidResponseError(
          "Failed to get token due to: Response does not contain authToken field",
        );
      return res.result.authToken;
    } catch (error) {
      const messagePrefix = "Failed to get auth token from KYC service";
      const errorMessage = formatErrorMessage(messagePrefix, error);
      const statusCode = (error as RequestError).statusCode;
      this.ThrowHeadersRelatedError(errorMessage);
      switch (true) {
        case statusCode === HttpStatusCode.TooManyRequests:
          throw new KycErrors.KycRateLimitError(errorMessage);
        case errorMessage.includes("already verified"):
          throw new KycErrors.KycAlreadyVerifiedError(errorMessage);
        case errorMessage.includes("balance"):
          throw new InsufficientBalanceError(errorMessage);
        default:
          throw new KycBaseError(errorMessage);
      }
    }
  }
}
