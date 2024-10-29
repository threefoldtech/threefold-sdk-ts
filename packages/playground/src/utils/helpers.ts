import { InsufficientBalanceError } from "@threefold/types";

import type { NodeGPUCardType } from "../utils/filter_nodes";

export function downloadAsFile(name: string, data: string) {
  const a = document.createElement("a");
  a.download = name;
  a.href = `data:text/raw;charset=utf-8,${encodeURIComponent(data)}`;
  document.body.appendChild(a);
  a.click();
  a.remove();
}

/**
 * Downloads a file with the given name and data.
 *
 * @param data - The data to be included in the file.
 * @param filename - The name of the file to be downloaded.
 * @returns void
 */
export function downloadAsJson(data: object, filename: string) {
  const a = document.createElement("a");
  a.download = `${filename}.json`;
  a.href = `data:text/json;charset=utf-8,${encodeURIComponent(JSON.stringify(data))}`;
  document.body.appendChild(a);
  a.click();
  a.remove();
}

/* prettier-ignore */
const HANDLED_ERRORS = [
  [InsufficientBalanceError, "Failed to apply Transaction due to account balance is too low."],
  /** @Usage [Constructor, "messageError"] */
] as const;

export function normalizeError(error: any, fallbackError: string): string {
  for (const [Ctor, msg] of HANDLED_ERRORS) {
    if (error instanceof Ctor) {
      return msg;
    }
  }

  return typeof error === "string"
    ? error
    : error && typeof error === "object" && "message" in error && typeof error.message === "string"
    ? error.message
    : fallbackError;
}

export function normalizeBalance(num: number | string | undefined, floor = false): string {
  if (!num || isNaN(+num)) return (num ?? "").toString();

  if (floor) {
    return (Math.floor(+num * 1000) / 1000).toString();
  }

  const [int = "0", decimal = ""] = num.toString().split(".");

  if (decimal.startsWith("000")) {
    if (+int > 0) return "~ <" + int;
    else return "~ <0.001";
  }

  return (+num).toFixed(3).replace(/\.0+$/g, "");
}

export function isEnoughBalance(balance: any, min = 0.001): boolean {
  return balance?.free > min ? true : false;
}

export function getDashboardURL(network: string) {
  if (network === "main") {
    return "https://dashboard.grid.tf";
  }
  return `https://dashboard.${network}.grid.tf`;
}

export function getCardName(card: NodeGPUCardType): string {
  return card.vendor + " - " + card.device;
}

export function toGigaBytes(value?: number) {
  const giga = 1024 ** 3;

  if (value === undefined || value === null || isNaN(value) || value === 0) {
    return 0;
  }

  const gb = value / giga;
  return parseFloat(gb.toFixed(2));
}

export function markAsFromAnotherClient(deployment: any): any {
  deployment.fromAnotherClient = true;
  if (Array.isArray(deployment)) {
    deployment.map(t => {
      t.fromAnotherClient = true;
      return t;
    });
  }
  return deployment;
}
