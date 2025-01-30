<template>
  <view-layout>
    <v-card color="primary" class="d-flex justify-center items-center pa-3 text-center">
      <v-icon size="30" class="pr-3">mdi-access-point</v-icon>
      <v-card-title class="pa-0">Node Finder</v-card-title>
    </v-card>
    <div class="hint mt-3">
      <v-alert class="mb-4" type="info" variant="tonal">
        Node status is updated every 90 minutes. For a realtime status, click on the node's card.
      </v-alert>
    </div>
    <TfFiltersLayout>
      <template #filters>
        <TfFiltersContainer class="mb-4" @apply="loadNodes(true)" :loading="loading">
          <TfFilter query-route="dedicated" v-model="filters.dedicated">
            <v-switch
              color="primary"
              inset
              label="Dedicated Nodes"
              v-model="filters.dedicated"
              density="compact"
              hide-details
            />
          </TfFilter>
          <TfFilter query-route="gateway" v-model="filters.gateway">
            <v-switch color="primary" inset label="Gateways" v-model="filters.gateway" density="compact" hide-details />
          </TfFilter>

          <TfFilter query-route="gpu" v-model="filters.gpu">
            <v-switch color="primary" inset label="GPU Node" v-model="filters.gpu" density="compact" hide-details />
          </TfFilter>

          <TfFilter query-route="rentable" v-model="filters.rentable" v-if="profileManager.profile">
            <v-switch
              color="primary"
              inset
              label="Rentable"
              v-model="filters.rentable"
              density="compact"
              hide-details
            />
          </TfFilter>

          <TfFilter query-route="ipv6" v-model="filters.ipv6">
            <v-switch color="primary" inset label="IPv6" v-model="filters.ipv6" density="compact" hide-details />
          </TfFilter>
          <TfFilter query-route="myRentedNodes" v-model="filters.myRentedNodes" v-if="profileManager.profile">
            <v-switch
              color="primary"
              inset
              label="My Rented Nodes"
              v-model="filters.myRentedNodes"
              density="compact"
              hide-details
            />
          </TfFilter>

          <VTooltip
            location="bottom"
            offset="-25"
            :disabled="!filters.rentable"
            text="The 'Rentable' filter will list only 'Standby & Up' nodes."
          >
            <template #activator="{ props }">
              <TfFilter class="mt-4" v-bind="props" query-route="node-status" v-model="filters.status">
                <v-select
                  :disabled="filters.rentable"
                  :model-value="filters.status || undefined"
                  @update:model-value="filters.status = $event || ''"
                  :items="[
                    { title: 'Up', value: UnifiedNodeStatus.Up },
                    { title: 'Standby', value: UnifiedNodeStatus.Standby },
                    { title: 'Up or Standby', value: UnifiedNodeStatus.UpStandby },
                    { title: 'Down', value: UnifiedNodeStatus.Down },
                  ]"
                  label="Select Nodes Status"
                  item-title="title"
                  item-value="value"
                  variant="outlined"
                  clearable
                  @click:clear="filters.status = ''"
                  density="compact"
                />
              </TfFilter>
            </template>
          </VTooltip>

          <TfFilter
            query-route="node-id"
            :rules="[
              validators.isNumeric('This field accepts numbers only.', { no_symbols: true }),
              validators.min('The node id should be larger than zero.', 1),
              validators.startsWith('The node id start with zero.', '0'),
              validators.validateResourceMaxNumber('This is not a valid ID.'),
            ]"
            v-model="filters.nodeId"
          >
            <template #input="{ props }">
              <VTextField label="Node ID" variant="outlined" v-model="filters.nodeId" density="compact" v-bind="props">
                <template #append-inner>
                  <VTooltip text="Filter by node id">
                    <template #activator="{ props }">
                      <VIcon icon="mdi-information-outline" v-bind="props" />
                    </template>
                  </VTooltip>
                </template>
              </VTextField>
            </template>
          </TfFilter>

          <TfFilter
            query-route="farm-id"
            v-model="filters.farmId"
            :rules="[
              validators.isNumeric('This field accepts numbers only.', {
                no_symbols: true,
              }),
              validators.min('The ID should be larger than zero.', 1),
              validators.isInt('should be an integer'),
              validators.validateResourceMaxNumber('This is not a valid ID.'),
            ]"
          >
            <template #input="{ props }">
              <VTextField label="Farm ID" variant="outlined" v-model="filters.farmId" density="compact" v-bind="props">
                <template #append-inner>
                  <VTooltip text="Filter by farm id">
                    <template #activator="{ props }">
                      <VIcon icon="mdi-information-outline" v-bind="props" />
                    </template>
                  </VTooltip>
                </template>
              </VTextField>
            </template>
          </TfFilter>

          <TfFilter query-route="farm-name" v-model="filters.farmName">
            <template #unwrap="{ colProps }">
              <VCol v-bind="colProps">
                <TfSelectFarm
                  inset-tooltip
                  variant="outlined"
                  tooltip="Filter by farm name."
                  :model-value="filters.farmName ? ({ name: filters.farmName } as any) : undefined"
                  @update:model-value="filters.farmName = $event?.name || ''"
                  density="compact"
                />
              </VCol>
            </template>
          </TfFilter>

          <TfSelectLocation
            :model-value="{ region: filters.region, country: filters.country }"
            @update:model-value="
              filters.country = $event?.country || '';
              filters.region = $event?.region || '';
            "
            :only-with-nodes="false"
          >
            <template #region="{ props }">
              <TfFilter query-route="region" v-model="filters.region">
                <TfSelectRegion :region-props="props" variant="outlined" density="compact" />
              </TfFilter>
            </template>

            <template #country="{ props }">
              <TfFilter query-route="country" v-model="filters.country">
                <TfSelectCountry :country-props="props" variant="outlined" density="compact" />
              </TfFilter>
            </template>
          </TfSelectLocation>

          <TfFilter
            query-route="free-public-ips"
            :rules="[
              validators.isNumeric('This field accepts numbers only.', {
                no_symbols: true,
              }),
              validators.min('The node id should be larger then zero.', 1),
              validators.startsWith('The node id start with zero.', '0'),
              validators.validateResourceMaxNumber('This value is out of range.'),
            ]"
            v-model="filters.publicIPs"
          >
            <template #input="{ props }">
              <VTextField
                label="Free Public IPs"
                variant="outlined"
                v-model="filters.publicIPs"
                density="compact"
                v-bind="props"
              >
                <template #append-inner>
                  <VTooltip text="Filter by free Public IPs">
                    <template #activator="{ props }">
                      <VIcon icon="mdi-information-outline" v-bind="props" />
                    </template>
                  </VTooltip>
                </template>
              </VTextField>
            </template>
          </TfFilter>

          <TfFilter
            query-route="free-ssd"
            v-model="filters.freeSSD"
            :rules="[
              validators.isNumeric('This field accepts numbers only.'),
              validators.min('The free ssd should be larger than zero.', 1),
              validators.validateResourceMaxNumber('This value is out of range.'),
            ]"
          >
            <template #input="{ props }">
              <VTextField
                label="Free SSD (GB)"
                variant="outlined"
                v-model="filters.freeSSD"
                density="compact"
                v-bind="props"
              >
                <template #append-inner>
                  <VTooltip text="Filter by the minimum available amount of SSD in the node.">
                    <template #activator="{ props }">
                      <VIcon icon="mdi-information-outline" v-bind="props" />
                    </template>
                  </VTooltip>
                </template>
              </VTextField>
            </template>
          </TfFilter>

          <TfFilter
            query-route="free-hdd"
            v-model="filters.freeHDD"
            :rules="[
              validators.isNumeric('This field accepts numbers only.'),
              validators.min('The free hdd should be larger than zero.', 1),
              validators.validateResourceMaxNumber('This value is out of range.'),
            ]"
          >
            <template #input="{ props }">
              <VTextField
                label="Free HDD (GB)"
                variant="outlined"
                v-model="filters.freeHDD"
                density="compact"
                v-bind="props"
              >
                <template #append-inner>
                  <VTooltip text="Filter by the minimum available amount of HDD in the node.">
                    <template #activator="{ props }">
                      <VIcon icon="mdi-information-outline" v-bind="props" />
                    </template>
                  </VTooltip>
                </template>
              </VTextField>
            </template>
          </TfFilter>

          <TfFilter
            query-route="free-ram"
            v-model="filters.freeRAM"
            :rules="[
              validators.isNumeric('This field accepts numbers only.'),
              validators.min('The free ram should be larger than zero.', 1),
              validators.validateResourceMaxNumber('This value is out of range.'),
            ]"
          >
            <template #input="{ props }">
              <VTextField
                label="Free RAM (GB)"
                variant="outlined"
                v-model="filters.freeRAM"
                density="compact"
                v-bind="props"
              >
                <template #append-inner>
                  <VTooltip text="Filter by the minimum available amount of RAM in the node.">
                    <template #activator="{ props }">
                      <VIcon icon="mdi-information-outline" v-bind="props" />
                    </template>
                  </VTooltip>
                </template>
              </VTextField>
            </template>
          </TfFilter>

          <TfFilter
            query-route="num-gpu"
            v-model="filters.numGpu"
            :rules="[
              validators.isNumeric('This field accepts numbers only.'),
              validators.min('The number of gpus should be larger than zero.', 1),
              validators.validateResourceMaxNumber('This value is out of range.'),
            ]"
          >
            <template #input="{ props }">
              <VTextField density="compact" label="Num GPU" variant="outlined" v-model="filters.numGpu" v-bind="props">
                <template #append-inner>
                  <VTooltip text="Filter by the number of gpus in the node.">
                    <template #activator="{ props }">
                      <VIcon icon="mdi-information-outline" v-bind="props" />
                    </template>
                  </VTooltip>
                </template>
              </VTextField>
            </template>
          </TfFilter>

          <TfFilter
            query-route="min-ssd"
            v-model="filters.minSSD"
            :rules="[
              validators.isNumeric('This field accepts numbers only.'),
              validators.min('The total ssd should be larger than zero.', 1),
              validators.validateResourceMaxNumber('This value is out of range.'),
            ]"
          >
            <template #input="{ props }">
              <VTextField
                label="Min SSD (GB)"
                variant="outlined"
                v-model="filters.minSSD"
                density="compact"
                v-bind="props"
              >
                <template #append-inner>
                  <VTooltip text="Filter by the minimum total amount of SSD in the node.">
                    <template #activator="{ props }">
                      <VIcon icon="mdi-information-outline" v-bind="props" />
                    </template>
                  </VTooltip>
                </template>
              </VTextField>
            </template>
          </TfFilter>

          <TfFilter
            query-route="min-hdd"
            v-model="filters.minHDD"
            :rules="[
              validators.isNumeric('This field accepts numbers only.'),
              validators.min('The total hdd should be larger than zero.', 1),
              validators.validateResourceMaxNumber('This value is out of range.'),
            ]"
          >
            <template #input="{ props }">
              <VTextField
                label="Min HDD (GB)"
                variant="outlined"
                v-model="filters.minHDD"
                density="compact"
                v-bind="props"
              >
                <template #append-inner>
                  <VTooltip text="Filter by the minimum total amount of HDD in the node.">
                    <template #activator="{ props }">
                      <VIcon icon="mdi-information-outline" v-bind="props" />
                    </template>
                  </VTooltip>
                </template>
              </VTextField>
            </template>
          </TfFilter>

          <TfFilter
            query-route="min-ram"
            v-model="filters.minRAM"
            :rules="[
              validators.isNumeric('This field accepts numbers only.'),
              validators.min('The total ram should be larger than zero.', 1),
              validators.validateResourceMaxNumber('This value is out of range.'),
            ]"
          >
            <template #input="{ props }">
              <VTextField
                label="Min RAM (GB)"
                variant="outlined"
                v-model="filters.minRAM"
                density="compact"
                v-bind="props"
              >
                <template #append-inner>
                  <VTooltip text="Filter by the minimum total amount of RAM in the node.">
                    <template #activator="{ props }">
                      <VIcon icon="mdi-information-outline" v-bind="props" />
                    </template>
                  </VTooltip>
                </template>
              </VTextField>
            </template>
          </TfFilter>

          <TfFilter
            query-route="min-cpu"
            v-model="filters.minCRU"
            :rules="[
              validators.isNumeric('This field accepts numbers only.'),
              validators.min('The total number of CPUs should be larger then zero.', 1),
              validators.validateResourceMaxNumber('This value is out of range.'),
            ]"
          >
            <template #input="{ props }">
              <VTextField
                label="Min CPU (vCores)"
                variant="outlined"
                v-model="filters.minCRU"
                density="compact"
                v-bind="props"
              >
                <template #append-inner>
                  <VTooltip text="Filter by the minimum total number of CPUs in the node.">
                    <template #activator="{ props }">
                      <VIcon icon="mdi-information-outline" v-bind="props" />
                    </template>
                  </VTooltip>
                </template>
              </VTextField>
            </template>
          </TfFilter>
        </TfFiltersContainer>
      </template>

      <v-row>
        <v-spacer />
        <v-col :style="{ maxWidth: '350px' }">
          <v-select hide-details label="Sort By" clearable :items="sortItems" v-model="sortItem" return-object>
            <template #item="{ props, item }">
              <v-list-item v-bind="props" :title="item.title" :prepend-icon="item.raw.icon" />
            </template>
          </v-select>
        </v-col>
      </v-row>

      <div class="nodes">
        <div class="nodes-inner">
          <v-row>
            <v-col cols="12">
              <div class="table">
                <VAlert type="error" class="text-body-1 mb-4" v-if="error">
                  Failed to load Nodes. Please try again!
                  <template #append>
                    <VBtn icon="mdi-reload" color="error" variant="plain" density="compact" @click="loadNodes(true)" />
                  </template>
                </VAlert>
                <nodes-table
                  v-model="nodes"
                  max-height="730px"
                  :size="size"
                  @update:size="
                    size = $event;
                    loadNodes();
                  "
                  :page="page"
                  @update:page="
                    page = $event;
                    loadNodes();
                  "
                  :count="nodesCount"
                  :loading="loading"
                  v-model:selectedNode="selectedNodeId"
                  @open-dialog="openDialog"
                />
              </div>
            </v-col>
          </v-row>
        </div>
      </div>

      <node-details
        :filter-options="{ size, page, gpu: filters.gpu }"
        :nodeId="selectedNodeId"
        :openDialog="isDialogOpened"
        @close-dialog="closeDialog"
      />
    </TfFiltersLayout>
  </view-layout>
