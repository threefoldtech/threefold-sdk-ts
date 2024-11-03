/**
 * KYC service token response type
 */
export interface TokenResponse {
  authToken: string;
  clientId: string;
  digitString: string;
  expiryTime: number;
  message: string;
  scanRef: string;
  sessionLength: number;
  tokenType: string;
}
/**
 * @interface VerificationStatusResponse
 * KYC service token response type
 */
export interface VerificationStatusResponse {
  autoDocument: string;
  autoFace: string;
  clientId: string;
  fraudTags: string[];
  manualDocument: string;
  manualFace: string;
  mismatchTags: string[];
  scanRef: string;
  status: string;
}

export interface VerificationDataResponse {
  additionalData: object;
  address: string;
  addressVerification: object;
  ageEstimate: string;
  authority: string;
  birthPlace: string;
  clientId: string;
  clientIpProxyRiskLevel: string;
  docBirthName: string;
  docDateOfIssue: string;
  docDob: string;
  docExpiry: string;
  docFirstName: string;
  docIssuingCountry: string;
  docLastName: string;
  docNationality: string;
  docNumber: string;
  docPersonalCode: string;
  docSex: string;
  docTemporaryAddress: string;
  docType: string;
  driverLicenseCategory: string;
  duplicateDocFaces: string[];
  duplicateFaces: string[];
  fullName: string;
  manuallyDataChanged: boolean;
  mothersMaidenName: string;
  orgAddress: string;
  orgAuthority: string;
  orgBirthName: string;
  orgBirthPlace: string;
  orgFirstName: string;
  orgLastName: string;
  orgMothersMaidenName: string;
  orgNationality: string;
  orgTemporaryAddress: string;
  scanRef: string;
  selectedCountry: string;
}

/**
 * Interface representing the headers required for KYC (Know Your Customer) requests.
 *
 * @property {string} content-type - The MIME type of the request body.
 * @property {string} X-Client-ID - TF chian address
 * @property {string} X-Challenge - hex-encoded message `{api-domain}:{timestamp}`.
 * @property {string} X-Signature - hex-encoded sr25519|ed25519 signature.
 */
export interface KycHeaders {
  "content-type": string;
  "X-Client-ID": string;
  "X-Challenge": string;
  "X-Signature": string;
}
export enum KycStatus {
  unverified = "UNVERIFIED",
  verified = "VERIFIED",
  rejected = "REJECTED",
  pending = "PENDING",
}
