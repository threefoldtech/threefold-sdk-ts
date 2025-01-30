<template>
  <section>
    <VBtn
      variant="tonal"
      color="secondary"
      class="mb-4"
      size="x-large"
      block
      @click="resetPageAndReloadNodes()"
      :loading="pageCountTask.loading || nodesTask.loading"
      :disabled="nodeInputValidateTask.loading || !validFilters"
    >
      Load Nodes
    </VBtn>

    <input-tooltip tooltip="Select a node ID to deploy on." align-center>
      <div class="w-100" :style="{ position: 'relative' }">
        <div class="d-flex my-6 align-center justify-center">
          <v-progress-circular
            indeterminate
            v-if="loadedNodes.length > 0 && (pageCountTask.loading || nodesTask.loading)"
          />
        </div>
        <VCard
          flat
          class="mb-4 border"
          :disabled="!validFilters || filtersUpdated"
          :style="{
            opacity: !validFilters || filtersUpdated ? 0.5 : 1,
            borderWidth: '2px !important',
            borderColor: nodeInputValidateTask.error ? 'rgba(var(--v-theme-error), 0.4) !important' : undefined,
          }"
        >
          <VContainer v-if="loadedNodes.length === 0 && (pageCountTask.loading || nodesTask.loading)">
            <VRow align="center" justify="center" class="pa-4">
              <v-progress-circular indeterminate class="mr-2" />
              Loading Nodes...
            </VRow>
          </VContainer>

          <VContainer v-if="loadedNodes.length === 0 && !(pageCountTask.loading || nodesTask.loading)">
            <VAlert v-if="loadingError" type="error" :text="loadingError" />

            <VAlert v-else type="error" text="No Nodes were found!" />
          </VContainer>

          <div
            ref="nodesContainer"
            :style="{
              maxHeight: '450px',
              paddingBottom: '100px',
              backgroundColor: 'rgb(var(--v-theme-background))',
            }"
            class="overflow-auto px-4"
            v-if="loadedNodes.length"
          >
            <template v-for="(node, index) in loadedNodes" :key="node.id">
              <div class="my-4">
                <TfNodeDetailsCard
                  :key="node.rentedByTwinId"
                  v-model:node="loadedNodes[index]"
                  :selected="!validFilters || filtersUpdated ? false : $props.modelValue === node"
                  selectable
                  @node:select="bindModelValueAndValidate"
                  :status="
                    $props.modelValue === node
                      ? nodeInputValidateTask.loading
                        ? 'Pending'
                        : nodeInputValidateTask.data
                        ? 'Valid'
                        : 'Invalid'
                      : 'Init'
                  "
                />
              </div>
            </template>

            <VContainer v-if="loadedNodes.length > 0 && pagination.page !== -1">
              <VBtn
                @click="reloadNodes()"
                block
                color="secondary"
                variant="tonal"
                size="large"
                :loading="nodesTask.loading"
                prepend-icon="mdi-reload"
                :disabled="nodeInputValidateTask.loading"
              >
                Load More Nodes
              </VBtn>
            </VContainer>
          </div>
        </VCard>

        <VAlert
          :type="!validFilters ? 'error' : 'warning'"
          variant="elevated"
          :style="{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            zIndex: 9,
          }"
          v-if="!validFilters || (filtersUpdated && validFilters)"
        >
          <span v-if="!validFilters" v-text="'Please provide valid data.'" />
          <template v-else>
            Please press on <strong>Load Nodes</strong> button to list nodes matching your new requirements.
          </template>
        </VAlert>

        <VAlert
          type="info"
          variant="elevated"
          :style="{
            position: 'absolute',
            bottom: '31px',
            right: '31px',
            zIndex: 9,
          }"
          v-else-if="nodeInputValidateTask.loading"
          text="Checking if the deployment will fit in the node's disks..."
        />

        <VAlert
          type="error"
          variant="elevated"
          v-if="!filtersUpdated && nodeInputValidateTask.error"
          :style="{
            position: 'absolute',
            bottom: '31px',
            right: '31px',
            zIndex: 9,
          }"
          :text="nodeInputValidateTask.error"
          closable
        />
      </div>
    </input-tooltip>
  </section>
</template>

