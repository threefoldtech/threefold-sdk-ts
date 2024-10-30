import { CertificationType, type GridNode, type NodeStats, NodeStatus } from "@threefold/gridproxy_client";
import { capitalize } from "vue";
import type { VDataTable } from "vuetify/components";

import type { AsyncRule, SyncRule } from "@/components/input_validator.vue";

import type * as validators from "../utils/validators";
// Input attrs
export type InputFilterType = {
  label: string;
  tooltip: string;
  value?: string;
  rules?: [syncRules: SyncRule[], asyncRules?: AsyncRule[]];
  error?: string;
  type: string;
};

export type CPUBenchmark = {
  multi: number;
  single: number;
  threads: number;
  workloads: number;
};

export enum ProfileTypes {
  DIY,
  TITAN,
}

export enum Certification {
  NONE = 0,
  CERTIFIED = 1,
  GOLD_CERTIFIED = 2,
}

export interface FarmingProfileOptions {
  type: ProfileTypes;
  name: string;
  memory: number;
  cpu: number;
  hdd: number;
  ssd: number;
  price: number;
  priceAfter5Years: number;
  maximumTokenPrice: number;
  powerUtilization: number;
  powerCost: number;
  certified: Certification;
  publicIp: boolean;
  investmentCostHW: number;
  nuRequiredPerCu: number;
}
export interface K8SWorker {
  name: string;
  cpu: number;
  memory: number;
  diskSize: number;
  ipv4: boolean;
  ipv6: boolean;
  planetary: boolean;
  mycelium: boolean;
  wireguard: boolean;
  rootFsSize: number;
  rentedBy?: number;
  dedicated: boolean;
  certified: boolean;
  selectionDetails?: SelectionDetails;
}

export interface CaproverWorker {
  name: string;
  solution?: solutionFlavor;
  dedicated?: boolean;
  certified?: boolean;
  selectionDetails?: SelectionDetails;
  ipv4: boolean;
  ipv6: boolean;
  wireguard: boolean;
  planetary: boolean;
  mycelium: boolean;
}

export interface FarmInterface {
  name: string;
  farmID: number;
  country: string;
  region: string;
}

export interface Flist {
  name?: string;
  value: string;
  entryPoint: string;
}

export type VDataTableHeader = {
  title: string;
  key: string;
  sortable?: boolean;
  children?: VDataTableHeader;
  [key: string]: any;
}[];

export enum ProjectName {
  Jenkins = "Jenkins",
  Kubernetes = "Kubernetes",
  Caprover = "CapRover",
  Discourse = "Discourse",
  Funkwhale = "Funkwhale",
  Mastodon = "Mastodon",
  Mattermost = "Mattermost",
  Owncloud = "Owncloud",
  Nextcloud = "Nextcloud",
  Peertube = "Peertube",
  Subsquid = "Subsquid",
  Taiga = "Taiga",
  Wordpress = "Wordpress",
  Gateway = "GatewayName",
  QVM = "Qvm",
  TFhubValidator = "TFhubValidator",
  Casperlabs = "Casperlabs",
  Presearch = "Presearch",
  VM = "VM",
  NodePilot = "NodePilot",
  Fullvm = "Fullvm",
  Algorand = "Algorand",
  Qvm = "Qvm",
  Umbrel = "Umbrel",
  FreeFlow = "Freeflow",
  StaticWebsite = "StaticWebsite",
  TFRobot = "TFRobot",
  Gitea = "Gitea",
  Nostr = "Nostr",
  Domains = "Domains",
  Jitsi = "Jitsi",
}

export enum SolutionCode {
  jenkins = "jk",
  peertube = "pt",
  funkwhale = "fw",
  taiga = "tg",
  discourse = "dc",
  owncloud = "oc",
  nextcloud = "nc",
  mattermost = "mm",
  mastodon = "md",
  tfhubvalidator = "tfvalidator",
  casperlabs = "cl",
  presearch = "ps",
  caprover = "cp",
  kubernetes = "k8s",
  machines = "vm",
  vm = "vm",
  nodepilot = "np",
  fullvm = "fvm",
  subsquid = "ss",
  algorand = "al",
  qvm = "qvm",
  umbrel = "um",
  wordpress = "wp",
  staticwebsite = "sw",
  tfrobot = "tfr",
  gitea = "gt",
  nostr = "nt",
  Domains = "dm",
  jitsi = "jt",
}

export const solutionType: { [key: string]: string } = {
  jenkins: "Jenkins",
  algorand: "Algorand",
  caprover: "CapRover",
  casperlabs: "Casperlabs",
  discourse: "Discourse",
  fullvm: "Full Virtual Machine",
  funkwhale: "Funkwhale",
  gatewayname: "Gateway Name",
  kubernetes: "Kubernetes",
  mattermost: "Mattermost",
  nodepilot: "Node Pilot",
  owncloud: "Owncloud",
  nextcloud: "Nextcloud",
  peertube: "Peertube",
  presearch: "Presearch",
  subsquid: "Subsquid",
  taiga: "Taiga",
  umbrel: "Umbrel",
  vm: "Micro Virtual Machine",
  wordpress: "Wordpress",
  staticwebsite: "Static Website",
  tfrobot: "TFRobot",
  gitea: "Gitea",
  nostr: "Nostr",
  domains: "Domains",
  jitsi: "Jitsi",
};

