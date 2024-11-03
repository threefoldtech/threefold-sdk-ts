import { ErrorModules } from "./modules";

export enum Generic {
  TFChainError,
  GridClientError,
  ValidationError,
  TimeoutError,
  ConnectionError,
  RMBError,
  InvalidResponse,
  RequestError,
  TwinNotExistError,
  InsufficientBalanceError,
  DeploymentKeyDeletionError,
  KycError,
}
export abstract class BaseError extends Error {
  constructor(name: string, public code: number, message: string, public module: ErrorModules) {
    super(message);
  }
}

export class ValidationError extends BaseError {
  constructor(message: string) {
    super("ValidationError", Generic.ValidationError, message, ErrorModules.Generic);
  }
}
export class TimeoutError extends BaseError {
  constructor(message: string) {
    super("TimeoutError", Generic.TimeoutError, message, ErrorModules.Generic);
  }
}

export class ConnectionError extends BaseError {
  constructor(message: string) {
    super("ConnectionError", Generic.ConnectionError, message, ErrorModules.Generic);
  }
}

export class RMBError extends BaseError {
  constructor(message: string) {
    super("RMBError", Generic.RMBError, message, ErrorModules.Generic);
  }
}

export class InvalidResponse extends BaseError {
  constructor(message: string) {
    super("InvalidResponse", Generic.InvalidResponse, message, ErrorModules.Generic);
  }
}

export class RequestError extends BaseError {
  constructor(message: string, public statusCode = -1) {
    super("RequestError", Generic.RequestError, message, ErrorModules.Generic);
  }
}

export class TwinNotExistError extends BaseError {
  constructor(message: string) {
    super("TwinNotExistError", Generic.TwinNotExistError, message, ErrorModules.Generic);
  }
}

export class InsufficientBalanceError extends BaseError {
  constructor(message: string) {
    super("InsufficientBalanceError", Generic.InsufficientBalanceError, message, ErrorModules.Generic);
  }
}

export class DeploymentKeyDeletionError extends BaseError {
  constructor(message: string) {
    super("DeploymentKeyDeletionError", Generic.DeploymentKeyDeletionError, message, ErrorModules.Generic);
  }
}

export class KycBaseError extends BaseError {
  constructor(message: string, public statusCode = -1) {
    super("TFGridKYC", Generic.KycError, message, ErrorModules.Generic);
  }
}
