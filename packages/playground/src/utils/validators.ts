import type { GridClient } from "@threefold/grid_client";
import StellarSdk from "stellar-sdk";
import validator from "validator";
import type { Options } from "validator/lib/isBoolean";
import type { IsEmailOptions } from "validator/lib/isEmail";
import type { IsFQDNOptions } from "validator/lib/isFQDN";
import type { IsURLOptions } from "validator/lib/isURL";

import { SessionStorageSettingsKey } from "./settings";

/**
 * Checks if a value is empty, undefined, or null.
 * @param msg - The error message to be returned if the value is empty.
 * @returns A validation function that takes in a value and returns an object with the error message and a `required` property set to `true` if the value is empty, undefined, or null.
 */
export function required(msg: string) {
  return (value: string) => {
    if (!value) {
      return { message: msg, required: true };
    }
  };
}

export function minLength(msg: string, min: number) {
  return (value: string) => {
    if (value.length < min) {
      return { message: msg, minLength: min };
    }
  };
}

export function maxLength(msg: string, max: number) {
  return (value: string) => {
    if (value.length > max) {
      return { message: msg, maxLength: max };
    }
  };
}

export function equal(msg: string, length: number) {
  return (value: string) => {
    if (value.length !== length) {
      return { message: msg, equal: length };
    }
  };
}

export function isEmail(msg: string, options?: IsEmailOptions) {
  return (value: string) => {
    if (!validator.isEmail(value, options)) {
      return { message: msg, isEmail: options || true };
    }
  };
}

export function isIn(msg: string, list: string[]) {
  return (value: string) => {
    if (!validator.isIn(value, list)) {
      return { message: msg, isIn: list };
    }
  };
}

export function isInt(msg: string, options?: validator.IsIntOptions) {
  return (value: string) => {
    if (!validator.isInt(value, options)) {
      return { message: msg, isInt: options || true };
    }
  };
}

export function min(msg: string, min: number) {
  return (value: string) => {
    if (+value < min) {
      return { message: msg, min };
    }
  };
}

export function startsWith(msg: string, char: string) {
  return (value: string) => {
    if (value.startsWith(char)) {
      return { message: msg };
    }
  };
}

export function validateResourceMaxNumber(msg: string) {
  return (value: string) => {
    if (+value > BigInt(2 ** 32 - 1)) {
      return { message: msg };
    }
  };
}

export function max(msg: string, max: number) {
  return (value: string) => {
    if (+value > max) {
      return { message: msg, max };
    }
  };
}

export function requiredTrue(msg: string) {
  return (value: string) => {
    if (Boolean(value) !== true) {
      return { message: msg, requiredTrue: true };
    }
  };
}

export function IsAlphanumericExpectUnderscore(msg: string) {
  return (value: string) => {
    if (!/^[a-zA-Z0-9_]*$/.test(value)) {
      return { message: msg, requiredTrue: true };
    }
  };
}

/**
 * Returns a validation function that checks if the value only contains alphanumeric characters, dashes, and underscores.
 *
 * @param {string} msg - The error message to return if the validation fails.
 *
 * @returns {(value: string) => { message: string, requiredTrue: boolean }} - A function that takes a string value as input and returns an object with an error message and a requiredTrue flag if the validation fails.
 */

export function IsAlphanumericExpectDashAndUnderscore(msg: string) {
  return (value: string) => {
    if (!/^[a-zA-Z0-9_-]+$/.test(value)) {
      return { message: msg, requiredTrue: true };
    }
  };
}

export function isAfter(msg: string, date?: string) {
  return (value: string) => {
    if (!validator.isAfter(value, date)) {
      return { message: msg, isAfter: date || true };
    }
  };
}

export interface IsAlpha {
  locale?: validator.AlphaLocale;
  options?: validator.IsAlphaOptions;
}
export function isAlpha(msg: string, config: IsAlpha = {}) {
  return (value: string) => {
    if (!validator.isAlpha(value, config.locale, config.options)) {
      return { message: msg, isAlpha: config };
    }
  };
}

