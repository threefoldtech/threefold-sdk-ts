<template>
  <!-- Error Alert -->
  <v-alert type="error" variant="tonal" class="mt-2 mb-4" v-if="loadingErrorMessage">
    Error while listing contracts due: {{ loadingErrorMessage }}
  </v-alert>

  <v-alert type="success" variant="tonal" class="mt-2 mb-4" v-if="loadingTablesMessage">
    {{ loadingTablesMessage }}
  </v-alert>

  <!-- Contracts List Card -->
  <v-card color="primary" class="d-flex justify-center items-center mb-4 pa-3 text-center">
    <v-icon size="30" class="pr-3">mdi-file-document-edit</v-icon>
    <v-card-title class="pa-0">Contracts List</v-card-title>
  </v-card>

  <v-alert class="mb-4 text-subtitle-2 font-weight-regular" type="info" variant="tonal">
    For more details about Contract Types, Billing Cycle & Grace Period, check
    <a
      class="app-link font-weight-medium"
      target="_blank"
      href="https://www.manual.grid.tf/documentation/developers/tfchain/tfchain.html"
      >Contract Documentation,
    </a>
    and to explore further contract details, check
    <a
      class="app-link font-weight-medium"
      target="_blank"
      href="https://www.manual.grid.tf/documentation/dashboard/deploy/your_contracts.html"
      >Node Contract Documentation.</a
    >
    <br />
  </v-alert>

  <v-card variant="text" class="my-3">
    <section class="d-flex align-center">
      <v-spacer />
      <v-btn
        v-if="lockedContracts?.totalOverdueAmount && !isLoading"
        class="mr-2"
        color="warning"
        prepend-icon="mdi-lock-open"
        @click="openUnlockDialog"
        :loading="unlockContractLoading"
      >
        Unlock All
      </v-btn>
      <v-btn
        class="mr-2"
        v-if="contracts.length > 0"
        :loading="deleting"
        prepend-icon="mdi-delete"
        color="error"
        @click="deleteDialog = true"
      >
        Delete All
      </v-btn>
      <v-btn
        prepend-icon="mdi-refresh"
        color="info"
        @click="
          contractsTable.forEach(t => t.reset());
          loadContracts();
        "
        :disabled="totalCost === undefined"
      >
        refresh
      </v-btn>
    </section>
  </v-card>

  <!-- Total Cost Card -->
  <v-card :loading="totalCost === undefined" variant="tonal" class="mb-3 bg-blue-primary-lighten-3">
    <template #title>
      <v-row>
        <v-col class="d-flex justify-start">
          <p class="text-subtitle-1">Total cost of contracts</p>
        </v-col>
      </v-row>
    </template>
    <template #text>
      <strong v-if="totalCost != undefined" class="text-primary">
        <input-tooltip
          inline
          :alignCenter="true"
          :tooltip="`${totalCostUSD?.toFixed(3)} USD/hour ≈ ${totalCostUSD === 0 ? 0 : (totalCostUSD! * 24 * 30).toFixed(3)} USD/month`"
        >
          {{ totalCost }} TFT/hour ≈ {{ totalCost === 0 ? 0 : (totalCost * 24 * 30).toFixed(3) }} TFT/month
        </input-tooltip>
      </strong>
      <small v-else> loading total cost... </small>
    </template>
  </v-card>
  <!-- locked amount Dialog -->
  <v-dialog width="800" v-model="unlockDialog" v-if="lockedContracts?.totalOverdueAmount" attach="#modals">
    <v-card>
      <v-card-title class="bg-primary">
        Unlock All Contracts
        <v-tooltip text="Grace period contracts documentation" location="bottom right">
          <template #activator="{ props }">
            <v-btn
              @click.stop
              v-bind="props"
              color="white"
              variant="text"
              icon="mdi-information-outline"
              height="24px"
              width="24px"
              target="_blank"
              :href="manual.contract_locking"
            />
          </template>
        </v-tooltip>
      </v-card-title>
      <v-card-text v-if="loadingLockDetails" class="d-flex flex-column justify-center align-center pb-0 pt-6">
        <v-progress-circular indeterminate />

        <div class="text-subtitle-2 pt">Loading contracts lock details</div>
        <v-divider class="mt-3" />
      </v-card-text>
      <v-card-text v-else>
        <v-alert class="my-4" type="warning" variant="tonal">
          <div v-if="lockedContracts?.totalOverdueAmount < freeBalance">
            You have enough balance to unlock your contracts, this will cost you around
            <span class="font-weight-bold">{{ Math.ceil(lockedContracts?.totalOverdueAmount) }}</span> TFTs.
          </div>
          <div v-else>
            <div>
              Please fund your account with
              <span class="font-weight-bold">
                {{ Math.ceil(lockedContracts?.totalOverdueAmount - freeBalance) }}
                TFTs
              </span>
            </div>
            Note that this amount will allow you to resume the contracts for up to one hour only. Make sure to complete
            the funding promptly to avoid any interruptions!
          </div>
        </v-alert>
        <v-divider class="mt-3" />
      </v-card-text>
      <v-card-actions class="justify-end mb-1 mr-2">
        <v-btn color="anchor" @click="unlockDialog = false"> Close </v-btn>
        <v-tooltip
          :text="
            freeBalance < lockedContracts?.totalOverdueAmount
              ? `You don't have enough balance to unlock your contracts`
              : `Get your contracts ready again`
          "
          location="top center"
        >
          <template #activator="{ props }">
            <div v-bind="props">
              <v-btn
                :disabled="freeBalance < lockedContracts.totalOverdueAmount || loadingLockDetails"
                color="warning"
                @click="unlockAllContracts"
                :loading="unlockContractLoading"
                class="ml-2"
              >
                Unlock contracts
              </v-btn>
            </div>
          </template>
        </v-tooltip>
      </v-card-actions>
    </v-card>
  </v-dialog>

  <!-- delete all dialog-->
  <v-dialog width="800" v-model="deleteDialog" attach="#modals">
    <v-card>
      <v-card-title class="bg-primary"> Delete all your contracts </v-card-title>
      <v-alert class="mx-4 mt-4" type="warning" variant="tonal">
        <template v-slot:prepend>
          <v-icon class="pt-4" icon="$warning"></v-icon>
        </template>
        <div>You are about to permanently delete all contracts. This action cannot be reversed!</div>
        <div>Deleting contracts may take a while to complete.</div>
      </v-alert>
      <v-card-actions class="justify-end my-1 mr-2">
        <v-btn color="anchor" @click="deleteDialog = false"> Cancel </v-btn>
        <v-btn color="error" @click="deleteAll"> Delete </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
  <!-- Contracts Tables -->
  <v-expansion-panels v-model="panel" multiple>
    <v-expansion-panel class="mb-4" :elevation="3" v-for="(table, idx) of contractsTables" :key="idx">
      <v-expansion-panel-title color="primary" style="height: 40px !important; min-height: 15px !important">
        <v-icon size="24" class="pr-3">{{ table.icon }}</v-icon>
        <v-card-title class="pa-0 text-subtitle-1">
          <strong>{{ table.title }}</strong>
        </v-card-title>
      </v-expansion-panel-title>
      <v-expansion-panel-text>
        <!-- Contracts Table Component -->
        <contracts-table
          ref="contractsTable"
          :node-status="nodeStatus"
          :loading="table.loading"
          :contracts="table.contracts"
          :locked-contracts="lockedContracts !== undefined ? lockedContracts[`${table.type}Contracts`] : {}"
          :grid="table.grid"
          :contracts-type="table.type"
          :table-headers="table.headers"
          :count="table.count"
          :page="table.page"
          :size="table.size"
          @update:unlock-contracts="loadContracts"
          @update:deleted-contracts="onDeletedContracts"
          @update:lock-details="getContractsLockDetails"
          @update:page="
            newPage => {
              table.page.value = newPage;
              loadContracts(table.type);
            }
          "
          @update:size="
            newSize => {
              table.size.value = newSize;
              loadContracts(table.type);
            }
          "
          @update:sort="
            sort => {
              loadContracts(table.type, { sort });
            }
          "
        />
      </v-expansion-panel-text>
    </v-expansion-panel>
  </v-expansion-panels>