export interface solutionFlavor {
  cpu: number;
  memory: number;
  disk: number;
}

export interface GatewayNode {
  id?: number;
  domain: string;
  useFQDN?: boolean;
  ip?: string;
}

export interface IStatistics {
  data: number | string;
  title: string;
  icon: string;
}

export interface SMTPServer {
  enabled: boolean;
  username: string;
  password: string;
  email: string;
  hostname: string;
  port: number;
  tls: boolean;
  ssl: boolean;
}

export type Validators = typeof validators;

export type NodeInputFilterType = {
  label: string;
  tooltip: string;
  value?: string;
  rules?: [syncRules: SyncRule[], asyncRules?: AsyncRule[]];
  error?: string;
  type: string;
};

export interface FilterOptions {
  status?: NodeStatus;
  gpu?: boolean;
  gateway?: boolean;
  page: number;
  size: number;
}

import type { SelectionDetails } from "./nodeSelector";

// The input filters<nodeId, farmIds..etc> and the option filters<status, gpu...etc>

// Status, GPU, Gateway, and any other option should be add here.
export type NodeFilterOptions = {
  status: NodeStatus;
  gpu?: boolean;
  gateway?: boolean;
  page: number;
  size: number;
};

export const nodeOptionsInitializer: NodeFilterOptions = {
  gateway: undefined,
  gpu: undefined,
  page: 1,
  size: 10,
  status: capitalize(NodeStatus.Up) as NodeStatus,
};

export type ResourceWrapper = {
  name: string;
  value: string;
};

export type NodeDetailsCard = {
  name: string;
  value?: string;
  imgSrc?: string;
  hint?: string;
  icon?: string;
  callback?: (value: string) => void;
  nameHint?: string; // v-chip hint beside the item name.
  nameHintColor?: string; // The v-chip color
  type?: string;
  downloadSpeed?: string;
  uploadSpeed?: string;
};

export type NodeStatusColor = {
  color: string;
  status: string;
};

export type NodeTypeColor = {
  color: string;
  type: string;
};

export type NodeHealthColor = {
  color: string;
  type: string;
};

export const nodeStatsInitializer: NodeStats = {
  system: { cru: 0, hru: 0, ipv4u: 0, mru: 0, sru: 0 },
  total: { cru: 0, hru: 0, ipv4u: 0, mru: 0, sru: 0 },
  used: { cru: 0, hru: 0, ipv4u: 0, mru: 0, sru: 0 },
  users: {
    deployments: 0,
    workloads: 0,
    last_deployment_timestamp: 0,
  },
};

export const nodeInitializer: GridNode = {
  id: "",
  nodeId: 0,
  farmId: 0,
  farmName: "",
  twinId: 0,
  country: "",
  region: "",
  gridVersion: 0,
  city: "",
  uptime: 0,
  created: 0,
  farmingPolicyId: 0,
  updatedAt: 0,
  total_resources: { mru: 0, sru: 0, hru: 0, cru: 0 },
  used_resources: { mru: 0, sru: 0, hru: 0, cru: 0 },
  location: { city: "", country: "", latitude: 0, longitude: 0 },
  publicConfig: { domain: "", gw4: "", ipv6: "", gw6: "", ipv4: "" },
  status: NodeStatus.Up,
  certificationType: CertificationType.Diy,
  dedicated: false,
  rentContractId: 0,
  rentedByTwinId: 0,
  farm: {
    certificationType: CertificationType.Diy,
    dedicated: false,
    farmId: 0,
    name: "",
    pricingPolicyId: 0,
    publicIps: [],
    twinId: 0,
    stellarAddress: "",
  },
  publicIps: { free: 0, total: 0, used: 0 },
  twin: { twinId: 0, accountId: "", publicKey: "", relay: "" },
  stats: nodeStatsInitializer,
  gpus: [],
  num_gpu: 0,
  healthy: false,
  rentable: false,
  rented: false,
  dmi: {
    bios: {
      vendor: "",
      version: "",
    },
    baseboard: {
      manufacturer: "",
      product_name: "",
    },
    processor: [
      {
        version: "",
        thread_count: "",
      },
    ],
    memory: [
      {
        manufacturer: "",
        type: "",
      },
    ],
  },
  speed: {
    upload: 0,
    download: 0,
  },
  price_usd: 0,
  extraFee: 0,
};

export interface SSHKeyData {
  id: number;
  publicKey: string;
  name: string;
  createdAt: string;
  isActive: boolean;
  fingerPrint?: string;
  deleting?: boolean;
  activating?: boolean;
}

export enum SSHCreationMethod {
  None = "",
  Generate = "generate",
  Import = "import",
}