export interface IsAlphanumeric {
  locale?: validator.AlphanumericLocale;
  options?: validator.IsAlphanumericOptions;
}
export function isAlphanumeric(msg: string, config: IsAlphanumeric = {}) {
  const { locale, options } = config;
  return (value: string) => {
    if (!validator.isAlphanumeric(value, locale, options)) {
      return { message: msg, isAlphanumeric: config };
    }
  };
}

export function isAscii(msg: string) {
  return (value: string) => {
    if (!validator.isAscii(value)) {
      return { message: msg, isAscii: true };
    }
  };
}

export function isBIC(msg: string) {
  return (value: string) => {
    if (!validator.isBIC(value)) {
      return { message: msg, isBIC: true };
    }
  };
}

export function isBase32(msg: string) {
  return (value: string) => {
    if (!validator.isBase32(value)) {
      return { message: msg, isBase32: true };
    }
  };
}

export function isBase58(msg: string) {
  return (value: string) => {
    if (!validator.isBase58(value)) {
      return { message: msg, isBase58: true };
    }
  };
}

export function isBase64(msg: string) {
  return (value: string) => {
    if (!validator.isBase64(value)) {
      return { message: msg, isBase64: true };
    }
  };
}

export function isBoolean(msg: string, options?: Options) {
  return (value: string) => {
    if (!validator.isBoolean(value, options)) {
      return { message: msg, isBoolean: options || true };
    }
  };
}

export function isBefore(msg: string, date?: string) {
  return (value: string) => {
    if (!validator.isBefore(value, date)) {
      return { message: msg, isBefore: date || true };
    }
  };
}

export function isBtcAddress(msg: string) {
  return (value: string) => {
    if (!validator.isBtcAddress(value)) {
      return { message: msg, isBtcAddress: true };
    }
  };
}

export function isByteLength(msg: string, options?: validator.IsByteLengthOptions) {
  return (value: string) => {
    if (!validator.isByteLength(value, options)) {
      return { message: msg, isByteLength: options || true };
    }
  };
}

export function isCreditCard(msg: string) {
  return (value: string) => {
    if (!validator.isCreditCard(value)) {
      return { message: msg, isCreditCard: true };
    }
  };
}

export function isCurrency(msg: string, options?: validator.IsCurrencyOptions) {
  return (value: string) => {
    if (!validator.isCurrency(value, options)) {
      return { message: msg, isCurrency: options || true };
    }
  };
}

export function isDataURI(msg: string) {
  return (value: string) => {
    if (!validator.isDataURI(value)) {
      return { message: msg, isDataURI: true };
    }
  };
}

export function isDate(msg: string, options?: validator.IsDateOptions) {
  return (value: string) => {
    if (!validator.isDate(value, options)) {
      return { message: msg, isDate: options || true };
    }
  };
}

export function isDecimal(msg: string, options?: validator.IsDecimalOptions) {
  return (value: string) => {
    if (!validator.isDecimal(value, options)) {
      return { message: msg, isDecimal: options || true };
    }
  };
}

export function isDivisibleBy(msg: string, by: number) {
  return (value: string) => {
    if (!validator.isDivisibleBy(value, by)) {
      return { message: msg, isDivisibleBy: by };
    }
  };
}

export function isEAN(msg: string) {
  return (value: string) => {
    if (!validator.isEAN(value)) {
      return { message: msg, isEAN: true };
    }
  };
}

export function isEmpty(msg: string, options?: validator.IsEmptyOptions) {
  return (value: string) => {
    if (!validator.isEmpty(value, options)) {
      return { message: msg, isEmpty: options || true };
    }
  };
}

export function isNotEmpty(msg: string, options?: validator.IsEmptyOptions) {
  return (value: string) => {
    if (validator.isEmpty(value, options)) {
      return { message: msg, isNotEmpty: options || true };
    }
  };
}

export function isEthereumAddress(msg: string) {
  return (value: string) => {
    if (!validator.isEthereumAddress(value)) {
      return { message: msg, isEthereumAddress: true };
    }
  };
}

export function isFloat(msg: string, options?: validator.IsFloatOptions) {
  return (value: string) => {
    if (!validator.isFloat(value, options)) {
      return { message: msg, isFloat: options || true };
    }
  };
}

