<template>
  <ManageWorkerDialog
    :workers="data"
    :selectedWorkers="selectedWorkers"
    :deleting="deleting"
    @close="$emit('close')"
    @deploy="deploy"
    @delete="onDelete"
    @back="updateCaprover"
    @click:outside="updateCaprover"
  >
    <template #title>Manage Caprover({{ $props.master.name }}) Workers</template>

    <template #list>
      <ListTable
        :headers="[
          { title: 'PLACEHOLDER', key: 'data-table-select' },
          { title: 'Contract ID', key: 'contractId' },
          { title: 'Name', key: 'name' },
          { title: 'Public IPv4', key: 'publicIP.ip' },
          { title: 'CPU(vCores)', key: 'capacity.cpu' },
          { title: 'Memory(MB)', key: 'capacity.memory' },
          { title: 'Disk(GB)', key: 'disk' },
        ]"
        :items="data"
        :loading="false"
        :deleting="deleting"
        v-model="selectedWorkers"
      >
        <template #[`item.index`]="{ item }">
          {{ data.indexOf(item) + 1 }}
        </template>

        <template #[`item.disk`]="{ item }">
          {{ calcDiskSize(item.mounts) }}
        </template>
      </ListTable>
    </template>

    <template #deploy>
      <CaproverWorker v-model="worker" />
    </template>
  </ManageWorkerDialog>

  <v-dialog v-if="caproverData" v-model="deployedDialog" scrollable width="500px" attach="#modals">
    <v-card>
      <v-card-title> <strong>Add your worker</strong> </v-card-title>

      <v-divider />

      <v-card-text>
        <ol class="px-4">
          <li>
            Go to
            <a :href="'http://captain.' + master.env.CAPROVER_ROOT_DOMAIN" target="_blank" class="app-link">
              Admin Panel </a
            >.
          </li>
          <li>Go to the <strong>cluster</strong> tab.</li>
          <li>
            Click <strong>Add Self-Hosted Registry</strong> button then <strong>Enable Self-Hosted Registry</strong>.
          </li>
          <li>
            Insert worker node public IP
            <strong>{{ caproverData.workers[caproverData.workers.length - 1].publicIP.ip }}</strong> and add your
            private SSH Key.
          </li>
          <li>Click <strong>Join cluster</strong> button.</li>
        </ol>
        <v-divider />
      </v-card-text>

      <v-card-actions>
        <v-spacer />
        <v-btn color="anchor" @click="deployedDialog = false">Close</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script lang="ts" setup>
import { ref } from "vue";

import { useGrid } from "../stores";
import { addMachine, deleteMachine, loadVM } from "../utils/deploy_vm";

const props = defineProps<{ master: any; data: any[]; projectName: string }>();
const emits = defineEmits<{ (event: "close"): void; (event: "update:caprover", data: any): void }>();

const selectedWorkers = ref<any[]>([]);
const deleting = ref(false);
const deployedDialog = ref(false);
const gridStore = useGrid();
const grid = gridStore.client as GridClient;
const solution = { cpu: 1, memory: 2, disk: 50 };
const worker = ref(createWorker());

function calcDiskSize(disks: { size: number }[]) {
  return disks.reduce((t, d) => t + d.size, 0) / 1024 ** 3;
}

const caproverData = ref<any>();
function updateCaprover() {
  if (!caproverData.value) return;
  emits("update:caprover", caproverData.value);
  caproverData.value = undefined;
}

async function deploy(layout: any) {
  layout.setStatus("deploy");

  try {
    updateGrid(grid, { projectName: props.projectName });
    layout.value?.validateSSH();

    await layout.validateBalance(grid);

    const vms = await addMachine(grid!, {
      name: worker.value.name,
      deploymentName: props.master.name,
      cpu: worker.value.solution!.cpu,
      memory: worker.value.solution!.memory,
      disks: [
        {
          name: "data0",
          size: worker.value.solution!.disk,
          mountPoint: "/var/lib/docker",
        },
      ],
      flist: "https://hub.grid.tf/tf-official-apps/tf-caprover-latest.flist",
      entryPoint: "/sbin/zinit init",
      farmId: worker.value.selectionDetails!.farm?.farmId,
      farmName: worker.value.selectionDetails!.farm?.name,
      country: worker.value.selectionDetails!.location?.country,
      region: worker.value.selectionDetails!.location?.region,
      planetary: true,
      publicIpv4: true,
      envs: [
        { key: "SWM_NODE_MODE", value: "worker" },
        { key: "PUBLIC_KEY", value: props.master.env.PUBLIC_KEY },
      ],
      rootFilesystemSize: calculateRootFileSystem({
        CPUCores: worker.value.solution!.cpu,
        RAMInMegaBytes: worker.value.solution!.memory,
      }),
    });

    const [leader, ...workers] = vms;
    leader.workers = workers;
    leader.projectName = props.projectName;
    leader.deploymentName = leader.name;
    caproverData.value = leader;
    deployedDialog.value = true;
    workers.forEach((worker: any) => {
      if (!worker.projectName) worker.projectName = props.projectName;
      if (!worker.deploymentName) worker.deploymentName = leader.name;
    });
    emits("update:caprover", leader);
    layout.setStatus("success", `Successfully add a new worker to Caprover('${props.master.name}') Instance.`);
  } catch (e) {
    layout.setStatus("failed", normalizeError(e, "Failed to deploy a caprover worker."));
  } finally {
    worker.value = createWorker();
    worker.value.solution = solution;
  }
}

async function onDelete(cb: (workers: any[]) => void) {
  deleting.value = true;
  for (const worker of selectedWorkers.value) {
    try {
      await deleteMachine(grid!, {
        deploymentName: props.master.name,
        name: worker.name,
      });
    } catch (e) {
      console.log("Error while deleting worker", e);
    }
  }
  selectedWorkers.value = [];
  const data = await loadVM(grid!, props.master.name);
  cb(data.slice(1));
  const [leader, ...workers] = data;
  leader.workers = workers;
  leader.deploymentName = leader.name;
  leader.projectName = props.projectName;
  emits("update:caprover", leader);
  deleting.value = false;
}
</script>

<script lang="ts">
import { calculateRootFileSystem, type GridClient } from "@threefold/grid_client";

import CaproverWorker, { createWorker } from "../components/caprover_worker.vue";
import ListTable from "../components/list_table.vue";
import { updateGrid } from "../utils/grid";
import { normalizeError } from "../utils/helpers";
import ManageWorkerDialog from "./manage_worker_dialog.vue";

export default {
  name: "ManageCaproverWorkerDialog",
  components: {
    ManageWorkerDialog,
    CaproverWorker,
    ListTable,
  },
};
</script>
