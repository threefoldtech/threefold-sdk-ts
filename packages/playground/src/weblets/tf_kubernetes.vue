<template>
  <weblet-layout
    ref="layout"
    :cpu="workers.reduce((cpu, worker) => cpu + worker.cpu, master.cpu)"
    :memory="workers.reduce((memory, worker) => memory + worker.memory, master.memory)"
    :disk="
      workers.reduce((disk, worker) => disk + worker.diskSize + worker.rootFsSize, master.diskSize + master.rootFsSize)
    "
    :ipv4="master.ipv4"
    :certified="master.certified"
    :dedicated="master.dedicated"
    :SelectedNode="master.selectionDetails?.node"
    :valid-filters="master.selectionDetails?.validFilters"
    title-image="images/icons/kubernetes.png"
  >
    <template #title>Deploy a Kubernetes cluster</template>
    <d-tabs
      :tabs="[
        { title: 'Config', value: 'config' },
        { title: 'Master', value: 'master' },
        { title: 'Workers', value: 'workers', workers: workers.length },
      ]"
      ref="tabs"
    >
      <template #config>
        <input-validator
          :value="name"
          :rules="[
            validators.required('Name is required.'),
            (name: string) => validators.isAlpha('Name must start with an alphabetical character.')(name[0]),
            validators.IsAlphanumericExpectUnderscore('Name should consist of letters ,numbers and underscores only.'),
            validators.minLength('Name minimum length is 2 chars.', 2),
            validators.maxLength('Name max length is 35 chars.', 35),
          ]"
          #="{ props }"
        >
          <input-tooltip tooltip="Instance name.">
            <v-text-field label="Name" v-model="name" v-bind="{ ...props }" />
          </input-tooltip>
        </input-validator>

        <input-validator
          :value="clusterToken"
          :rules="[
            validators.required('Token is required.'),
            validators.minLength('Token minimum length is 6 chars.', 6),
            validators.maxLength('Token max length is 15 chars.', 15),
            validators.pattern('Token should not contain whitespaces.', {
              pattern: /^[^\s]+$/,
            }),
          ]"
          #="{ props: validationProps }"
        >
          <password-input-wrapper #="{ props }">
            <input-tooltip
              tooltip="The Kubernetes Cluster Token is a specially generated authentication token used for accessing and managing a Kubernetes cluster."
            >
              <v-text-field label="Cluster Token" v-bind="{ ...props, ...validationProps }" v-model="clusterToken" />
            </input-tooltip>
          </password-input-wrapper>
        </input-validator>

        <manage-ssh-deployemnt @selected-keys="updateSSHkeyEnv($event)" />
      </template>

      <template #master>
        <K8SWorker v-model="master" :other-workers="workers" :nodes-lock="nodesLock" />
      </template>

      <template #workers>
        <ExpandableLayout v-model="workers" @add="addWorker" #="{ index }">
          <K8SWorker
            v-model="workers[index]"
            :other-workers="[workers, master].flat(1).filter((_, i) => i !== index)"
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
import { markRaw, ref } from "vue";

import { createWorker } from "../components/k8s_worker.vue";
import { useLayout } from "../components/weblet_layout.vue";
import { useGrid } from "../stores";
import type { K8SWorker as K8sWorker } from "../types";
import { ProjectName } from "../types";
import { deployK8s } from "../utils/deploy_k8s";
import { generateName, generatePassword } from "../utils/strings";

const layout = useLayout();
const tabs = ref();
const nodesLock = markRaw(new AwaitLock());
const name = ref(generateName({ prefix: "k8s" }));
const clusterToken = ref(generatePassword(10));
const master = ref(createWorker(generateName({ prefix: "mr" })));
const workers = ref<K8sWorker[]>([]);
const selectedSSHKeys = ref("");
const gridStore = useGrid();
const grid = gridStore.client as GridClient;

function addWorker() {
  workers.value.push(createWorker());
}

async function deploy() {
  layout.value.setStatus("deploy");

  try {
    layout.value?.validateSSH();
    const projectName = ProjectName.Kubernetes.toLowerCase() + "/" + name.value;
    updateGrid(grid, { projectName });
    await layout.value.validateBalance(grid!);

    const k8s = await deployK8s(grid!, {
      name: name.value,
      clusterToken: clusterToken.value,
      master: master.value!,
      workers: workers.value,
      sshKey: selectedSSHKeys.value,
    });

    layout.value.reloadDeploymentsList();
    layout.value.setStatus("success", "Successfully deployed a Kubernetes cluster.");
    layout.value.openDialog(k8s, deploymentListEnvironments.k8s);
  } catch (e) {
    layout.value.setStatus("failed", normalizeError(e, "Failed to deploy a Kubernetes cluster."));
  }
}

function updateSSHkeyEnv(selectedKeys: string) {
  selectedSSHKeys.value = selectedKeys;
}
</script>

<script lang="ts">
import type { GridClient } from "@threefold/grid_client";
import AwaitLock from "await-lock";

import ExpandableLayout from "../components/expandable_layout.vue";
import K8SWorker from "../components/k8s_worker.vue";
import ManageSshDeployemnt from "../components/ssh_keys/ManageSshDeployemnt.vue";
import { deploymentListEnvironments } from "../constants";
import { updateGrid } from "../utils/grid";
import { normalizeError } from "../utils/helpers";

export default {
  name: "TfKubernetes",
  components: {
    K8SWorker,
    ExpandableLayout,
    ManageSshDeployemnt,
  },
};
</script>