export function isFullWidth(msg: string) {
  return (value: string) => {
    if (!validator.isFullWidth(value)) {
      return { message: msg, isFullWidth: true };
    }
  };
}

export function isFQDN(msg: string, options?: IsFQDNOptions) {
  return (value: string) => {
    if (!validator.isFQDN(value, options)) {
      return { message: msg, isFQDN: options || true };
    }
  };
}

export function isHSL(msg: string) {
  return (value: string) => {
    if (!validator.isHSL(value)) {
      return { message: msg, isHSL: true };
    }
  };
}

export function isHalfWidth(msg: string) {
  return (value: string) => {
    if (!validator.isHalfWidth(value)) {
      return { message: msg, isHalfWidth: true };
    }
  };
}

export function isHash(msg: string, algorithm: validator.HashAlgorithm) {
  return (value: string) => {
    if (!validator.isHash(value, algorithm)) {
      return { message: msg, isHash: algorithm };
    }
  };
}

export function isHexColor(msg: string) {
  return (value: string) => {
    if (!validator.isHexColor(value)) {
      return { message: msg, isHexColor: true };
    }
  };
}

export function isHexadecimal(msg: string) {
  return (value: string) => {
    if (!validator.isHexadecimal(value)) {
      return { message: msg, isHexadecimal: true };
    }
  };
}

export function isIBAN(msg: string) {
  return (value: string) => {
    if (!validator.isIBAN(value)) {
      return { message: msg, isIBAN: true };
    }
  };
}

export function isIP(msg: string, options?: validator.IPVersion) {
  return (value: string) => {
    if (!validator.isIP(value, options)) {
      return { message: msg, isIP: options || true };
    }
  };
}

export function isIPRange(msg: string, options?: validator.IPVersion) {
  return (value: string) => {
    if (!validator.isIPRange(value, options)) {
      return { message: msg, isIPRange: options || true };
    }
  };
}

export function isISBN(msg: string, options?: validator.ISBNVersion) {
  return (value: string) => {
    if (!validator.isISBN(value, options)) {
      return { message: msg, isISBN: options || true };
    }
  };
}

export function isISIN(msg: string) {
  return (value: string) => {
    if (!validator.isISIN(value)) {
      return { message: msg, isISIN: true };
    }
  };
}

export function isISO31661Alpha2(msg: string) {
  return (value: string) => {
    if (!validator.isISO31661Alpha2(value)) {
      return { message: msg, isISO31661Alpha2: true };
    }
  };
}

export function isISO31661Alpha3(msg: string) {
  return (value: string) => {
    if (!validator.isISO31661Alpha3(value)) {
      return { message: msg, isISO31661Alpha3: true };
    }
  };
}

export function isISO4217(msg: string) {
  return (value: string) => {
    if (!validator.isISO4217(value)) {
      return { message: msg, isISO4217: true };
    }
  };
}

export function isISO8601(msg: string, options?: validator.IsISO8601Options) {
  return (value: string) => {
    if (!validator.isISO8601(value, options)) {
      return { message: msg, isISO8601: options || true };
    }
  };
}

export function isISRC(msg: string) {
  return (value: string) => {
    if (!validator.isISRC(value)) {
      return { message: msg, isISRC: true };
    }
  };
}

export function isISSN(msg: string, options?: validator.IsISSNOptions) {
  return (value: string) => {
    if (!validator.isISSN(value, options)) {
      return { message: msg, isISSN: options || true };
    }
  };
}

export type IsIdentityCard = "any" | validator.IdentityCardLocale;
export function isIdentityCard(msg: string, options?: IsIdentityCard) {
  return (value: string) => {
    if (!validator.isIdentityCard(value, options)) {
      return { message: msg, isIdentityCard: options || true };
    }
  };
}

export function isJSON(msg: string) {
  return (value: string) => {
    if (!validator.isJSON(value)) {
      return { message: msg, isJSON: true };
    }
  };
}

export function isJWT(msg: string) {
  return (value: string) => {
    if (!validator.isJWT(value)) {
      return { message: msg, isJWT: true };
    }
  };
}

