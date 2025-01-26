<template>
  <weblet-layout ref="layout" @mount="() => {}">
    <v-data-table-server
      v-if="$props.tableHeaders"
      :headers="$props.tableHeaders"
      :loading="$props.loading.value || deleting"
      loading-text="Loading contracts..."
      v-model="selectedContracts"
      :deleting="deleting"
      v-bind:onClick:row="loading || deleting ? undefined : onClickRow"
      :no-data-text="capitalize(`No ${props.contractsType} contracts found on your account.`)"
      class="elevation-1 v-data-table-header"
      density="compact"
      :items-length="$props.count.value"
      :items-per-page="$props.size.value"
      :page="$props.page.value"
      :items="contracts.value"
      :items-per-page-options="[
        { value: 5, title: '5' },
        { value: 10, title: '10' },
        { value: 20, title: '20' },
        { value: 50, title: '50' },
      ]"
      return-object
      show-select
      @update:page="updatePage"
      @update:items-per-page="updateSize"
      @update:sort-by="updateSortBy"
    >
      <template #[`item.nodeId`]="{ item }">
        <span v-if="['node', 'rent'].includes(item.type)">{{ item.details.nodeId }}</span>
      </template>

      <template #[`item.created_at`]="{ item }">
        {{ toHumanDate(item.created_at) }}
      </template>

      <template #[`item.consumption`]="{ item }">
        <div
          v-if="item?.consumption !== 0 && item?.consumption !== undefined"
          class="d-flex justify-center align-center"
        >
          <p class="mr-2 text-no-wrap" cols="8">{{ item.consumption.toFixed(3) }} TFT/hour</p>

          <v-tooltip bottom color="primary" close-delay="100" v-if="item.discountPackage" cols="2">
            <template v-slot:activator="{ props }">
              <v-icon class="scale_beat" color="warning" v-bind="props">mdi-brightness-percent</v-icon>
            </template>

            <span>
              {{ item.discountPackage }}
            </span>
          </v-tooltip>
        </div>

        <p v-else>No Data Available</p>
      </template>

      <template #[`item.farm_id`]="{ item }">
        <span v-if="['node', 'rent'].includes(item.type)">
          {{ item.details.farm_id ? item.details.farm_id : "-" }}
        </span>
      </template>

      <template #[`item.solutionType`]="{ item }">
        <span v-if="item.type === 'node'">
          {{ item.solutionType }}
        </span>
      </template>

      <template #[`item.nodeStatus`]="{ item }">
        <v-chip
          v-if="$props.nodeStatus && !$props.loading.value"
          :color="getNodeStateColor($props.nodeStatus[item.details.nodeId])"
          class="text-capitalize"
        >
          {{ $props.nodeStatus[item.details.nodeId] }}
        </v-chip>
        <p v-else>-</p>
      </template>

      <template #[`item.state`]="{ item }">
        <v-tooltip
          v-if="item && item.state === ContractStates.GracePeriod && loadingShowDetails && item == selectedItem"
          :text="'Click here to check the amount of tokens needed to unlock your contract and resume your workload.'"
          location="top center"
        >
          <template #activator="{ props }">
            <VProgressCircular v-bind="props" :color="getStateColor(item.state)" indeterminate size="20" width="3" />
          </template>
        </v-tooltip>
        <v-tooltip
          v-else-if="item && item.state === ContractStates.GracePeriod"
          :text="'Click here to check the amount of tokens needed to unlock your contract and resume your workload.'"
          location="top center"
        >
          <template #activator="{ props }">
            <v-chip
              @click.stop="contractLockDetails(item as unknown as Contract)"
              v-bind="props"
              :color="getStateColor(item.state)"
            >
              {{ item.state === ContractStates.GracePeriod ? "Grace Period" : item.state }}
            </v-chip>
          </template>
        </v-tooltip>
        <v-chip v-else :color="getStateColor(item.state)">
          {{ item.state }}
        </v-chip>
      </template>

      <template #[`item.actions`]="{ item }">
        <v-tooltip :text="failedContractId == item.contract_id ? 'Retry' : 'Show Details'">
          <template #activator="{ props }">
            <v-btn
              :color="failedContractId == item.contract_id ? 'error' : ''"
              variant="tonal"
              @click="showDetails(item)"
              :disabled="(loadingShowDetails && loadingContractId !== item.contract_id) || deleting"
              :loading="loadingContractId == item.contract_id"
              v-bind="props"
            >
              <v-icon class="pt-1" v-if="failedContractId == item.contract_id">mdi-refresh</v-icon>
              <v-icon v-else>mdi-eye-outline</v-icon>
            </v-btn>
          </template>
        </v-tooltip>
      </template>
    </v-data-table-server>

    <template #footer-actions>
      <v-btn
        v-if="Object.keys(props.lockedContracts).length > 0"
        :disabled="!selectedLockedContracts"
        color="warning"
        @click="openUnlockDialog"
        >Unlock</v-btn
      >

      <v-btn
        color="anchor"
        prepend-icon="mdi-export-variant"
        :disabled="isExporting || !contracts || contracts.value.length === 0 || loading.value"
        @click="exportData"
      >
        Export
      </v-btn>

      <v-btn
        color="error"
        :disabled="!selectedContracts.length || deleting"
        :loading="deleting"
        prepend-icon="mdi-trash-can-outline"
        @click="deletingDialog = true"
      >
        Delete
      </v-btn>
    </template>
  </weblet-layout>

  <v-dialog width="800" v-model="contractStateDialog" attach="#modals">
    <v-card>
      <v-card-title class="bg-primary"> Contract lock Details </v-card-title>
      <v-card-text class="mt-5">
        <p v-if="!isNodeInRentContracts" class="d-flex justify-center">
          Amount Locked:
          {{ getAmountLocked }}
          TFTs.
        </p>
        <v-alert v-if="isNodeInRentContracts" class="my-4" type="warning" variant="tonal">
          This contract is in a grace period because it's on a dedicated machine also in a grace period. Check its rent
          contract <span class="font-weight-black">{{ rentContracts[selectedItem.details.nodeId] }}</span>
        </v-alert>

        <v-alert class="mt-4" type="info" variant="tonal"
          >The Contracts in Grace Period, which means that your workloads are suspended but not deleted; in order to
          resume your workloads and restore their functionality for up to one hour, Please fund your account with the
          amount mentioned above.</v-alert
        >
        <v-divider class="mt-3" />
      </v-card-text>
      <v-card-actions class="justify-end mb-1 mr-2">
        <v-btn color="anchor" class="mr-2 px-3" @click="contractStateDialog = false"> Close </v-btn>
        <v-tooltip
          :text="
            freeBalance < getAmountLocked
              ? `You don't have enough balance to unlock this contract`
              : `Unlock this contract from the grace period state.`
          "
          location="top center"
        >
          <template #activator="{ props }">
            <div v-bind="props">
              <v-btn
                v-if="!isNodeInRentContracts"
                :disabled="freeBalance < getAmountLocked || loadingShowDetails"
                color="warning"
                class="mr-2 px-3"
                @click="unlockContract([selectedItem.contract_id])"
                :loading="unlockContractLoading"
              >
                Unlock Contract
              </v-btn>
            </div>
          </template>
        </v-tooltip>
      </v-card-actions>
    </v-card>
  </v-dialog>

  <v-dialog width="800" v-model="deletingDialog" attach="#modals">
    <v-card>
      <v-card-title class="bg-primary"> Delete the following contracts? </v-card-title>
      <v-alert class="ma-4" type="warning" variant="tonal"
        >It is advisable to remove the contract from its solution page, especially when multiple contracts may be linked
        to the same instance.</v-alert
      >

      <v-alert class="mx-4" type="warning" variant="tonal">Deleting contracts may take a while to complete.</v-alert>
      <v-card-text>
        <v-chip class="ma-1" label v-for="c in selectedContracts" :key="c.contract_id">
          {{ c.contract_id }}
        </v-chip>
        <v-divider class="mt-3" />
      </v-card-text>
      <v-card-actions class="justify-end mb-1 mr-2">
        <v-btn color="anchor" @click="deletingDialog = false"> Cancel </v-btn>
        <v-btn color="error" @click="onDelete"> Delete </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>

  <v-dialog width="800" v-model="unlockDialog" attach="#modals">
    <v-card>
      <v-card-title class="bg-primary">
        Unlock the following Contract<span v-if="selectedContracts.length > 1">s</span>
      </v-card-title>
      <v-card-text v-if="loadingShowDetails" class="d-flex flex-column justify-center align-center pb-0 pt-6">
        <v-progress-circular indeterminate />

        <div class="text-subtitle-2 pt-2">Loading contracts lock details</div>
        <v-divider class="mt-3" />
      </v-card-text>
      <v-card-text v-else>
        <v-alert class="my-4" type="warning" variant="tonal">
          <div v-if="selectedLockedAmount <= freeBalance">
            You have enough balance to unlock your contract<span v-if="selectedContracts.length > 1">s</span>; this will
            cost you around {{ Math.ceil(selectedLockedAmount) }} TFTs.
          </div>
          <div v-else-if="selectedLockedAmount > 0">
            <div>
              Please fund your account with
              <span class="font-weight-bold">{{ Math.ceil(selectedLockedAmount - freeBalance) }} TFTs</span>
              to resume {{ selectedContracts.length > 1 ? "those contracts" : "this contract" }}.
            </div>
            <div>
              Note that this amount will allow you to resume the contracts for up to one hour only. Make sure to
              complete the funding promptly to avoid any interruptions!
            </div>
          </div>
        </v-alert>
        <v-chip class="ma-1" label v-for="c in selectedContracts" :key="c.contract_id">
          {{ c.contract_id }}
        </v-chip>
        <v-tooltip text="Rent contract associated with some of the selected contracts" location="top center">
          <template #activator="{ props }">
            <v-chip v-bind="props" class="ma-1" color="default" label v-for="id in selectedRentContracts" :key="id">
              {{ id }}
            </v-chip>
          </template>
        </v-tooltip>

        <v-divider class="mt-3" />
      </v-card-text>
      <v-card-actions class="justify-end mb-1 mr-2">
        <v-btn color="anchor" @click="unlockDialog = false"> Cancel </v-btn>
        <v-tooltip
          :text="
            freeBalance < selectedLockedAmount
              ? `You don't have enough balance to unlock your contract${selectedContracts.length > 1 ? `s` : ``}`
              : `Unlock your contract${selectedContracts.length > 1 ? `s` : ``} from the grace period state.`
          "
          location="top center"
        >
          <template #activator="{ props }">
            <div v-bind="props">
              <v-btn
                :disabled="selectedLockedAmount > freeBalance || loadingShowDetails"
                color="warning"
                class="ml-2"
                :loading="unlockContractLoading"
                @click="unlockContract([...selectedContracts.map(contract => contract.contract_id)])"
              >
                Unlock
              </v-btn>
            </div>
          </template>
        </v-tooltip>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script lang="ts" setup>
