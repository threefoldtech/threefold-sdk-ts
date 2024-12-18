import type { FarmFilterOptions, FarmInfo, FilterOptions, NodeInfo } from "@threefold/grid_client";
import type { Farm, NodeStatus } from "@threefold/gridproxy_client";
import { GridClientErrors } from "@threefold/types";
import type AwaitLock from "await-lock";
import shuffle from "lodash/fp/shuffle.js";
import type { DeepPartial } from "utility-types";
import { z } from "zod";

import { gqlClient, gridProxyClient } from "../clients";
import type { usePagination } from "../hooks";
import type { useGrid } from "../stores";
import type {
  Locations,
  NormalizeFarmFiltersOptions,
  NormalizeNodeFiltersOptions,
  NumericValidator,
  SelectedLocation,
  SelectedMachine,
  SelectionDetailsFilters,
  SelectionDetailsFiltersValidators,
} from "../types/nodeSelector";
import { createCustomToast, ToastType } from "./custom_toast";
import { normalizeError } from "./helpers";

export interface GetLocationsConfig {
  /**
   * @default true
   */
  onlyWithNodes?: boolean;
}

export async function getLocations(status?: NodeStatus, config: GetLocationsConfig = {}): Promise<Locations> {
  const { onlyWithNodes = true } = config;

  const countries = await gqlClient.countries({
    name: true,
    region: true,
    subregion: true,
  });
  const stats = await gridProxyClient.stats.get({ status });
  const allowedCountriesList = Object.keys(stats.nodesDistribution);
  const droppedCountries = [
    {
      title: "United States of America",
      name: "United States",
    },
    {
      title: "United Kingdom of Great Britain and Northern Ireland",
      name: "United Kingdom",
    },
    {
      title: "Czech Republic",
      name: "Czechia",
    },
  ];

  const locations: Locations = {};

  for (const country of countries) {
    droppedCountries.forEach(con => {
      if (con.title == country.name) {
        country.name = con.name;
      }
    });

    if (allowedCountriesList.includes(country.name) || !onlyWithNodes) {
      const region = country.region !== "unknown region" ? country.region : country.subregion;
      locations[region] = locations[region] || [];
      locations[region].push(country.name);
    }
  }
  return locations;
}

export function normalizeFarmOptions(
  gridStore: ReturnType<typeof useGrid>,
  location: SelectedLocation | undefined,
  pagination: ReturnType<typeof usePagination>,
): NormalizeFarmFiltersOptions {
  return {
    size: window.env.PAGE_SIZE,
    page: pagination.value.page,
    location: location || {},
    twinId: gridStore.client?.twinId,
  };
}

export function normalizeFarmFilters(
  filters: SelectionDetailsFilters,
  options: NormalizeFarmFiltersOptions,
): FarmFilterOptions {
  return {
    size: options.size,
    page: Math.max(1, options.page),
    availableFor: options.twinId,
    country: options.location.country,
    region: options.location.region,
    nodeCRU: filters.cpu,
    nodeMRU: filters.memory ? Math.round(filters.memory / 1024) : undefined,
    nodeRentedBy: filters.dedicated ? options.twinId : undefined,
    nodeHRU: (filters.hddDisks || []).reduce((t, d) => t + d, 0) || undefined,
    nodeSRU:
      (filters.ssdDisks || []).reduce(
        (t, s) => t + s,
        (filters.solutionDisk ?? 0) + (filters.rootFilesystemSize ?? 0),
      ) || undefined,
    publicIp: filters.ipv4 || undefined,
    nodeCertified: filters.certified || undefined,
    nodeHasGPU: filters.hasGPU || undefined,
    nodeHasIPv6: filters.ipv6 || undefined,
  };
}

export async function getFarmPageCount(gridStore: ReturnType<typeof useGrid>, filters: FarmFilterOptions) {
  const count = await gridStore.client.capacity.getFarmsCount(filters);
  return Math.ceil(count / window.env.PAGE_SIZE);
}