export function isLatLong(msg: string) {
  return (value: string) => {
    if (!validator.isLatLong(value)) {
      return { message: msg, isLatLong: true };
    }
  };
}

export function isLocale(msg: string) {
  return (value: string) => {
    if (!validator.isLocale(value)) {
      return { message: msg, isLocale: true };
    }
  };
}

export function isLowercase(msg: string) {
  return (value: string) => {
    if (!validator.isLowercase(value)) {
      return { message: msg, isLowercase: true };
    }
  };
}

export function isMACAddress(msg: string, options?: validator.IsMACAddressOptions) {
  return (value: string) => {
    if (!validator.isMACAddress(value, options)) {
      return { message: msg, isMACAddress: options || true };
    }
  };
}

export function isMD5(msg: string) {
  return (value: string) => {
    if (!validator.isMD5(value)) {
      return { message: msg, isMD5: true };
    }
  };
}

export function isMagnetURI(msg: string) {
  return (value: string) => {
    if (!validator.isMagnetURI(value)) {
      return { message: msg, isMagnetURI: true };
    }
  };
}

export function isMimeType(msg: string) {
  return (value: string) => {
    if (!validator.isMimeType(value)) {
      return { message: msg, isMimeType: true };
    }
  };
}

export interface IsMobilePhone {
  locale?: "any" | validator.MobilePhoneLocale | validator.MobilePhoneLocale[];
  options?: validator.IsMobilePhoneOptions;
}
export function isMobilePhone(msg: string, config: IsMobilePhone = {}) {
  const { locale, options } = config;
  return (value: string) => {
    if (!validator.isMobilePhone(value, locale, options)) {
      return { message: msg, isMobilePhone: config || true };
    }
  };
}

export function isMongoId(msg: string) {
  return (value: string) => {
    if (!validator.isMongoId(value)) {
      return { message: msg, isMongoId: true };
    }
  };
}

export function isMultibyte(msg: string) {
  return (value: string) => {
    if (!validator.isMultibyte(value)) {
      return { message: msg, isMultibyte: true };
    }
  };
}

export function isNumeric(msg: string, options?: validator.IsNumericOptions) {
  return (value: string) => {
    if (!validator.isNumeric(value, options)) {
      return { message: msg, isNumeric: options || true };
    }
  };
}

export function isOctal(msg: string) {
  return (value: string) => {
    if (!validator.isOctal(value)) {
      return { message: msg, isOctal: true };
    }
  };
}

export function isPassportNumber(msg: string, countryCode?: string) {
  return (value: string) => {
    if (!validator.isPassportNumber(value, countryCode)) {
      return { message: msg, isPassportNumber: countryCode || true };
    }
  };
}

export function isPort(msg: string) {
  return (value: string) => {
    if (!validator.isPort(value)) {
      return { message: msg, isPort: true };
    }
  };
}

export type IsPostalCode = "any" | validator.PostalCodeLocale;
export function isPostalCode(msg: string, locale: IsPostalCode) {
  return (value: string) => {
    if (!validator.isPostalCode(value, locale)) {
      return { message: msg, isPostalCode: locale };
    }
  };
}

export function isRFC3339(msg: string) {
  return (value: string) => {
    if (!validator.isRFC3339(value)) {
      return { message: msg, isRFC3339: true };
    }
  };
}

export function isRgbColor(msg: string, includePercentValues?: boolean) {
  return (value: string) => {
    if (!validator.isRgbColor(value, includePercentValues)) {
      return { message: msg, isRgbColor: includePercentValues || true };
    }
  };
}

export function isSemVer(msg: string) {
  return (value: string) => {
    if (!validator.isSemVer(value)) {
      return { message: msg, isSemVer: true };
    }
  };
}

export function isSlug(msg: string) {
  return (value: string) => {
    if (!validator.isSlug(value)) {
      return { message: msg, isSlug: true };
    }
  };
}
export function validateCurrentPassword(msg: string) {
  return (value: string) => {
    if (sessionStorage.getItem(SessionStorageSettingsKey.PASSWORD_KEY) != value) {
      return { message: msg };
    }
  };
}
/**
 * Checks that new password isn't the same as the current one.
 */