</template>

<script lang="ts" setup>
import type { ContractsOverdue, GridClient } from "@threefold/grid_client";
import { type Contract, ContractState, NodeStatus, SortByContracts, SortOrder } from "@threefold/gridproxy_client";
import { DeploymentKeyDeletionError } from "@threefold/types";
import { Decimal } from "decimal.js";
import { computed, defineComponent, onMounted, type Ref, ref } from "vue";

import ContractsTable from "@/components/contracts_list/contracts_table.vue";
import { useProfileManagerController } from "@/components/profile_manager_controller.vue";
import { useProfileManager } from "@/stores/profile_manager";
import type { VDataTableHeader } from "@/types";
import {
  type ContractsTableType,
  ContractType,
  getNodeInfo,
  normalizeContract,
  type NormalizedContract,
} from "@/utils/contracts";
import { createCustomToast, ToastType } from "@/utils/custom_toast";
import { normalizeError } from "@/utils/helpers";
import { manual } from "@/utils/manual";

import { gridProxyClient, queryClient } from "../clients";
import { useGrid } from "../stores";

const profileManagerController = useProfileManagerController();
const balance = profileManagerController.balance;
const freeBalance = computed(() => balance.value?.free ?? 0);
const isLoading = ref<boolean>(false);

const profileManager = useProfileManager();
const gridStore = useGrid();
const grid = gridStore.client as GridClient;