</template>

<script lang="ts">
import { type GridNode, SortBy, SortOrder, UnifiedNodeStatus } from "@threefold/gridproxy_client";
import { sortBy } from "lodash";
import { computed, onMounted, ref, watch } from "vue";
import { useRoute } from "vue-router";

import NodeDetails from "@/components/node_details.vue";
import NodesTable from "@/components/nodes_table.vue";
import router from "@/router";
import { useProfileManager } from "@/stores";
import { requestNodes } from "@/utils/get_nodes";
import { convertToBytes } from "@/utils/get_nodes";

import TfFilter from "../components/filters/TfFilter.vue";
import TfFiltersContainer from "../components/filters/TfFiltersContainer.vue";
import TfFiltersLayout from "../components/filters/TfFiltersLayout.vue";
import TfSelectFarm from "../components/node_selector/TfSelectFarm.vue";
import TfSelectLocation from "../components/node_selector/TfSelectLocation.vue";

const sortItems = [
  {
    icon: "mdi-sort-ascending",
    title: "USD Price: Low to High",
    value: (nodes: GridNode[]) => sortBy(nodes, "price_usd"),
  },
  {
    icon: "mdi-sort-descending",
    title: "USD Price: High to Low",
    value: (nodes: GridNode[]) => sortBy(nodes, "price_usd").reverse(),
  },
];

