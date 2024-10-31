import { mnemonicToMiniSecret } from "@polkadot/util-crypto";
import { validateMnemonic } from "bip39";
import { Buffer } from "buffer";
import * as crypto from "crypto";
import nacl, { randomBytes } from "tweetnacl";
import utils from "tweetnacl-util";

function generateString(length: number): string {
  let result = "";
  const characters = "abcdefghijklmnopqrstuvwxyz0123456789";
  const charactersLength = characters.length;
  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength));
  }
  return result;
}

function getRandomNumber(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomChoice(choices) {
  const random = Math.floor(Math.random() * choices.length);
  return choices[random];
}

function randomSecret() {
  return randomBytes(nacl.box.secretKeyLength);
}

function randomSecretAsHex() {
  return utils.encodeBase64(randomSecret());
}

function randomNonce() {
  return randomBytes(nacl.box.nonceLength);
}

function log(message) {
  console.log(JSON.stringify(message, null, 2));
}

function toHexSeed(mnemonicOrHexSeed: string): string {
  if (validateMnemonic(mnemonicOrHexSeed)) {
    const seed = mnemonicToMiniSecret(mnemonicOrHexSeed);
    return "0x" + Buffer.from(seed).toString("hex");
  }

  const seed = mnemonicOrHexSeed.length === 64 ? mnemonicOrHexSeed : mnemonicOrHexSeed.slice(2);
  return "0x" + seed;
}

function formatErrorMessage(prefix: string, error: Error) {
  return `${prefix}\n\t ${error.message}`;
}

function generateRandomHexSeed(length: number) {
  const bytes = crypto.randomBytes(length);
  return bytes.toString("hex");
}

function zeroPadding(length: number, num: number) {
  return num.toString(16).padStart(length, "0");
}

/**
 * Converts an object into a query string format.
 * @param obj - The object to be converted into a query string.
 * @returns A string representing the object in query string format.
 */
function convertObjectToQueryString(obj: Record<string, any>): string {
  // Filter out undefined or empty string values
  const filteredParams = Object.fromEntries(
    Object.entries(obj).filter(([_, value]) => value !== undefined && value !== ""),
  );

  // Convert object to query string format
  const queryString = Object.entries(filteredParams)
    .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`)
    .join("&");

  return queryString;
}
/**
 * Converts a string message to its hexadecimal representation.
 * @param message - The message to convert.
 * @returns The hexadecimal representation of the message.
 */
function stringToHex(message: string): string {
  return Buffer.from(message).toString("hex");
}
/**
 * Converts a hexadecimal string to a byte array.
 * @param hex - The hexadecimal string to convert.
 * @returns {Uint8Array} The byte array representation of the hexadecimal string.
 */
function bytesFromHex(hex: string): Uint8Array {
  return new Uint8Array(Buffer.from(hex, "hex"));
}

export {
  generateString,
  getRandomNumber,
  randomChoice,
  randomSecret,
  randomSecretAsHex,
  randomNonce,
  log,
  toHexSeed,
  formatErrorMessage,
  generateRandomHexSeed,
  zeroPadding,
  convertObjectToQueryString,
  stringToHex,
  bytesFromHex,
};