const contracts = ref<NormalizedContract[]>([]);
const failedContracts = ref<number[]>([]);
const nameContracts = ref<NormalizedContract[]>([]);
const nodeContracts = ref<NormalizedContract[]>([]);
const rentContracts = ref<NormalizedContract[]>([]);

const loadingErrorMessage = ref<string>();
const loadingTablesMessage = ref<string>();

const totalCost = ref<number>();
const totalCostUSD = ref<number>();
const lockedContracts = ref<ContractsOverdue>();
const unlockDialog = ref<boolean>(false);
const deleteDialog = ref<boolean>(false);
const deleting = ref<boolean>(false);

const panel = ref<number[]>([0, 1, 2]);
const nodeInfo: Ref<{ [nodeId: number]: { status: NodeStatus; farmId: number } }> = ref({});
const unlockContractLoading = ref<boolean>(false);
const contractsTable = ref<(typeof ContractsTable)[]>([]);
const loadingLockDetails = ref(false);
// Computed property to get unique node IDs from contracts
const nodeIDs = computed(() => {
  return [...new Set(contracts.value.map(contract => contract.details.nodeId) || [])];
});
// To avoid multiple requests
const cachedNodeIDs = ref<number[]>([]);

onMounted(loadContracts);

async function _normalizeContracts(
  contracts: Contract[],
  contractType: ContractType.Node | ContractType.Name | ContractType.Rent,
): Promise<NormalizedContract[]> {
  const normalizedContracts = await Promise.all(
    contracts.map(async contract => {
      try {
        return await normalizeContract(grid, contract, contractType);
      } catch (error) {
        failedContracts.value.push(contract.contract_id);
      }
    }),
  );
  return normalizedContracts.filter(Boolean) as NormalizedContract[];
}

async function loadContractsByType(
  contractType: ContractType.Node | ContractType.Name | ContractType.Rent,
  contractsRef: Ref<NormalizedContract[]>,
  options?: { sort: { key: string; order: "asc" | "desc" }[] },
) {
  const table = contractsTables.find(table => table.type === contractType);
  if (!table) {
    loadingErrorMessage.value = `No table found for contract type: ${contractType}`;
    throw new Error(loadingErrorMessage.value);
  }

  table.loading.value = true;
  try {
    const response = await gridProxyClient.contracts.list({
      twinId: profileManager.profile!.twinId,
      state: [ContractState.Created, ContractState.GracePeriod],
      size: table.size.value,
      page: table.page.value,
      type: contractType,
      retCount: true,
      sortBy: options && options.sort.length ? (options?.sort[0].key as SortByContracts) : undefined,
      sortOrder: options && options.sort.length ? (options?.sort[0].order as SortOrder) : undefined,
    });

    table.count.value = response.count ?? 0;
    const normalizedContracts = await _normalizeContracts(response.data, contractType);
    contractsRef.value = normalizedContracts;
  } catch (error: any) {
    loadingErrorMessage.value = `Error while listing ${contractType} contracts: ${error.message}`;
    createCustomToast(loadingErrorMessage.value, ToastType.danger, {});
  } finally {
    table.loading.value = false;
  }
}

