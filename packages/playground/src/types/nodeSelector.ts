import type { FarmInfo, GPUCardInfo, NodeInfo } from "@threefold/grid_client";

export type Locations = {
  [region: string]: string[];
};

export type SelectedLocation = {
  subregion?: string | undefined;
  country?: string;
  region?: string;
};

export interface SelectionDetailsFilters {
  ipv4?: boolean;
  ipv6?: boolean;
  hasGPU?: boolean;
  cpu?: number;
  memory?: number;
  ssdDisks?: number[];
  hddDisks?: number[];
  rootFilesystemSize?: number;
  solutionDisk?: number;
  certified?: boolean;
  dedicated?: boolean;
  exclusiveFor?: string;
  planetary?: boolean;
  mycelium?: boolean;
  wireguard?: boolean;
}

export interface NumericValidator {
  type: "int" | "number";
  min: number;
  max: number;
}

export interface SelectionDetailsFiltersValidators {
  cpu: NumericValidator;
  memory: NumericValidator;
  ssdDisks: NumericValidator;
  hddDisks: NumericValidator;
  rootFilesystemSize: NumericValidator;
  solutionDisk: NumericValidator;
}

export interface NormalizeFarmFiltersOptions {
  size: number;
  page: number;
  twinId: number;
  location: SelectedLocation;
}

export interface NormalizeNodeFiltersOptions {
  size: number;
  page: number;
  twinId: number;
  location: SelectedLocation;
  farm?: FarmInfo;
  gateway?: boolean;
}

export interface DomainInfo {
  selectedDomain: NodeInfo | null;
  enableSelectedDomain: boolean;
  customDomain: string;
  enabledCustomDomain: boolean;
  useFQDN: boolean;
}

export interface SelectionDetails {
  type: "manual" | "automatic";
  validFilters: boolean;
  node?: NodeInfo;
  farm?: FarmInfo;
  location?: SelectedLocation;
  gpuCards: GPUCardInfo[];
  domain?: DomainInfo;
}

export interface SelectedMachine {
  farmId: number;
  nodeId: number;
  cpu: number;
  memory: number;
  disk: number;
  publicIp: boolean;
}
