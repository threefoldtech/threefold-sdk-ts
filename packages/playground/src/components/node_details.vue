<template>
  <v-dialog
    v-model="dialog"
    @update:modelValue="(val:boolean) => closeDialog(val)"
    @click:outside="() => $emit('close-dialog', false)"
    transition="dialog-bottom-transition"
    hide-overlay
    attach="#modals"
  >
    <v-toolbar color="primary">
      <div class="d-flex justify-center">
        <v-btn icon dark @click="() => $emit('close-dialog', false)">
          <v-icon color="anchor">mdi-close</v-icon>
        </v-btn>
      </div>
    </v-toolbar>
    <template v-if="loading">
      <v-card class="d-flex justify-center align-center h-screen">
        <div class="d-flex my-6 align-center justify-center">
          <v-progress-circular indeterminate />
        </div>
        <p>Loading node details...</p>
      </v-card>
    </template>
    <template v-else-if="isError">
      <v-card class="d-flex justify-center align-center h-screen">
        <div class="text-center w-100 pa-3">
          <v-icon variant="tonal" color="error" style="font-size: 50px" icon="mdi-close-circle-outline" />
          <p class="mt-4 mb-4 font-weight-bold text-error">
            {{ errorMessage }}
          </p>
          <v-btn class="mr-4" @click="requestNode" text="Try Again" />
          <v-btn @click="(val:boolean) => closeDialog(val)" color="error" text="Cancel" />
        </div>
      </v-card>
    </template>

    <template v-else>
      <v-card>
        <node-resources-charts :node="node" :is-live-stats="isLiveStats" :hint-message="errorLoadingStatsMessage" />
        <v-row class="pa-8 mt-5" justify-md="start" justify-sm="center">
          <v-col cols="12" md="6" sm="12">
            <node-details-card :node="node" />
            <farm-details-card class="mt-5" :node="node" />
            <interfaces-details-card class="mt-5" :node="node" />
            <public-config-details-card
              v-if="node.publicConfig && node.publicConfig.domain"
              class="mt-5"
              :node="node"
            />

            <cpu-benchmark-card v-if="hasActiveProfile && node.healthy" class="mt-5" :node="node" />
          </v-col>
          <v-col cols="12" md="6" sm="12">
            <country-details-card :node="node" />
            <twin-details-card class="mt-3" :node="node" />
            <gpu-details-card class="mt-3" v-if="node.gpus?.length" :node="node" />
            <i-perf-card class="mt-3" v-if="hasActiveProfile && node.healthy" :node="node" />
          </v-col>
        </v-row>
      </v-card>
    </template>
  </v-dialog>
</template>

<script lang="ts">
import { type GridNode, type NodesExtractOptions, NodeStatus } from "@threefold/gridproxy_client";
import { type PropType, ref, watch } from "vue";
import { computed } from "vue";

import CountryDetailsCard from "@/components/node_details_cards/country_details_card.vue";
import cpuBenchmarkCard from "@/components/node_details_cards/cpu_benchmark_card.vue";
import FarmDetailsCard from "@/components/node_details_cards/farm_details_card.vue";
import GpuDetailsCard from "@/components/node_details_cards/gpu_details_card.vue";
import InterfacesDetailsCard from "@/components/node_details_cards/interfaces_details_card.vue";
import NodeDetailsCard from "@/components/node_details_cards/node_details_card.vue";
import PublicConfigDetailsCard from "@/components/node_details_cards/public_config_details_card.vue";
import TwinDetailsCard from "@/components/node_details_cards/twin_details_card.vue";
import router from "@/router";
import { useProfileManager } from "@/stores";
import type { FilterOptions } from "@/types";
import { nodeInitializer } from "@/types";
import { getNode, getNodeStatusColor } from "@/utils/get_nodes";

import IPerfCard from "./node_details_cards/iperf_details_card.vue";
import NodeResourcesCharts from "./node_resources_charts.vue";
export default {
  props: {
    openDialog: {
      type: Boolean,
      required: true,
    },
    nodeId: {
      type: Number,
      required: true,
    },
    filterOptions: {
      type: Object as PropType<FilterOptions>,
      required: true,
    },
  },

  components: {
    NodeResourcesCharts,
    NodeDetailsCard,
    FarmDetailsCard,
    CountryDetailsCard,
    InterfacesDetailsCard,
    TwinDetailsCard,
    GpuDetailsCard,
    PublicConfigDetailsCard,
    IPerfCard,
    cpuBenchmarkCard,
  },

  setup(props, { emit }) {
    const loading = ref<boolean>(false);
    const isError = ref<boolean>(false);
    const isLiveStats = ref<boolean>(false);

    const errorLoadingStatsMessage = ref<string>();
    const errorMessage = ref<string>("");
    const profileManager = useProfileManager();
    const hasActiveProfile = computed(() => {
      return !!profileManager.profile;
    });
    const node = ref<GridNode>(nodeInitializer);

    const nodeOptions: NodesExtractOptions = {
      loadTwin: true,
      loadFarm: true,
      loadStats: true,
    };

    function closeDialog(newValue: boolean) {
      isError.value = false;
      errorMessage.value = "";
      emit("close-dialog", newValue);
    }

    async function requestNode() {
      isError.value = false;
      isLiveStats.value = false;
      errorLoadingStatsMessage.value = undefined;
      nodeOptions.loadStats = true;

      if (props.nodeId > 0) {
        try {
          loading.value = true;
          const _node: GridNode = await getNode(props.nodeId, nodeOptions);
          node.value = _node;
          isLiveStats.value = true;
          const query = { ...router.currentRoute.value.query, nodeId: node.value.nodeId };
          router.replace({ query });
        } catch (_) {
          isLiveStats.value = false;
          errorLoadingStatsMessage.value =
            "The node appears like it's up but it is physically down maybe because it's gone to offline mode.";
          nodeOptions.loadStats = false;
          try {
            const _node: GridNode = await getNode(props.nodeId, nodeOptions);
            node.value = _node;
            const query = { ...router.currentRoute.value.query, nodeId: node.value.nodeId };
            router.replace({ query });
          } catch (err: any) {
            isError.value = true;
            errorMessage.value = `Failed to load node details with ID ${props.nodeId} as node isn't reachable over RMB or GridProxy. The node might be offline or unresponsive. Please, try requesting it again.`;
          }
        } finally {
          loading.value = false;
        }
      }
    }

    watch(() => props.nodeId, requestNode);
    const dialog = computed(() => props.openDialog);

    return {
      NodeStatus,

      dialog,
      node,
      loading,
      isError,
      errorMessage,
      isLiveStats,
      errorLoadingStatsMessage,
      nodeOptions,
      hasActiveProfile,
      requestNode,
      closeDialog,
      getNodeStatusColor,
    };
  },
};
</script>

<style scoped>
.v-list-item__prepend > .v-icon,
.v-list-item__append > .v-icon {
  opacity: 1 !important;
}
:deep(.v-toolbar__content) {
  justify-content: end !important;
  height: 48px !important;
}
</style>
