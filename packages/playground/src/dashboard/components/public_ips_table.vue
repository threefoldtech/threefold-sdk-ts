<template>
  <div>
    <ListTable
      :headers="headers"
      :items="publicIps"
      :loading="loading"
      :items-per-page-options="[
        { value: 5, title: '5' },
        { value: 10, title: '10' },
        { value: 20, title: '20' },
        { value: 50, title: '50' },
      ]"
      :deleting="isRemoving"
      v-model="selectedItems"
    >
      <template v-slot:top>
        <v-alert>
          <h4 class="text-center font-weight-medium">Public IPs</h4>
        </v-alert>
      </template>
      <template #[`item.ip`]="{ item }">
        {{ item.ip || "-" }}
      </template>
      <template #[`item.gateway`]="{ item }">
        {{ item.gateway || "-" }}
      </template>

      <template #[`item.contractId`]="{ item }">
        {{ item.contractId ?? "-" }}
      </template>
    </ListTable>
    <div v-if="publicIps.length > 0" class="d-flex align-end justify-end">
      <v-btn
        class="ma-3"
        color="error"
        prepend-icon="mdi-delete"
        :disabled="selectedItems.length === 0 || isRemoving"
        @click="showDialogue = true"
      >
        Delete
      </v-btn>
    </div>
    <div v-else>
      <p class="my-4">No IPs added on this farm.</p>
    </div>
    <v-dialog v-model="showDialogue" max-width="600" attach="#modals">
      <v-card>
        <v-card-title class="text-subtitle-1">
          <strong>Delete the following IPs?</strong>
        </v-card-title>
        <v-card-text>
          <v-chip class="mb-5 mr-2" v-for="item in selectedItems" :key="item">
            {{ item.ip }}
          </v-chip>
          <v-divider />
        </v-card-text>
        <v-card-actions class="justify-end mb-1 mr-2">
          <v-btn @click="showDialogue = false" color="anchor">Close</v-btn>
          <v-btn
            text="Delete"
            :loading="isRemoving"
            color="error"
            :disabled="isRemoving"
            @click="removeFarmIps"
          ></v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script lang="ts">
import type { RemoveFarmIPModel } from "@threefold/grid_client";
import type { PublicIp } from "@threefold/tfchain_client";
import { onMounted, ref, watch } from "vue";

import ListTable from "@/components/list_table.vue";
import { useGrid } from "@/stores";
import { IPType } from "@/utils/types";

import { createCustomToast, ToastType } from "../../utils/custom_toast";
export default {
  name: "PublicIPsTable",
  components: { ListTable },
  props: {
    farmId: {
      type: Number,
      required: true,
    },
    refreshPublicIPs: Boolean,
  },
  setup(props) {
    const gridStore = useGrid();
    const headers = [
      {
        title: "IP",
        align: "center",
        key: "ip",
        sortable: false,
      },
      {
        title: "Gateway",
        align: "center",
        key: "gateway",
        sortable: false,
      },
      {
        title: "Deployed Contract ID",
        align: "center",
        key: "contractId",
      },
    ] as any;
    const publicIps = ref<PublicIp[]>([]);
    const loading = ref(false);
    const loadingIps = ref(false);
    const showDialogue = ref(false);
    const type = ref(IPType.single);
    const publicIP = ref();
    const toPublicIP = ref();
    const gateway = ref();
    const isRemoving = ref(false);
    const selectedItems = ref<any[]>([]);
    const items = ref<RemoveFarmIPModel[]>([]);

    onMounted(async () => {
      await getFarmByID(props.farmId);
    });

    async function getFarmByID(id: number) {
      loadingIps.value = true;
      try {
        const farm = await gridStore.grid.farms.getFarmByID({ id });
        publicIps.value = farm.publicIps as unknown as PublicIp[];
      } catch (error) {
        createCustomToast(`Failed to get public IPs! ${error}`, ToastType.danger);
      }
      loadingIps.value = false;
    }
    async function removeFarmIps() {
      try {
        isRemoving.value = true;
        items.value = selectedItems.value.map(item => ({
          ip: item.ip,
          farmId: props.farmId,
        }));
        await gridStore.grid.farms.removeFarmIps(items.value);
        createCustomToast("IP is deleted successfully!", ToastType.success);
        await getFarmByID(props.farmId);
      } catch (error) {
        console.log(error);
        createCustomToast("Failed to delete IP!", ToastType.danger);
      } finally {
        isRemoving.value = false;
        showDialogue.value = false;
        selectedItems.value = [];
      }
    }
    watch(
      () => props.refreshPublicIPs,
      () => {
        getFarmByID(props.farmId);
      },
      { deep: true },
    );

    return {
      gridStore,
      headers,
      publicIps,
      type,
      publicIP,
      toPublicIP,
      gateway,
      loading,
      showDialogue,
      isRemoving,
      removeFarmIps,
      selectedItems,
      loadingIps,
    };
  },
};
</script>