// Import necessary types and libraries
import { ContractStates, discountPackages, type GridClient, type OverdueDetails } from "@threefold/grid_client";
import { type Contract, ContractState, type NodeStatus } from "@threefold/gridproxy_client";
import { TFChainError } from "@threefold/tfchain_client";
import { DeploymentKeyDeletionError } from "@threefold/types";
import { capitalize, computed, defineComponent, type PropType, type Ref, ref, watch } from "vue";

import { useProfileManagerController } from "@/components/profile_manager_controller.vue";
import type { VDataTableHeader } from "@/types";
import { ContractType, getNodeStateColor, getStateColor, type NormalizedContract } from "@/utils/contracts";
import { createCustomToast, ToastType } from "@/utils/custom_toast";
import toHumanDate from "@/utils/date";
import { downloadAsJson, normalizeError } from "@/utils/helpers";

import { gridProxyClient } from "../../clients";

const props = defineProps({
  contracts: {
    type: Object as PropType<Ref<NormalizedContract[]>>,
    required: true,
  },
  nodeStatus: {
    type: Object as PropType<{ [x: number]: NodeStatus }>,
    required: true,
  },
  grid: {
    type: Object as PropType<GridClient>,
    required: true,
  },
  loading: {
    type: Object as PropType<Ref<boolean>>,
    required: true,
  },
  tableHeaders: {
    type: Array as PropType<VDataTableHeader>,
    required: false,
  },
  contractsType: {
    type: Object as PropType<ContractType>,
    required: true,
  },
  lockedContracts: {
    type: Object as PropType<OverdueDetails>,
    required: true,
  },
  size: {
    required: true,
    type: Object as PropType<Ref<number>>,
  },
  page: {
    required: true,
    type: Object as PropType<Ref<number>>,
  },
  count: {
    required: true,
    type: Object as PropType<Ref<number>>,
  },
});
const getAmountLocked = computed(() => {
  const amountLocked = selectedLockedAmount?.value ?? 0;
  return amountLocked > 0 ? parseFloat(amountLocked.toFixed(3)) : 0;
});