export function validateNewPassword(msg: string, currentPassword: string) {
  return (value: string) => {
    if (value === currentPassword) {
      return { message: msg };
    }
  };
}
export function validateConfirmPassword(msg: string, newPassword: string) {
  return (value: string) => {
    if (value !== newPassword) {
      return { message: msg };
    }
  };
}

export type IsStrongPassword = validator.StrongPasswordOptions & {
  returnScore?: false;
};
export function isStrongPassword(msg: string, options?: IsStrongPassword) {
  return (value: string) => {
    if (!validator.isStrongPassword(value, options)) {
      return { message: msg, isStrongPassword: options || true };
    }
  };
}

export function isSurrogatePair(msg: string) {
  return (value: string) => {
    if (!validator.isSurrogatePair(value)) {
      return { message: msg, isSurrogatePair: true };
    }
  };
}

export function isTaxID(msg: string, locale?: string) {
  return (value: string) => {
    if (!validator.isTaxID(value, locale)) {
      return { message: msg, isTaxID: locale || true };
    }
  };
}

export function isURL(msg: string, options?: IsURLOptions) {
  return (value: string) => {
    if (!validator.isURL(value, options)) {
      return { message: msg, isURL: options || true };
    }
  };
}

export function isUUID(msg: string, version?: validator.UUIDVersion) {
  return (value: string) => {
    if (!validator.isUUID(value, version)) {
      return { message: msg, isUUID: version || true };
    }
  };
}

export function isUppercase(msg: string) {
  return (value: string) => {
    if (!validator.isUppercase(value)) {
      return { message: msg, isUppercase: true };
    }
  };
}

export function isVAT(msg: string, countryCode: string) {
  return (value: string) => {
    if (!validator.isVAT(value, countryCode)) {
      return { message: msg, isVAT: true };
    }
  };
}

export function isVariableWidth(msg: string) {
  return (value: string) => {
    if (!validator.isVariableWidth(value)) {
      return { message: msg, isVariableWidth: true };
    }
  };
}

export function isWhitelisted(msg: string, chars: string | string[]) {
  return (value: string) => {
    if (!validator.isWhitelisted(value, chars)) {
      return { message: msg, isWhitelisted: chars };
    }
  };
}

export function isString(msg: string) {
  return (value: string) => {
    if (typeof value !== "string") {
      return { message: msg, isString: true };
    }
  };
}

export function ipNotEqualGateway(ip: string, gw: string, msg: string) {
  return (value: string) => {
    const address = ip.split("/")[0];
    if (gw === address) {
      return { message: msg, isNotEqualStrings: true };
    }
  };
}

export interface RegexPattern {
  pattern: string | RegExp;
  flags?: string | undefined;
}
export function pattern(msg: string, config: RegexPattern) {
  const regex = new RegExp(config.pattern, config.flags);
  return (value: string) => {
    if (!regex.test(value)) {
      return { message: msg, pattern: String(regex) };
    }
  };
}

export function isValidDecimalNumber(length: number, msg: string) {
  return (value: string) => {
    if (!(value.toString().split(".").length > 1 ? value.toString().split(".")[1].length <= length : true)) {
      return {
        message: msg,
      };
    }
  };
}
export async function isValidStellarAddress(
  target: string,
): Promise<import("@/components/input_validator.vue").RuleReturn> {
  const server = new StellarSdk.Server(window.env.STELLAR_HORIZON_URL);
  try {
    // check if the account provided exists on stellar
    const account = await server.loadAccount(target);
    // check if the account provided has the appropriate trustlines
    const includes = account.balances.find(
      (b: { asset_code: string; asset_issuer: string }) =>
        b.asset_code === "TFT" && b.asset_issuer === window.env.TFT_ASSET_ISSUER,
    );
    if (!includes) throw new Error("Invalid trustline");
  } catch (e) {
    const message =
      (e as Error).message === "Invalid trustline"
        ? "Address does not have a valid trustline to TFT"
        : "Address not found";
    return { message };
  }
}

export async function isAvailableName(grid: GridClient, name: string) {
  const valid = await grid.contracts.get_name_contract({ name });
  if (name && !!valid) {
    return { message: "Name is already taken." };
  }
}
