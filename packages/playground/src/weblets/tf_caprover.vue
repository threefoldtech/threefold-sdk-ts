<template>
  <weblet-layout
    ref="layout"
    :cpu="workers.reduce((cpu, worker) => cpu + (worker.solution?.cpu ?? 0), leader.solution?.cpu ?? 0)"
    :memory="workers.reduce((memory, worker) => memory + (worker.solution?.memory ?? 0), leader.solution?.memory ?? 0)"
    :disk="
      workers.reduce(
        (disk, worker) =>
          disk +
          (worker.solution?.disk ?? 0) +
          calculateRootFileSystem({
            CPUCores: worker.solution?.cpu ?? 0,
            RAMInMegaBytes: worker.solution?.memory ?? 0,
          }),
        leader.solution?.disk ??
          0 +
            calculateRootFileSystem({
              CPUCores: leader.solution?.cpu ?? 0,
              RAMInMegaBytes: leader.solution?.memory ?? 0,
            }),
      )
    "
    :ipv4="true"
    :dedicated="leader.dedicated"
    :SelectedNode="leader.selectionDetails?.node"
    :valid-filters="leader.selectionDetails?.validFilters"
    title-image="images/icons/caprover.png"
  >
    <template #title>Deploy a Caprover Instance</template>
    <d-tabs
      :tabs="[
        { title: 'Config', value: 'config' },
        { title: 'Leader', value: 'leader' },
        { title: 'Workers', value: 'workers', workers: workers.length },
      ]"
      ref="tabs"
    >
      <template #config>
        <input-validator
          :value="domain"
          :rules="[
            validators.required('Domain is required.'),
            validators.pattern('Please provide a valid domain.', {
              pattern: /^\b((?=[a-z0-9-]{1,63}\.)(xn--)?[a-z0-9]+(-[a-z0-9]+)*\.)+[a-z]{2,63}\b$/,
            }),
          ]"
          #="{ props }"
        >
          <input-tooltip tooltip="Domain name.">
            <v-text-field label="Domain" v-model="domain" v-bind="props" />
          </input-tooltip>
        </input-validator>

        <v-alert type="warning" variant="tonal" class="mb-6">
          <p :style="{ maxWidth: '880px' }">
            You will need to point a wildcard DNS entry for the domain you entered above to this CapRover instance IP
            Address after deployment. Otherwise, you won't be able to access the CapRover dashboard using this domain.
          </p>

          <p class="font-weight-bold mt-4">
            If you don't know what the Captain root domain is, make sure to read the
            <a target="_blank" :href="manual.caprover" :style="{ color: 'inherit' }"> quick start documentation. </a>
          </p>
        </v-alert>

        <password-input-wrapper #="{ props }">
          <input-validator
            :value="password"
            :rules="[
              validators.required('Password is required.'),
              validators.minLength('Password must be at least 6 characters.', 6),
              validators.maxLength('Password cannot exceed 15 characters.', 15),
              validators.pattern('Password should not contain whitespaces.', {
                pattern: /^[^\s]+$/,
              }),
            ]"
            #="{ props: validationProps }"
          >
            <input-tooltip tooltip="Instance admin password.">
              <v-text-field label="Password" v-model="password" v-bind="{ ...props, ...validationProps }" />
            </input-tooltip>
          </input-validator>
        </password-input-wrapper>

        <manage-ssh-deployemnt @selected-keys="updateSSHkeyEnv($event)" />
      </template>

      <template #leader>
        <CaproverWorker v-model="leader" :other-workers="workers" :nodes-lock="nodesLock" />
      </template>

      <template #workers>
        <ExpandableLayout v-model="workers" @add="addWorker" #="{ index }">
          <CaproverWorker
            v-model="workers[index]"
            :other-workers="[workers, leader].flat(1).filter((_, i) => i !== index)"
            :nodes-lock="nodesLock"
          />
        </ExpandableLayout>
      </template>
    </d-tabs>

    <template #footer-actions="{ validateBeforeDeploy }">
      <v-btn
        variant="elevated"
        class="text-primery px-10 py-3 h-auto text-subtitle-1"
        @click="validateBeforeDeploy(deploy)"
        text="Deploy"
      />
    </template>
  </weblet-layout>
</template>

<script lang="ts" setup>
import { ref } from "vue";