const isNodeInRentContracts = computed(() => {
  if (selectedItem.value && selectedItem.value.type == ContractType.Node) {
    return !!rentContracts.value[selectedItem.value.details.nodeId];
  }
  return false;
});

const emits = defineEmits([
  "update:deleted-contracts",
  "update:unlock-contracts",
  "update:page",
  "update:size",
  "update:sort",
]);

function updatePage(page: number) {
  emits("update:page", page);
}

function updateSize(size: number) {
  emits("update:size", size);
}

function updateSortBy(sort: { key: string; order: "asc" | "desc" }[]) {
  emits("update:sort", sort);
}

const layout = ref();
const deleting = ref<boolean>(false);
const loadingShowDetails = ref<boolean>(false);
const contractStateDialog = ref<boolean>(false);
const isExporting = ref<boolean>(false);
const deletingDialog = ref<boolean>(false);
const failedContractId = ref<number>();
const loadingContractId = ref<number>();
const selectedContracts = ref<NormalizedContract[]>([]);
const selectedItem = ref();
const profileManagerController = useProfileManagerController();
const balance = profileManagerController.balance;
const freeBalance = computed(() => balance.value?.free ?? 0);
const unlockContractLoading = ref(false);
const unlockDialog = ref(false);
const rentContracts = ref<{ [key: number]: number }>({}); // to store the node id with its rent contract
const selectedLockedContracts = computed(() => {
  if (selectedContracts.value.length == 0) return false;
  for (const contract of selectedContracts.value) {
    if (contract.state != ContractStates.GracePeriod) return false;
  }
  return true;
});