async function loadContracts(type?: ContractType, options?: { sort: { key: string; order: "asc" | "desc" }[] }) {
  lockedContracts.value = undefined;
  totalCost.value = undefined;
  totalCostUSD.value = undefined;
  loadingErrorMessage.value = undefined;
  loadingTablesMessage.value = undefined;
  nodeInfo.value = {};
  contracts.value = [];
  cachedNodeIDs.value = [];
  failedContracts.value = [];
  try {
    if (type) {
      switch (type) {
        case ContractType.Name:
          await loadContractsByType(ContractType.Name, nameContracts, options);
          break;
        case ContractType.Node:
          await loadContractsByType(ContractType.Node, nodeContracts, options);
          break;
        case ContractType.Rent:
          await loadContractsByType(ContractType.Rent, rentContracts, options);
          break;
      }
    } else {
      await Promise.all([
        loadContractsByType(ContractType.Name, nameContracts, options),
        loadContractsByType(ContractType.Node, nodeContracts, options),
        loadContractsByType(ContractType.Rent, rentContracts, options),
      ]);
    }
    const failedContractsLength = failedContracts.value.length;
    if (failedContractsLength > 0)
      loadingErrorMessage.value = `Failed to load details of the following contract${
        failedContractsLength > 1 ? "s" : ""
      }: ${failedContracts.value.join(", ")}.`;
    await getContractsLockDetails();
    contracts.value = [...nodeContracts.value, ...nameContracts.value, ...rentContracts.value];

    // Update the total cost of the contracts.
    await getTotalCost();
    // Get the node info e.g. node status.
    nodeInfo.value = await getNodeInfo(nodeIDs.value, cachedNodeIDs.value);
    cachedNodeIDs.value.push(...nodeIDs.value);
  } catch (error: any) {
    loadingErrorMessage.value = `Error while loading contracts: ${error.message}`;
    createCustomToast(loadingErrorMessage.value, ToastType.danger, {});
  }
}

async function openUnlockDialog() {
  loadingLockDetails.value = true;
  unlockDialog.value = true;
  try {
    await getContractsLockDetails();
    await profileManagerController.reloadBalance();
  } catch (e) {
    loadingErrorMessage.value = `Failed to get contracts lock details`;
    createCustomToast(loadingErrorMessage.value, ToastType.danger, {});
  } finally {
    loadingLockDetails.value = false;
  }
}

async function unlockAllContracts() {
  try {
    unlockContractLoading.value = true;
    await grid.contracts.unlockMyContracts();
    loadingTablesMessage.value =
      "Your request to unlock your contracts has been processed successfully. Changes may take a few minutes to reflect";
    createCustomToast(loadingTablesMessage.value, ToastType.info);
    setTimeout(() => {
      loadContracts();
      loadingTablesMessage.value = undefined;
    }, 30000);
    unlockDialog.value = false;
  } catch (e) {
    loadingErrorMessage.value = `Failed to unlock contract your contracts`;
    createCustomToast(loadingErrorMessage.value, ToastType.danger, {});
  } finally {
    unlockContractLoading.value = false;
    unlockDialog.value = false;
  }
}

async function deleteAll() {
  deleteDialog.value = false;
  deleting.value = true;
  try {
    await grid.contracts.cancelMyContracts();
    loadingTablesMessage.value =
      "The contracts have been successfully deleted. Please note that all tables will be reloaded in 30 seconds.";
    createCustomToast(loadingTablesMessage.value, ToastType.info);
    setTimeout(() => {
      loadContracts();
      loadingTablesMessage.value = undefined;
    }, 30000);
  } catch (e) {
    if (e instanceof DeploymentKeyDeletionError) {
      createCustomToast("Failed to delete some keys, You don't have enough tokens", ToastType.danger);
    } else {
      createCustomToast(normalizeError(e, `Failed to delete some contracts.`), ToastType.danger);
    }
  }
  deleting.value = false;
}
const nodeStatus = computed(() => {
  const statusObject: { [x: number]: NodeStatus } = {};
  for (const nodeId in nodeInfo.value) {
    if (Object.prototype.hasOwnProperty.call(nodeInfo.value, nodeId)) {
      statusObject[nodeId] = nodeInfo.value[nodeId].status;
    }
  }
  return statusObject;
});

// Calculate the total cost of contracts
async function getTotalCost() {
  totalCost.value = 0;
  for (const contract of contracts.value) {
    totalCost.value = +new Decimal(totalCost.value).add(contract.consumption?.valueOf() || 0);
  }
  totalCost.value = +totalCost.value.toFixed(3);
  const TFTInUSD = await queryClient.tftPrice.get();
  totalCostUSD.value = totalCost.value * (TFTInUSD / 1000);
}

