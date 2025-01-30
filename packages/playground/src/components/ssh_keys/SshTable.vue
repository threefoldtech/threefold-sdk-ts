<template>
  <v-card>
    <v-card-title>
      <v-icon icon="mdi-key-chain" />
      SSH Keys
    </v-card-title>

    <v-divider />

    <v-card-text>
      <v-data-table
        show-select
        :no-data-text="capitalize(`No keys found.`)"
        v-model="selectedKeys"
        :loading="loading"
        :headers="headers"
        :items="sshKeys"
        :items-per-page="itemsPerPage"
        :items-per-page-options="[
          { value: 5, title: '5' },
          { value: 10, title: '10' },
          { value: 20, title: '20' },
          { value: 50, title: '50' },
        ]"
        loading-text="Loading..."
        @click:row="(_: any, { item }: any) => $emit('view', item)"
      >
        <template #loading>
          <div class="text-center" v-if="loading && loadingMessage">
            <small>{{ loadingMessage }}</small>
          </div>
        </template>
        <template #[`item.createdAt`]="{ item }">
          <v-tooltip location="bottom" :text="`The date when this SSH key was created.`">
            <template #activator="{ props }">
              <v-chip v-bind="props">
                {{ item.createdAt }}
              </v-chip>
            </template>
          </v-tooltip>
        </template>

        <template #[`item.name`]="{ item }">
          <v-tooltip
            location="bottom"
            :text="`This name is used to associate between the key and its corresponding system or deployment.`"
          >
            <template #activator="{ props }">
              <p v-bind="props">
                {{ item.name || "-" }}
              </p>
            </template>
          </v-tooltip>
        </template>

        <template #[`item.fingerPrint`]="{ item }">
          <v-tooltip
            location="bottom"
            :text="`The fingerprint of an SSH key is a unique identifier generated from the key's contents. It's displayed as a sequence of hexadecimal characters and serves to verify the key's authenticity.`"
          >
            <template #activator="{ props }">
              <p v-bind="props">
                {{ item.fingerPrint || "-" }}
              </p>
            </template>
          </v-tooltip>
        </template>

        <template #[`item.activation`]="{ item }">
          <v-tooltip
            location="bottom"
            :text="
              item.isActive
                ? `The '${item.name}' key is currently activated and will be utilized in deployments.`
                : `Click to activate the '${item.name}' for use in deployments.`
            "
          >
            <template #activator="{ props }">
              <v-progress-circular
                v-if="item.activating"
                :size="20"
                :width="2"
                color="info"
                indeterminate
              ></v-progress-circular>
              <VCheckboxBtn
                v-else
                class="d-inline"
                v-bind="props"
                color="secondary"
                @click.stop="toggleKeyActivation(item)"
                :model-value="item.isActive"
                :disabled="deleting"
              />
            </template>
          </v-tooltip>
        </template>
      </v-data-table>
    </v-card-text>

    <!-- <v-divider /> -->

    <v-card-actions class="justify-end my-1 mr-2">
      <v-tooltip location="bottom" text="Export all selected keys.">
        <template #activator="{ props }">
          <v-btn
            :disabled="loading || selectedKeys.length === 0 || $props.sshKeys.length === 0 || deleting"
            :loading="loading"
            v-bind="props"
            prepend-icon="mdi-export"
            color="anchor"
            @click="() => $emit('export', selectedKeys)"
          >
            Export
          </v-btn>
        </template>
      </v-tooltip>

      <v-tooltip location="bottom" text="Delete all selected keys.">
        <template #activator="{ props }">
          <v-btn
            :disabled="loading || selectedKeys.length === 0 || deleting"
            :loading="deleting"
            v-bind="props"
            prepend-icon="mdi-trash-can-outline"
            color="error"
            @click="deleteSelected"
          >
            Delete
          </v-btn>
        </template>
      </v-tooltip>
    </v-card-actions>
  </v-card>
</template>

<script lang="ts">
import { capitalize, defineComponent, type PropType, ref } from "vue";
import { useTheme } from "vuetify";

import type { SSHKeyData, VDataTableHeader } from "@/types";
import { AppThemeSelection } from "@/utils/app_theme";

export default defineComponent({
  props: {
    sshKeys: {
      type: Array as PropType<SSHKeyData[]>,
      required: true,
    },
    loadingMessage: {
      type: String,
      required: true,
    },
    loading: {
      type: Boolean,
      required: true,
    },
    deleting: {
      type: Boolean,
      required: true,
    },
  },

  emits: ["delete", "view", "update:activation", "export"],

  setup(props, { emit }) {
    const selectedKeys = ref<number[]>([]); // IDs
    const theme = useTheme();
    const itemsPerPage = ref(10);
    const headers: VDataTableHeader = [
      {
        title: "ID",
        key: "id",
      },
      {
        title: "Name",
        key: "name",
      },
      {
        title: "Created At",
        key: "createdAt",
      },
      {
        title: "Key Fingerprint",
        key: "fingerPrint",
      },
      {
        title: "Active",
        key: "activation",
        sortable: false,
      },
    ];

    const deleteSelected = () => {
      const ids: number[] = [];
      Object.keys(selectedKeys.value).forEach(key => ids.push(selectedKeys.value[key as any]));

      const filteredKeys = props.sshKeys.filter(_key => ids.includes(_key.id));
      emit("delete", filteredKeys);
      selectedKeys.value = [];
    };

    const deleteKey = (key: SSHKeyData) => {
      emit("delete", [key]);
    };

    const toggleKeyActivation = (key: SSHKeyData) => {
      emit("update:activation", key);
    };

    return {
      headers,
      selectedKeys,
      itemsPerPage,
      theme,
      AppThemeSelection,
      capitalize,
      deleteSelected,
      deleteKey,
      toggleKeyActivation,
    };
  },
});
</script>

<style>
.activation {
  cursor: pointer;
}
</style>