/**This computed value is an array of the rent contract of the selected node contracts */
const selectedRentContracts = computed(() => {
  const contractsSet = new Set<number>();
  selectedContracts.value.forEach(contract => {
    const rentContract = rentContracts.value[contract.details.nodeId];
    if (contract.type == ContractType.Node && rentContract) {
      contractsSet.add(rentContract);
    }
  });

  return Array.from(contractsSet);
});
const selectedLockedAmount = ref(0);
// Function to show details of a contract
async function showDetails(value: any) {
  failedContractId.value = undefined;
  if (value.type === ContractType.Name || value.type === ContractType.Rent) {
    return layout.value.openDialog(value, false, true);
  }

  loadingShowDetails.value = true;
  const contractId: number = value.contract_id;
  loadingContractId.value = contractId;

  try {
    const deployment = await props.grid?.zos.getDeployment({ contractId });
    return layout.value.openDialog(deployment, false, true);
  } catch (e) {
    failedContractId.value = contractId;
    createCustomToast(`Failed to load details of contract ID: ${contractId}`, ToastType.danger);
  } finally {
    loadingContractId.value = undefined;
    loadingShowDetails.value = false;
  }
}

async function openUnlockDialog() {
  loadingShowDetails.value = true;
  unlockDialog.value = true;
  selectedLockedAmount.value = 0;

  const _rentedNodes = new Set();
  try {
    // get actual locked amount
    for (const contract of selectedContracts.value) {
      const nodeId = contract.details.nodeId;

      let rentContract = 0;
      if (contract.type == ContractType.Node && !_rentedNodes.has(nodeId)) {
        if (rentContracts.value[nodeId]) rentContract = rentContracts.value[nodeId];
        else {
          // check the rent contract status, if in grace period  the total cost will be shown there
          const res = await gridProxyClient.contracts.list({
            nodeId: contract.details.nodeId,
            type: ContractType.Rent,
            state: [ContractState.Created, ContractState.GracePeriod],
          });
          if (res.data[0] && res.data[0].state == ContractState.GracePeriod) rentContract = res.data[0].contract_id;
        }
      }
      if (rentContract) {
        rentContracts.value[nodeId] = rentContract;
        _rentedNodes.add(nodeId); // to avoid duplicated cost
        selectedLockedAmount.value += (await getContractOverdueById(rentContract)) || 0;
      } else {
        const amount = await getContractOverdue(contract as unknown as Contract);
        selectedLockedAmount.value += amount || 0;
      }
    }

    await profileManagerController.reloadBalance();
  } catch (e) {
    createCustomToast("Failed to load contracts lock details, please try again later", ToastType.danger);
    console.log(e);
    unlockDialog.value = false;
  } finally {
    loadingShowDetails.value = false;
  }
}