// Handle updates when contracts are deleted
async function onDeletedContracts(_contracts: NormalizedContract[]) {
  if (_contracts.length) {
    switch (_contracts[0].type) {
      case ContractType.Name:
        nameContracts.value = _contracts;
        break;
      case ContractType.Rent:
        rentContracts.value = _contracts;
        break;
      case ContractType.Node:
        nodeContracts.value = _contracts;
        break;
    }
  }
  loadingTablesMessage.value =
    "The contracts have been successfully deleted. Please note that all tables will be reloaded in 30 seconds.";
  createCustomToast(loadingTablesMessage.value, ToastType.info);
  setTimeout(() => {
    loadContracts();
    loadingTablesMessage.value = undefined;
  }, 30000);
  await getTotalCost();
  contracts.value = [...rentContracts.value, ...nameContracts.value, ...nodeContracts.value];
  totalCost.value = undefined;
}
async function getContractsLockDetails() {
  lockedContracts.value = await grid.contracts.getTotalOverdue();
}

// Define base table headers for contracts tables
const baseTableHeaders: VDataTableHeader = [
  { title: "PLACEHOLDER", key: "data-table-select" },
  { title: "ID", key: "contract_id", sortable: true },
  { title: "State", key: "state", sortable: false },
  { title: "Billing Rate", key: "consumption", sortable: false },
  { title: "Created At", key: "created_at", sortable: true },
];

// Define specific table headers for each contract type
const nodeTableHeaders: VDataTableHeader = [
  ...baseTableHeaders,
  {
    title: "Solution",
    key: "solution",
    sortable: false,
    children: [
      { title: "Type", key: "solutionType", sortable: false },
      { title: "Name", key: "solutionName", sortable: false },
    ],
  },
  { title: "Type", key: "deploymentType", sortable: false },
  { title: "Expiration", key: "expiration", sortable: false },
  { title: "Farm ID", key: "farm_id", sortable: false },
  {
    title: "Node",
    key: "node",
    sortable: false,
    children: [
      { title: "ID", key: "nodeId", sortable: false },
      { title: "Status", key: "nodeStatus", sortable: false },
    ],
  },
  { title: "Details", key: "actions", sortable: false },
];

const nameTableHeaders: VDataTableHeader = [
  ...baseTableHeaders,
  { title: "Solution Name", key: "solutionName", sortable: false },
  { title: "Expiration", key: "expiration", sortable: false },
  { title: "Details", key: "actions", sortable: false },
];

const RentTableHeaders: VDataTableHeader = [
  ...baseTableHeaders,
  { title: "Farm ID", key: "farm_id", sortable: false },
  {
    title: "Node",
    key: "node",
    sortable: false,
    children: [
      { title: "ID", key: "nodeId", sortable: false },
      { title: "Status", key: "nodeStatus", sortable: false },
    ],
  },
  { title: "Details", key: "actions", sortable: false },
];

// Define contracts tables with their specific configurations
const contractsTables: ContractsTableType[] = [
  {
    headers: nodeTableHeaders,
    type: ContractType.Node,
    contracts: nodeContracts,
    icon: "mdi-file",
    title: "Node Contracts",
    grid: grid,
    loading: ref(false),
    count: ref(0),
    page: ref(1),
    size: ref(5),
  },
  {
    headers: nameTableHeaders,
    type: ContractType.Name,
    contracts: nameContracts,
    icon: "mdi-note-edit-outline",
    title: "Name Contracts",
    grid: grid,
    loading: ref(false),
    count: ref(0),
    page: ref(1),
    size: ref(5),
  },
  {
    headers: RentTableHeaders,
    type: ContractType.Rent,
    contracts: rentContracts,
    icon: "mdi-newspaper-variant",
    title: "Rent Contracts",
    grid: grid,
    loading: ref(false),
    count: ref(0),
    page: ref(1),
    size: ref(5),
  },
];
</script>

<script lang="ts">
// Export the component definition
export default defineComponent({
  name: "TfContractsList",
  components: {},
});
</script>

<style>
@media only screen and (max-width: 600px) {
  .v-expansion-panel-text__wrapper {
    padding: 0px !important;
  }
}
</style>