export default {
  components: {
    NodesTable,
    NodeDetails,
    TfFiltersContainer,
    TfFilter,
    TfSelectFarm,
    TfSelectLocation,
    TfFiltersLayout,
  },
  setup() {
    const profileManager = useProfileManager();
    const size = ref(window.env.PAGE_SIZE);
    const error = ref(false);
    const page = ref(1);
    const filters = ref({
      nodeId: "",
      farmId: "",
      farmName: "",
      minSSD: "",
      minHDD: "",
      minRAM: "",
      minCRU: "",
      freeSSD: "",
      freeHDD: "",
      freeRAM: "",
      region: "",
      country: "",
      status: "",
      gateway: false,
      gpu: false,
      publicIPs: "",
      dedicated: false,
      numGpu: "",
      rentable: false,
      ipv6: false,
      myRentedNodes: false,
    });
    const oldNodeStatus = ref();
    watch(
      () => filters.value.rentable,
      rentable => {
        if (rentable) {
          oldNodeStatus.value = filters.value.status;
          filters.value.status = UnifiedNodeStatus.UpStandby;
        } else {
          filters.value.status = oldNodeStatus.value;
        }
      },
    );
    const loading = ref<boolean>(true);
    const _nodes = ref<GridNode[]>([]);

    const sortItem = ref<{ title: string; icon: string; value: (nodes: GridNode[]) => GridNode[] }>();
    const nodes = computed(() => (sortItem.value?.value || ((x: GridNode[]) => x))(_nodes.value));

    const nodesCount = ref<number>(0);
    const selectedNodeId = ref<number>(0);

    const isDialogOpened = ref<boolean>(false);

    const route = useRoute();

    async function loadNodes(retCount = false) {
      _nodes.value = [];
      loading.value = true;
      error.value = false;
      if (retCount) page.value = 1;
      try {
        const { count, data } = await requestNodes(
          {
            page: page.value,
            size: size.value,
            retCount,
            nodeId: +filters.value.nodeId || undefined,
            farmIds: filters.value.farmId || undefined,
            farmName: filters.value.farmName || undefined,
            country: filters.value.country,
            region: filters.value.region,
            status: (filters.value.status as UnifiedNodeStatus) || undefined,
            freeHru: convertToBytes(filters.value.freeHDD),
            freeMru: convertToBytes(filters.value.freeRAM),
            freeSru: convertToBytes(filters.value.freeSSD),
            totalHru: convertToBytes(filters.value.minHDD),
            totalMru: convertToBytes(filters.value.minRAM),
            totalSru: convertToBytes(filters.value.minSSD),
            totalCru: +filters.value.minCRU || undefined,
            hasGpu: filters.value.gpu || undefined,
            domain: filters.value.gateway || undefined,
            ipv4: filters.value.gateway || undefined,
            freeIps: +filters.value.publicIPs || undefined,
            dedicated: filters.value.dedicated || undefined,
            sortBy: SortBy.Status,
            sortOrder: SortOrder.Asc,
            numGpu: +filters.value.numGpu || undefined,
            rentable: filters.value.rentable ? filters.value.rentable : undefined,
            hasIPv6: filters.value.ipv6 ? filters.value.ipv6 : undefined,
            rentedBy: filters.value.myRentedNodes && profileManager.profile ? profileManager.profile.twinId : undefined,
          },
          { loadFarm: true },
        );

        _nodes.value = data;
        if (retCount) nodesCount.value = count ?? 0;
      } catch (err) {
        console.log(err);
        error.value = true;
      } finally {
        loading.value = false;
      }
    }

    const checkSelectedNode = async () => {
      if (route.query.nodeId) {
        selectedNodeId.value = +route.query.nodeId;
        isDialogOpened.value = true;
      }
    };

    onMounted(checkSelectedNode);

    const closeDialog = () => {
      if (route.query.nodeId) {
        const query = { ...router.currentRoute.value.query };
        delete query.nodeId;
        router.replace({ query });
      }
      isDialogOpened.value = false;
      selectedNodeId.value = 0;
    };

    const openDialog = async (item: GridNode) => {
      selectedNodeId.value = item.nodeId;
      isDialogOpened.value = true;
    };

    return {
      profileManager,
      loading,
      sortItems,
      sortItem,
      nodesCount,
      nodes,
      selectedNodeId,
      openDialog,
      closeDialog,
      requestNodes,
      isDialogOpened,
      filters,
      UnifiedNodeStatus,
      size,
      page,
      error,
      loadNodes,
    };
  },
};
</script>

<style lang="scss">
@media (max-width: 1350px) {
  .tf-node-card {
    .v-card-item {
      grid-template-areas:
        "prepend content"
        "append append";

      .v-card-item__append {
        display: flex;
        padding-inline-start: 0;
        padding: 1rem 0;

        > .d-flex {
          flex-direction: row-reverse;
        }
      }
    }

    .tf-node-resource {
      flex-basis: 100%;
    }
  }
}

@media (max-width: 850px) {
  .tf-layout-container {
    display: block !important;

    > div {
      width: 100% !important;
      margin: 0 !important;
    }

    .tf-filter-item {
      flex-basis: calc(50% - 16px);
    }

    .tf-filter-item:nth-of-type(2n) {
      margin-left: 32px;
    }
  }
}

@media (max-width: 600px) {
  .tf-layout-container {
    .tf-filter-item {
      flex-basis: 100%;
    }

    .tf-filter-item {
      margin-left: 0 !important;
    }
  }
}
</style>