async function getContractOverdueById(contractId: number) {
  return (await props.grid.contracts.getContractOverdueAmountById(contractId)).toNumber();
}
async function getContractOverdue(contract: Contract) {
  return (await props.grid.contracts.getContractOverdueAmountById(contract.contract_id)).toNumber();
}

// Function to fetch contract lock details
async function contractLockDetails(item: Contract) {
  selectedItem.value = item;
  loadingShowDetails.value = true;
  selectedLockedAmount.value = 0;
  try {
    let rentContract = 0;
    if (item.type == ContractType.Node)
      if (rentContracts.value[item.details.nodeId]) {
        rentContract = rentContracts.value[item.details.nodeId];
      } else {
        const res = await gridProxyClient.contracts.list({
          nodeId: item.details.nodeId,
          type: ContractType.Rent,
          state: [ContractState.Created, ContractState.GracePeriod],
        });
        if (res.data[0] && res.data[0].state == ContractState.GracePeriod) rentContract = res.data[0].contract_id;
      }
    if (rentContract) {
      rentContracts.value[item.details.nodeId] = rentContract;
    } else {
      await profileManagerController.reloadBalance();
      const data = await getContractOverdue(item);
      selectedLockedAmount.value = data;
    }

    contractStateDialog.value = true;
  } catch (err: any) {
    layout.value.setStatus(
      "failed",
      normalizeError(err, `Failed to fetch the contract ${item.contract_id} lock details.`),
    );
    contractStateDialog.value = false;
  } finally {
    loadingShowDetails.value = false;
  }
}

// Function to export contract data as JSON
function exportData() {
  isExporting.value = true;
  downloadAsJson(props.contracts, `${props.contractsType}_contracts`);
  isExporting.value = false;
}

// Function called on clicking a row to show details
const onClickRow = (_: any, data: any) => showDetails(data.item);

// Function to handle contract deletion
async function onDelete() {
  deletingDialog.value = false;
  deleting.value = true;

  try {
    await props.grid?.contracts.batchCancelContracts({
      ids: selectedContracts.value.map(c => c.contract_id),
    });
    const contracts = props.contracts.value.filter(c => !selectedContracts.value.includes(c));
    emits("update:deleted-contracts", contracts);
    selectedContracts.value = [];
  } catch (e) {
    if (e instanceof DeploymentKeyDeletionError) {
      selectedContracts.value = [];
      createCustomToast("Failed to delete some keys, You don't have enough tokens", ToastType.danger);
    } else if (e instanceof TFChainError && e.keyError === "NodeHasActiveContracts") {
      layout.value.setStatus(
        "failed",
        "Some of the chosen rent contracts could not be deleted as there are active contracts linked to the rented node. Please ensure that any active contracts associated with a rented node are removed before attempting to delete its rent contract.",
      );
    } else {
      layout.value.setStatus("failed", normalizeError(e, `Failed to delete some of the selected contracts.`));
    }
  }
  deleting.value = false;
}

// function to unlock grace period contracts
async function unlockContract(contractId: number[]) {
  try {
    unlockContractLoading.value = true;
    let unlockedContracts: number[] = [];

    if (selectedRentContracts.value.length)
      unlockedContracts = await props.grid.contracts.unlockContractsByIds(selectedRentContracts.value);
    contractId = contractId.filter(id => !unlockedContracts.includes(id));
    const billableContractIds = contractId.filter(id => props.lockedContracts[id] !== 0);

    const unbilledContracts = props.contracts.value.filter(contract =>
      billableContractIds.includes(contract.contract_id),
    ) as unknown as Contract[];

    await props.grid.contracts.unlockContractsByIds(unbilledContracts.map(contract => contract.contract_id));

    createCustomToast(
      `Your request to unlock contract ${contractId} has been processed successfully. Changes may take a few minutes to reflect`,
      ToastType.info,
    );
    setTimeout(() => emits("update:unlock-contracts"), 30000);
    contractStateDialog.value = false;
    unlockDialog.value = false;
    selectedContracts.value = [];
  } catch (e) {
    createCustomToast(`Failed to unlock contract ${contractId}`, ToastType.danger);
    console.error(e);
  } finally {
    unlockContractLoading.value = false;
  }
}
watch(contractStateDialog, contractStateDialog => {
  if (!contractStateDialog) selectedItem.value = undefined;
});
defineExpose({
  reset() {
    rentContracts.value = {};
    selectedContracts.value = [];
  },
});
</script>

<script lang="ts">
export default defineComponent({
  name: "TfContractsList",
  components: {},
});
</script>
