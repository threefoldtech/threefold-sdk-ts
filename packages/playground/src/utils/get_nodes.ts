import type { FilterOptions, GridClient, NodeInfo } from "@threefold/grid_client";
import {
  type GridNode,
  type NodesExtractOptions,
  type NodesQuery,
  type NodeStats,
  NodeStatus,
  type Pagination,
} from "@threefold/gridproxy_client";
import { byCountry } from "country-code-lookup";
import { ref } from "vue";

import { gridProxyClient } from "@/clients";
import type { NodeHealthColor, NodeStatusColor, NodeTypeColor } from "@/types";
const requestPageNumber = ref<number>(1);
const offlineNodes = ref<NodeInfo[]>([]);
type NodeFilters = FilterOptions & {
  /**
   * The flat option used to return a list of the ids of the nodes, it'll be like [1, 2, 3] where is the 1, 2 and 3 represent the ids of the nodes.
   * @returns {Promise<number[]>} A Promise that resolves to an array of offline NodeInfo ids.
   */
  flat?: boolean;
};

/**
 * Retrieves nodes from the grid proxy using the grid client with some of filters.
 * If requestPageNumber is 0, returns the existing nodes data,
 * otherwise fetches the next page of nodes and appends it to the result.
 * @param {GridClient | null} grid - The GridClient instance to fetch nodes from.
 * @returns {Promise<NodeInfo[]>} A Promise that resolves to an array of offline NodeInfo objects.
 */

export enum NodeHealth {
  Ok = "ok",
  Init = "init",
  Error = "error",
  Paused = "paused",
}
export interface discountItems {
  name: string;
  discount: string;
  tfts: number;
}
export async function getAllNodes(grid: GridClient | null, options?: NodeFilters): Promise<NodeInfo[] | number[]> {
  const isFlat = options?.flat || false;

  const isLastPage = requestPageNumber.value === 0;

  if (isLastPage) {
    if (isFlat) {
      return offlineNodes.value.map(node => node.nodeId);
    }
    return offlineNodes.value;
  } else {
    const offNodes: NodeInfo[] = await grid!.nodes.filter({
      ...options,
      // status: NodeStatus.down,
      page: requestPageNumber.value,
    });

    if (offNodes.length) {
      offlineNodes.value.push(...offNodes);
      requestPageNumber.value += 1;
    } else {
      // needs to be last page.
      requestPageNumber.value = 0;
    }
  }
  return getAllNodes(grid, options);
}

export const getCountryCode = (node: GridNode): string => {
  if (!node) {
    return "";
  }
  if (!node.country) {
    return "";
  }
  if (node.country.length && node.country.length > 2) {
    const country = byCountry(node.country);
    if (!country) {
      return node.country;
    }
    const countryCode = country.internet;
    if (countryCode !== null && countryCode !== undefined) {
      return countryCode;
    }
  }
  return node.country;
};

/**
 * Get the node status then return the color based on the status type.
 * @param {string} status - the ststus of the node, it should be match one of these statuses [up, standby, down].
 * @returns {NodeStatusColor} - return type of the node status color and status
 */
export const getNodeStatusColor = (status: string): NodeStatusColor => {
  if (status === NodeStatus.Up) {
    return { color: "primary", status: NodeStatus.Up };
  } else if (status === NodeStatus.Standby) {
    return { color: "warning", status: NodeStatus.Standby };
  } else {
    return { color: "error", status: NodeStatus.Down };
  }
};

export const getNodeTypeColor = (dedicated: boolean, rentedByTwinId: number): NodeTypeColor => {
  if (!dedicated) {
    return { color: "success", type: "shared" };
  }
  if (dedicated && rentedByTwinId === 0) {
    return { color: "primary", type: "Rentable" };
  } else {
    return { color: "warning", type: "Rented" };
  }
};

export const getNodeHealthColor = (health: string): NodeHealthColor => {
  if (health == NodeHealth.Ok) {
    return { color: "success", type: NodeHealth.Ok };
  } else if (health == NodeHealth.Init) {
    return { color: "primary", type: NodeHealth.Init };
  } else if (health == NodeHealth.Paused) {
    return { color: "warning", type: NodeHealth.Paused };
  } else {
    return { color: "error", type: NodeHealth.Error };
  }
};

/**
 * Requests a list of nodes from the GridProxyClient.
 *
 * @param {Partial<NodesQuery>} options - The options for querying the nodes.
 * @param {NodeRequestConfig} config - The configuration for the node request.
 * @returns {Promise<Pagination<GridNode[]>>} - A promise that resolves to a pagination object containing the list of nodes.
 */
export async function requestNodes(
  options: Partial<NodesQuery>,
  config: NodesExtractOptions,
): Promise<Pagination<GridNode[]>> {
  try {
    const nodes: Pagination<GridNode[]> = await gridProxyClient.nodes.list(options, config);
    return nodes;
  } catch (error) {
    console.error("An error occurred while requesting nodes:", error);
    throw error;
  }
}

/**
 * Requests a node from GridProxyClient to get its stats.
 * @param {number} nodeId - The node id.
 * @returns {Promise<NodeStats>} - A promise that resolves to an object containing the node stats details.
 */
export async function getNodeStates(nodeId: number): Promise<NodeStats> {
  if (typeof nodeId !== "number" || isNaN(nodeId)) {
    throw new Error("Invalid nodeId");
  }
  const nodeStats: NodeStats = await gridProxyClient.nodes.statsById(nodeId);
  if (nodeStats.system) {
    return nodeStats;
  } else {
    throw new Error(`Failed to retrieve node stats`);
  }
}

/**
 * Requests a node from GridProxyClient.
 * @param {number} nodeId - The node id.
 * @param {NodesExtractOptions} config - The configuration for the node request.
 * @returns {Promise<GridNode>} - A promise that resolves to an object containing the node details.
 */
export async function getNode(nodeId: number, config?: NodesExtractOptions): Promise<GridNode> {
  if (typeof nodeId !== "number" || nodeId <= 0) {
    throw new Error("Invalid nodeId. Expected a positive integer.");
  }

  if (config && typeof config !== "object") {
    throw new Error("Invalid config parameter. Expected an object.");
  }

  try {
    const node: GridNode = await gridProxyClient.nodes.byId(nodeId, config);
    return node;
  } catch (error: any) {
    throw new Error(`Failed to get node: ${error.message}`);
  }
}

/**
 * Convert into bytes.
 * @param {number} resource - The resource in GB.
 * @returns {number} - The resource in Bytes.
 */
export const toBytes = (resource: number | undefined): number => {
  return resource ? resource * 1024 * 1024 * 1024 : 0;
};

export function convert(value: string | undefined) {
  return value ? Math.ceil(toBytes(+value)) : undefined;
}

export const convertToBytes = convert;
