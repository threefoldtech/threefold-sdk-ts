<template>
  <ManageWorkerDialog
    :workers="data.workers"
    :selectedWorkers="selectedWorkers"
    :deleting="deleting"
    @close="$emit('close')"
    @deploy="deploy"
    @delete="onDelete"
  >
    <template #title>Manage Kubernetes({{ data.deploymentName }}) Workers</template>

    <template #list>
      <ListTable
        :headers="[
          { title: 'PLACEHOLDER', key: 'data-table-select' },
          { title: 'Contract ID', key: 'contractId' },
          { title: 'Name', key: 'name' },
          { title: 'Planetary Network IP', key: 'planetary' },
          { title: 'Mycelium Network IP', key: 'mycelium' },
          { title: 'CPU(vCores)', key: 'capacity.cpu' },
          { title: 'Memory(MB)', key: 'capacity.memory' },
          { title: 'Disk(GB)', key: 'disk' },
        ]"
        :items="data.workers"
        :loading="false"
        :deleting="deleting"
        v-model="selectedWorkers"
      >
        <template #[`item.index`]="{ item }">
          {{ data.workers.indexOf(item?.value) + 1 }}
        </template>

        <template #[`item.disk`]="{ item }">
          {{ calcDiskSize(item.mounts) }}
        </template>
        <template #[`item.mycelium`]="{ item }">
          {{ item.myceliumIP || "-" }}
        </template>
        <template #[`item.planetary`]="{ item }">
          {{ item.planetary || "-" }}
        </template>
      </ListTable>
    </template>

    <template #deploy>
      <K8SWorker v-model="worker" />
    </template>
  </ManageWorkerDialog>
</template>

<script lang="ts" setup>
import { ref } from "vue";

import { useGrid } from "../stores";
import { deleteWorker, deployWorker, loadK8S } from "../utils/deploy_k8s";

const props = defineProps<{ data: K8S }>();
const emits = defineEmits<{ (event: "close"): void; (event: "update:k8s", data: any): void }>();

const worker = ref(createWorker());
const selectedWorkers = ref<any[]>([]);
const deleting = ref(false);
const gridStore = useGrid();
const grid = gridStore.client as GridClient;

function calcDiskSize(disks: { size: number }[]) {
  return disks.reduce((t, d) => t + d.size, 0) / 1024 ** 3;
}

async function deploy(layout: any) {
  layout.setStatus("deploy");

  deployWorker(grid!, {
    ...worker.value,
    deploymentName: props.data.deploymentName,
  })
    .then(data => {
      layout.setStatus("success", `Successfully add a new worker to '${props.data.deploymentName}' Cluster.`);

      emits("update:k8s", data);
    })
    .catch(error => {
      const e = typeof error === "string" ? error : error.message;
      layout.setStatus("failed", e);
    });
}

async function onDelete(cb: (workers: any[]) => void) {
  deleting.value = true;

  for (const worker of selectedWorkers.value) {
    try {
      await deleteWorker(grid!, {
        deploymentName: props.data.deploymentName,
        name: worker.name,
      });
    } catch (e) {
      console.log("Error while deleting worker", e);
    }
  }

  selectedWorkers.value = [];
  const data = await loadK8S(grid!, props.data.deploymentName);
  emits("update:k8s", data);
  cb(data.workers);
  deleting.value = false;
}
</script>

<script lang="ts">
import type { GridClient } from "@threefold/grid_client";

import ListTable from "../components/list_table.vue";
import type { K8S } from "../utils/load_deployment";
import K8SWorker, { createWorker } from "./k8s_worker.vue";
import ManageWorkerDialog from "./manage_worker_dialog.vue";

export default {
  name: "ManageK8SWorkerDialog",
  components: {
    K8SWorker,
    ListTable,
    ManageWorkerDialog,
  },
};
</script>
