import { BaseError } from "../base_error";
import { ErrorModules } from "../modules";

export enum Errors {
  Unverified,
  InvalidResponse,
  RateLimit,
  badRequest,
  unauthorized,
  AlreadyVerified,
}

export class TFGridKycError extends BaseError {
  constructor(name = "TFGridKycError", code: number, message: string, public statusCode = -1) {
    super(name, code, message, ErrorModules.KYC);
  }
}

export class InvalidResponse extends TFGridKycError {
  constructor(message: string) {
    super("InvalidResponse", Errors.InvalidResponse, message);
  }
}

export class Unverified extends TFGridKycError {
  constructor(message: string) {
    super("Unverified", Errors.Unverified, message);
  }
}

export class RateLimit extends TFGridKycError {
  constructor(message: string) {
    super("RateLimit", Errors.RateLimit, message);
  }
}

export class BadRequest extends TFGridKycError {
  constructor(message: string) {
    super("BadRequest", Errors.badRequest, message);
  }
}

export class Unauthorized extends TFGridKycError {
  constructor(message: string) {
    super("Unauthorized", Errors.unauthorized, message);
  }
}

export class AlreadyVerified extends TFGridKycError {
  constructor(message: string) {
    super("AlreadyVerified", Errors.AlreadyVerified, message);
  }
}