<script lang="ts">
import type { FarmInfo, FilterOptions, NodeInfo } from "@threefold/grid_client";
import type { Farm } from "@threefold/gridproxy_client";
import { RequestError } from "@threefold/types";
import type AwaitLock from "await-lock";
import equals from "lodash/fp/equals.js";
import { computed, nextTick, onMounted, onUnmounted, type PropType, ref } from "vue";

import { normalizeError } from "@/utils/helpers";

import { useAsync, usePagination, useWatchDeep } from "../../hooks";
import { ValidatorStatus } from "../../hooks/form_validator";
import { useGrid } from "../../stores";
import type { SelectedLocation, SelectedMachine, SelectionDetailsFilters } from "../../types/nodeSelector";
import {
  checkNodeCapacityPool,
  getNodePageCount,
  isNodeValid,
  loadValidNodes,
  normalizeNodeFilters,
  normalizeNodeOptions,
  release,
  selectValidNode,
  validateRentContract,
} from "../../utils/nodeSelector";
import TfNodeDetailsCard from "./TfNodeDetailsCard.vue";
export default {
  name: "TfAutoNodeSelector",
  components: { TfNodeDetailsCard },
  props: {
    modelValue: Object as PropType<NodeInfo>,
    validFilters: { type: Boolean, required: true },
    filters: {
      type: Object as PropType<SelectionDetailsFilters>,
      required: true,
    },
    location: Object as PropType<SelectedLocation>,
    farm: Object as PropType<FarmInfo>,
    status: String as PropType<ValidatorStatus>,
    selectedMachines: {
      type: Array as PropType<SelectedMachine[]>,
      required: true,
    },
    nodesLock: Object as PropType<AwaitLock>,
    loadFarm: { type: Function as PropType<(farmId: number) => Promise<Farm | undefined>>, required: true },
    getFarm: { type: Function as PropType<(farmId: number) => Farm | undefined>, required: true },
  },
  emits: {
    "update:model-value": (node?: NodeInfo) => true || node,
    "update:status": (status: ValidatorStatus) => true || status,
  },
  setup(props, ctx) {
    const gridStore = useGrid();
    const _loadedNodes = ref<NodeInfo[]>([]);
    const loadedNodes = computed(() => {
      return _loadedNodes.value.filter(
        node =>
          node.nodeId === props.modelValue?.nodeId ||
          isNodeValid(props.getFarm, node, props.selectedMachines, filters.value),
      );
    });
    const nodesTask = useAsync(loadValidNodes, {
      shouldRun: () => props.validFilters,
      onBeforeTask() {
        const oldNode = props.modelValue;
        bindModelValue();
        return oldNode?.nodeId;
      },
      async onAfterTask({ data }, oldNodeId: number) {
        _loadedNodes.value = _loadedNodes.value.concat(data as NodeInfo[]);

        await _setValidNode(oldNodeId);
        pagination.value.next();
      },
      default: [],
    });

    async function _setValidNode(oldNodeId?: number) {
      const node = await selectValidNode(
        gridStore,
        props.getFarm,
        _loadedNodes.value,
        props.selectedMachines,
        filters.value,
        oldNodeId,
      );

      if (node) {
        if (node?.dedicated && node.rentContractId === 0) return false;
        await props.loadFarm(node.farmId);
        bindModelValue(node);
        nodeInputValidateTask.value.run(node);
      } else {
        release(props.nodesLock);
      }
    }

    const pageCountTask = useAsync(getNodePageCount, { default: 1, shouldRun: () => props.validFilters });
    const pagination = usePagination();

    const options = computed(() => normalizeNodeOptions(gridStore, props.location, pagination, props.farm));
    const filters = computed(() => normalizeNodeFilters(props.filters, options.value));

    const reloadNodes = () => nodesTask.value.run(gridStore, props.filters, filters.value, pagination, props.nodesLock);
    const loadingError = computed(() => {
      if (!nodesTask.value.error) return "";
      if (nodesTask.value.error instanceof RequestError) return "Failed to fetch nodes due to a network error";
      else return "Something went wrong while getting nodes, please try again later";
    });
    let initialized = false;
    onMounted(async () => {
      initialized = true;
      await resetPageAndReloadNodes();
    });

    const baseFilters = ref<FilterOptions>();
    const filtersUpdated = ref(false);
    useWatchDeep(
      filters,
      async (filters, oldFilters) => {
        if (!initialized) {
          return;
        }

        if (baseFilters.value) {
          if (equals(filters, baseFilters.value)) {
            baseFilters.value = undefined;
            filtersUpdated.value = false;
            props.modelValue && nodeInputValidateTask.value.run(props.modelValue);
            return;
          }

          filtersUpdated.value = true;
          nodeInputValidateTask.value.initialized && nodeInputValidateTask.value.reset();
          return;
        }

        baseFilters.value = oldFilters;
        filtersUpdated.value = !equals(filters, oldFilters);
        filtersUpdated.value && nodeInputValidateTask.value.initialized && nodeInputValidateTask.value.reset();
      },
      { deep: true, ignoreFields: ["page"] },
    );

    async function resetPageAndReloadNodes() {
      bindStatus();
      nodeInputValidateTask.value.reset();
      touched.value = false;
      baseFilters.value = undefined;
      filtersUpdated.value = false;
      await pageCountTask.value.run(gridStore, filters.value);
      pagination.value.reset(pageCountTask.value.data as number);
      await nextTick();
      _loadedNodes.value = [];
      return reloadNodes();
    }

    const nodeInputValidateTask = useAsync<boolean, string, [NodeInfo | undefined]>(
      async node => {
        try {
          if (node && node.rentContractId !== 0) {
            const { state } = await gridStore.grid.contracts.get({
              id: node?.rentContractId,
            });
            if (state.gracePeriod) {
              const err = `You can't deploy on node ${node.nodeId}, its rent contract is in grace period.`;
              await new Promise((_, reject) => {
                setTimeout(() => {
                  reject(Error(err));
                }, 2000);
              });
              console.error(err);
            }
          }
        } catch (error) {
          const err = normalizeError(
            error,
            "Something went wrong while checking status of the node. Please check your connection and try again.",
          );
          throw err;
        }

        const nodeCapacityValid = await checkNodeCapacityPool(gridStore, node, props.filters);
        const rentContractValid = props.filters.dedicated ? await validateRentContract(gridStore, node) : true;

        if (node && !isNodeValid(props.getFarm, node!, props.selectedMachines, filters.value)) {
          throw `Node (${node.nodeId}) is not valid.`;
        }

        return nodeCapacityValid && rentContractValid;
      },
      {
        tries: 1,
        shouldRun: () => props.validFilters,
        onBeforeTask: () => bindStatus(ValidatorStatus.Pending),
        onAfterTask({ data }) {
          release(props.nodesLock);
          bindStatus(data ? ValidatorStatus.Valid : ValidatorStatus.Invalid);
          const container = nodesContainer.value as HTMLDivElement;
          if (container) {
            const card = container.querySelector(".selected-node") as HTMLDivElement;

            if (card && container.getAttribute("data-scrolled") !== "scrolled") {
              container.setAttribute("data-scrolled", "scrolled");
              container.scroll({
                behavior: "smooth",
                top: card.offsetTop - 100,
              });
            }
          }
        },
        onReset: bindStatus,
      },
    );

    const touched = ref(false);
    function bindModelValueAndValidate(node?: NodeInfo) {
      bindModelValue(node);
      (touched.value || node) && nodeInputValidateTask.value.run(node);
    }

    onUnmounted(() => {
      bindModelValue();
      bindStatus();
    });

    function bindModelValue(node?: NodeInfo): void {
      ctx.emit("update:model-value", node);
    }

    onMounted(bindStatus);
    function bindStatus(status?: ValidatorStatus): void {
      ctx.emit("update:status", status || ValidatorStatus.Init);
    }

    const nodesContainer = ref<HTMLDivElement>();

    useWatchDeep(
      () => props.selectedMachines.map(m => m.nodeId),
      () => {
        if (props.modelValue || nodesTask.value.loading) {
          return;
        }

        _setValidNode();
      },
      { debounce: 1000 },
    );

    return {
      pageCountTask,
      nodesTask,
      loadedNodes,
      reloadNodes,
      resetPageAndReloadNodes,
      pagination,
      loadingError,
      filtersUpdated,
      nodeInputValidateTask,

      touched,
      bindModelValueAndValidate,
      bindStatus,

      nodesContainer,
    };
  },
};
</script>

<style>
.node-selector .v-select__selection {
  width: 100%;
}
</style>