export async function loadFarms(
  gridStore: ReturnType<typeof useGrid>,
  filters: FarmFilterOptions,
  exclusiveFor?: string,
) {
  const farms = await gridStore.client.capacity.filterFarms(filters);

  if (exclusiveFor && !filters.publicIp) {
    const blockedFarms = await getBlockedFarmSet(exclusiveFor);
    return farms.filter(farm => !blockedFarms.has(farm.farmId));
  }

  return farms;
}

export async function getBlockedFarmSet(exclusiveFor: string) {
  const { totalCount } = await gqlClient.nodeContractsConnection(
    { totalCount: true },
    {
      orderBy: ["id_ASC"],
      where: {
        deploymentData_contains: exclusiveFor,
        state_eq: "Created",
        numberOfPublicIPs_eq: 0,
      },
    },
  );

  const nodes = await gqlClient.nodeContracts(
    { nodeID: true },
    {
      limit: totalCount,
      where: {
        deploymentData_contains: exclusiveFor,
        state_eq: "Created",
        numberOfPublicIPs_eq: 0,
      },
    },
  );

  const farms = await Promise.all(
    Array.from(new Set(nodes.map(node => node.nodeID))).map(id => gridProxyClient.nodes.byId(id)),
  );
  return new Set(farms.map(farm => farm.farmId));
}

export async function searchFarms(query: string) {
  const { data } = await gridProxyClient.farms.list({ nameContains: query });
  return data as FarmInfo[];
}

export function normalizeNodeOptions(
  gridStore: ReturnType<typeof useGrid>,
  location: SelectedLocation | undefined,
  pagination: ReturnType<typeof usePagination>,
  farm: FarmInfo | undefined,
): NormalizeNodeFiltersOptions {
  return {
    size: window.env.PAGE_SIZE,
    page: pagination.value.page,
    location: location || {},
    twinId: gridStore.client?.twinId,
    farm,
  };
}

export function normalizeNodeFilters(
  filters: SelectionDetailsFilters,
  options: NormalizeNodeFiltersOptions,
): FilterOptions {
  return {
    page: Math.max(1, options.page),
    size: options.size,
    farmId: options.farm?.farmId,
    cru: filters.cpu,
    mru: filters.memory ? Math.round(filters.memory / 1024) : undefined,
    hru: (filters.hddDisks || []).reduce((t, d) => t + d, 0) || undefined,
    sru:
      (filters.ssdDisks || []).reduce(
        (t, s) => t + s,
        (filters.solutionDisk ?? 0) + (filters.rootFilesystemSize ?? 0),
      ) || undefined,
    publicIPs: filters.ipv4 || undefined,
    hasIPv6: filters.ipv6 || undefined,
    hasGPU: filters.hasGPU || undefined,
    rentedBy: filters.dedicated ? options.twinId : undefined,
    certified: filters.certified || undefined,
    availableFor: options.twinId,
    region: options.location.region ? options.location.region : options.location.subregion,
    country: options.location.country,
    gateway: options.gateway,
    healthy: true,
  };
}

export function loadNodes(gridStore: ReturnType<typeof useGrid>, filters: FilterOptions) {
  return gridStore.client.capacity.filterNodes(filters);
}

export async function validateRentContract(
  gridStore: ReturnType<typeof useGrid>,
  node: NodeInfo | undefined | null,
): Promise<true> | never {
  if (!node || !node.nodeId) {
    throw "Node ID is required.";
  }

  try {
    if (node.rentContractId !== 0) {
      const contractInfo = await gridStore.grid.contracts.get({
        id: node.rentContractId,
      });
      if (contractInfo.state.gracePeriod) {
        createCustomToast(
          `You can't deploy on node ${node.nodeId}, its rent contract is in grace period.`,
          ToastType.danger,
        );
      }
    }

    return true;
  } catch (error) {
    const err = normalizeError(
      error,
      "Something went wrong while checking status of the node. Please check your connection and try again.",
    );
    throw err;
  }
}

export function release(lock?: AwaitLock) {
  if (lock?.acquired) {
    lock.release();
    return true;
  }
  return false;
}