import { manual } from "@/utils/manual";

import { useLayout } from "../components/weblet_layout.vue";
import { useGrid, useProfileManager } from "../stores";
import { type CaproverWorker as CW, ProjectName } from "../types";
import { deployVM, type Env, type Machine } from "../utils/deploy_vm";
import { normalizeError } from "../utils/helpers";
import { generateName, generatePassword } from "../utils/strings";

const layout = useLayout();
const tabs = ref();
const nodesLock = markRaw(new AwaitLock());
const profileManager = useProfileManager();
const domain = ref("");
const password = ref(generatePassword(10));
const leader = ref(createWorker(generateName({ prefix: "cr" })));
const workers = ref<CW[]>([]);
const selectedSSHKeys = ref("");
const gridStore = useGrid();
const grid = gridStore.client as GridClient;

async function deploy() {
  layout.value.setStatus("deploy");

  const projectName = ProjectName.Caprover.toLowerCase() + "/" + leader.value.name;

  try {
    layout.value?.validateSSH();
    updateGrid(grid, { projectName });

    await layout.value.validateBalance(grid!);

    const vm = await deployVM(grid!, {
      name: leader.value.name,
      network: createNetwork({ addAccess: leader.value.wireguard }),
      machines: [
        normalizeCaproverWorker(leader.value, [
          { key: "SWM_NODE_MODE", value: "leader" },
          { key: "CAPROVER_ROOT_DOMAIN", value: domain.value },
          { key: "CAPTAIN_IMAGE_VERSION", value: "latest" },
          { key: "PUBLIC_KEY", value: selectedSSHKeys.value },
          { key: "DEFAULT_PASSWORD", value: password.value },
          { key: "CAPTAIN_IS_DEBUG", value: "true" },
        ]),
        ...workers.value.map(worker =>
          normalizeCaproverWorker(worker, [
            { key: "SWM_NODE_MODE", value: "worker" },
            { key: "PUBLIC_KEY", value: selectedSSHKeys.value },
          ]),
        ),
      ],
    });

    layout.value.reloadDeploymentsList();
    layout.value.setStatus("success", "Successfully deployed a Caprover instance.");
    layout.value.openDialog(vm, deploymentListEnvironments.caprover);
  } catch (e) {
    layout.value.setStatus("failed", normalizeError(e, "Failed to deploy a Caprover instance."));
  }
}

function addWorker() {
  workers.value.push(createWorker());
}

function normalizeCaproverWorker(worker: CW, envs: Env[]): Machine {
  return {
    name: worker.name,
    cpu: worker.solution!.cpu,
    memory: worker.solution!.memory,
    flist: "https://hub.grid.tf/tf-official-apps/tf-caprover-latest.flist",
    entryPoint: "/sbin/zinit init",
    publicIpv4: worker.ipv4,
    planetary: worker.planetary,
    mycelium: worker.mycelium,
    publicIpv6: worker.ipv6,

    rootFilesystemSize: calculateRootFileSystem({
      CPUCores: worker.solution!.cpu,
      RAMInMegaBytes: worker.solution!.memory,
    }),

    disks: [
      {
        name: "data0",
        size: worker.solution!.disk,
        mountPoint: "/var/lib/docker",
      },
    ],
    envs,
    nodeId: worker.selectionDetails!.node!.nodeId,
    rentedBy: worker.dedicated ? profileManager.profile?.twinId : undefined,
    certified: worker.certified,
  };
}

function updateSSHkeyEnv(selectedKeys: string) {
  selectedSSHKeys.value = selectedKeys;
}
</script>

<script lang="ts">
import { calculateRootFileSystem, type GridClient } from "@threefold/grid_client";
import AwaitLock from "await-lock";
import { markRaw } from "vue";

import { createNetwork } from "@/utils/deploy_helpers";

import CaproverWorker, { createWorker } from "../components/caprover_worker.vue";
import ExpandableLayout from "../components/expandable_layout.vue";
import ManageSshDeployemnt from "../components/ssh_keys/ManageSshDeployemnt.vue";
import { deploymentListEnvironments } from "../constants";
import { updateGrid } from "../utils/grid";

export default {
  name: "TfCaprover",
  components: {
    CaproverWorker,
    ExpandableLayout,
    ManageSshDeployemnt,
  },
};
</script>