export async function loadValidNodes(
  gridStore: ReturnType<typeof useGrid>,
  selectionFitlers: SelectionDetailsFilters,
  filters: FilterOptions,
  pagination: ReturnType<typeof usePagination>,
  nodesLock?: AwaitLock,
): Promise<NodeInfo[]> {
  if (nodesLock) {
    await nodesLock.acquireAsync();
  }
  return _loadValidNodes(gridStore, selectionFitlers, filters, pagination);
}

async function _loadValidNodes(
  gridStore: ReturnType<typeof useGrid>,
  selectionFitlers: SelectionDetailsFilters,
  filters: FilterOptions,
  pagination: ReturnType<typeof usePagination>,
): Promise<NodeInfo[]> {
  let page = pagination.value.page;

  while (page !== -1) {
    const nodes = await loadNodes(gridStore, { ...filters, page });
    const checks = await Promise.allSettled(nodes.map(n => checkNodeCapacityPool(gridStore, n, selectionFitlers)));
    const validNodes = checks.map((c, i) => (c.status === "fulfilled" ? nodes[i] : null)).filter(Boolean) as NodeInfo[];

    if (validNodes.length > 0) {
      return validNodes;
    }

    page = pagination.value.next();
  }

  return [];
}

type GetFarmFn = (farmId: number) => Farm | undefined;
export function isNodeValid(
  getFarm: GetFarmFn,
  node: NodeInfo,
  machines: SelectedMachine[],
  filters: FilterOptions,
): boolean {
  const machinesWithSameNode = machines.filter(m => m.nodeId === node.nodeId);
  const requiredMru = (filters.mru ?? 0) * 1e9;
  const requiredSru = (filters.sru ?? 0) * 1e9;

  let mru = node.total_resources.mru - node.used_resources.mru;
  let sru = node.total_resources.sru - node.used_resources.sru;
  for (const machine of machinesWithSameNode) {
    mru -= machine.memory * 1e9;
    sru -= machine.disk * 1e9;
  }

  let valid = mru >= requiredMru && sru >= requiredSru;

  if (valid && filters.publicIPs) {
    const ipsCount = machines.filter(m => m.publicIp && m.farmId === node.farmId).length + 1;
    if (ipsCount > 1) {
      const farm = getFarm(node.farmId);
      if (farm) {
        valid &&= farm.publicIps.filter(ip => ip.contract_id === 0).length >= ipsCount;
      }
    }
  }

  return valid;
}

export async function selectValidNode(
  gridStore: ReturnType<typeof useGrid>,
  getFarm: GetFarmFn,
  nodes: NodeInfo[],
  selectedMachines: SelectedMachine[],
  filters: FilterOptions,
  oldSelectedNodeId?: number,
  nodesLock?: AwaitLock,
): Promise<NodeInfo | void> {
  const locked = true;

  const rentedNodes = nodes.filter(n => {
    return n.rentedByTwinId === gridStore.grid.twinId;
  });
  let rentedNode;
  for (const node of rentedNodes) {
    if (node.rentedByTwinId === gridStore.grid.twinId) {
      const contractInfo = await gridStore.grid.contracts.get({
        id: node.rentContractId,
      });

      if (!contractInfo.state.gracePeriod) {
        rentedNode = node;
        break;
      }
    }
  }

  if (oldSelectedNodeId || rentedNode) {
    const node = nodes.find(n => n.nodeId === oldSelectedNodeId) || rentedNode;

    if (node && isNodeValid(getFarm, node, selectedMachines, filters)) {
      if (nodesLock && !locked) {
        release(nodesLock);
      }
      return node;
    }
  }

  for (const node of shuffle(nodes)) {
    if (isNodeValid(getFarm, node, selectedMachines, filters)) {
      if (nodesLock && !locked) {
        release(nodesLock);
      }
      return node;
    }
  }

  if (nodesLock && !locked) {
    release(nodesLock);
  }
}

export async function getNodePageCount(gridStore: ReturnType<typeof useGrid>, filters: FarmFilterOptions) {
  const clonedFilter = { ...filters };
  clonedFilter.size = 0;
  const count = await gridStore.client.capacity.getNodesCount(clonedFilter);
  return Math.ceil(count / window.env.PAGE_SIZE);
}

export async function getNodeGpuCards(gridStore: ReturnType<typeof useGrid>, node: NodeInfo) {
  // cards might return as null if not supported or something went wrong
  const cards = await gridStore.client.zos.getNodeGPUInfo(node);
  return cards || [];
}

export async function resolveAsync<T>(promise: Promise<T>): Promise<[T, null]>;
export async function resolveAsync<T, E>(promise: Promise<T>): Promise<[null, E]>;
export async function resolveAsync(promise: Promise<any>): Promise<any> {
  try {
    return [await promise, null];
  } catch (error) {
    return [null, error];
  }
}

function normalizeNumericValidator(
  validator: DeepPartial<NumericValidator> = {},
  fallback: NumericValidator,
): NumericValidator {
  return {
    type: validator.type || fallback.type,
    min: validator.min || fallback.min,
    max: validator.max || fallback.max,
  };
}

function normalizeFiltersValidators(
  validators: DeepPartial<SelectionDetailsFiltersValidators>,
): SelectionDetailsFiltersValidators {
  return {
    cpu: normalizeNumericValidator(validators.cpu, {
      type: "int",
      min: 1,
      max: 32,
    }),
    memory: normalizeNumericValidator(validators.memory, {
      type: "int",
      min: 256,
      max: 262144,
    }),
    ssdDisks: normalizeNumericValidator(validators.ssdDisks, {
      type: "int",
      min: 1,
      max: 10000,
    }),
    hddDisks: normalizeNumericValidator(validators.hddDisks, {
      type: "int",
      min: 1,
      max: 10000,
    }),
    rootFilesystemSize: normalizeNumericValidator(validators.rootFilesystemSize, {
      type: "number",
      min: 500 / 1024,
      max: 10000,
    }),
    solutionDisk: normalizeNumericValidator(validators.solutionDisk, {
      type: "int",
      min: 15,
      max: 10000,
    }),
  };
}

function createNumericValidator(validator: NumericValidator): z.ZodNumber {
  const v = z.number().min(validator.min).max(validator.max);

  if (validator.type === "number") {
    return v;
  }

  return v.int();
}

export function createSelectionDetailsFiltersValidator(validators: DeepPartial<SelectionDetailsFiltersValidators>) {
  const vts = normalizeFiltersValidators(validators);

  return z.object({
    ipv4: z.boolean().optional(),
    ivp6: z.boolean().optional(),
    hasGPU: z.boolean().optional(),
    certified: z.boolean().optional(),
    dedicated: z.boolean().optional(),
    exclusiveFor: z.string().optional(),

    cpu: createNumericValidator(vts.cpu),
    memory: createNumericValidator(vts.memory),
    ssdDisks: z.array(createNumericValidator(vts.ssdDisks)).optional(),
    hddDisks: z.array(createNumericValidator(vts.hddDisks)).optional(),
    rootFilesystemSize: createNumericValidator(vts.rootFilesystemSize).optional(),
    solutionDisk: createNumericValidator(vts.solutionDisk).optional(),
  });
}

export async function checkNodeCapacityPool(
  gridStore: ReturnType<typeof useGrid>,
  node: NodeInfo | undefined | null,
  filters: SelectionDetailsFilters,
): Promise<true> | never {
  if (!node || !node.nodeId) {
    throw "Node ID is required.";
  }

  try {
    await gridStore.client.capacity.checkNodeCapacityPool({
      nodeId: node.nodeId,
      ssdDisks: [filters.solutionDisk ?? 0, ...(filters.ssdDisks || [])].filter(Boolean).map(disk => disk * 1024 ** 3),
      rootfsDisks: [(filters.rootFilesystemSize ?? 0) * 1024 ** 3],
      hddDisks: filters.hddDisks || [],
    });
    return true;
  } catch (error) {
    const err = normalizeError(
      error,
      "Something went wrong while checking status of the node. Please check your connection and try again.",
    );

    if (error instanceof GridClientErrors.Nodes.DiskAllocationError) {
      throw (
        "Although node " +
        node.nodeId +
        " appears to have sufficient storage capacity for your workload, it lacks a single internal " +
        "partition capable of accommodating it. Please select a different node."
      );
    }

    throw err;
  }
}
