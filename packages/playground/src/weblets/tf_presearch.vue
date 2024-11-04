<template>
  <weblet-layout
    ref="layout"
    :cpu="cpu"
    :memory="memory"
    :disk="rootFilesystemSize + dockerDiskSize"
    :ipv4="ipv4"
    :dedicated="dedicated"
    :SelectedNode="selectionDetails?.node"
    :valid-filters="selectionDetails?.validFilters"
    title-image="images/icons/presearch.png"
  >
    <template #title>Deploy a Presearch Instance</template>

    <d-tabs
      :tabs="[
        { title: 'Base', value: 'base' },
        { title: 'Restore', value: 'restore' },
      ]"
      ref="tabs"
    >
      <template #base>
        <v-alert type="warning" variant="tonal" class="mb-6">
          You can deploy only one Presearch node per farm without reserving a dedicated public IP. So if a Presearch
          node is deployed without public IP and didn't show up in the Presearch's Dashboard that means there is another
          node deployed and you have to add public IP to your deployment.
        </v-alert>
        <input-validator
          :value="name"
          :rules="[
            validators.required('Name is required.'),
            validators.IsAlphanumericExpectUnderscore('Name should consist of letters ,numbers and underscores only.'),
            (name: string) => validators.isAlpha('Name must start with an alphabetical character.')(name[0]),
            validators.minLength('Name must be at least 2 characters.', 2),
            validators.maxLength('Name cannot exceed 50 characters.', 50),
          ]"
          #="{ props }"
        >
          <input-tooltip tooltip="Instance name.">
            <v-text-field label="Name" v-model="name" v-bind="props" />
          </input-tooltip>
        </input-validator>

        <input-validator
          :value="code"
          :rules="[
            validators.required('Presearch registration code is required.'),
            validators.equal('Presearch registration code must be 32 characters long.', 32),
          ]"
          #="{ props }"
        >
          <password-input-wrapper>
            <input-tooltip tooltip="Presearch Registeration Code.">
              <v-text-field label="Presearch Registeration Code" v-bind="props" v-model="code" />
            </input-tooltip>
          </password-input-wrapper>
        </input-validator>

        <Networks
          required
          v-model:ipv4="ipv4"
          v-model:planetary="planetary"
          v-model:mycelium="mycelium"
          v-model:ipv6="ipv6"
          v-model:wireguard="wireguard"
        />

        <input-tooltip inline tooltip="Click to know more about dedicated machines." :href="manual.dedicated_machines">
          <v-switch color="primary" inset label="Dedicated" v-model="dedicated" hide-details />
        </input-tooltip>
        <input-tooltip inline tooltip="Renting capacity on certified nodes is charged 25% extra.">
          <v-switch color="primary" inset label="Certified" v-model="certified" hide-details />
        </input-tooltip>

        <TfSelectionDetails
          :filters="{
            ipv4,
            ipv6,
            certified,
            dedicated,
            cpu,
            ssdDisks: [dockerDiskSize],
            memory,
            rootFilesystemSize,
            exclusiveFor: 'research',
            planetary,
            mycelium,
            wireguard,
          }"
          v-model="selectionDetails"
        />

        <manage-ssh-deployemnt @selected-keys="updateSSHkeyEnv($event)" />
      </template>

      <template #restore>
        <input-tooltip
          tooltip="The Private Presearch Restore Key is a unique cryptographic key associated with your Presearch account."
        >
          <v-textarea label="Private Presearch Restore Key" v-model="privateRestoreKey" no-resize :spellcheck="false" />
        </input-tooltip>

        <input-tooltip
          tooltip="The Public Presearch Restore Key is a unique cryptographic key associated with your Presearch account."
        >
          <v-textarea label="Public Presearch Restore Key" v-model="publicRestoreKey" no-resize :spellcheck="false" />
        </input-tooltip>
      </template>
    </d-tabs>

    <template #footer-actions="{ validateBeforeDeploy }">
      <v-btn color="secondary" @click="validateBeforeDeploy(deploy)" text="Deploy" />
    </template>
  </weblet-layout>
</template>

<script lang="ts" setup>
import { ref } from "vue";

import { manual } from "@/utils/manual";

import Networks, { useNetworks } from "../components/networks.vue";
import { useLayout } from "../components/weblet_layout.vue";
import { useGrid } from "../stores";
import { type Flist, ProjectName } from "../types";
import { deployVM } from "../utils/deploy_vm";
import { normalizeError } from "../utils/helpers";
import { generateName } from "../utils/strings";

const layout = useLayout();
const tabs = ref();
const name = ref(generateName({ prefix: "ps" }));
const code = ref("");
const { ipv4, ipv6, planetary, mycelium, wireguard } = useNetworks();
const cpu = 1;
const memory = 512;
const rootFilesystemSize = calculateRootFileSystem({ CPUCores: cpu, RAMInMegaBytes: memory });
const dockerDiskSize = 10;
const privateRestoreKey = ref("");
const publicRestoreKey = ref("");
const flist: Flist = {
  value: "https://hub.grid.tf/tf-official-apps/presearch-v2.3.flist",
  entryPoint: "/sbin/zinit init",
};
const dedicated = ref(false);
const certified = ref(false);
const selectionDetails = ref<SelectionDetails>();
const selectedSSHKeys = ref("");
const gridStore = useGrid();
const grid = gridStore.client as GridClient;

async function deploy() {
  layout.value.setStatus("deploy");

  const projectName = ProjectName.Presearch.toLowerCase() + "/" + name.value;

  try {
    layout.value?.validateSSH();
    updateGrid(grid, { projectName });
    await layout.value.validateBalance(grid!);

    const vm = await deployVM(grid!, {
      name: name.value,
      network: { addAccess: wireguard.value },
      machines: [
        {
          name: name.value,
          cpu: cpu,
          memory: memory,
          flist: flist.value,
          entryPoint: flist.entryPoint,
          disks: [
            {
              name: "docker",
              mountPoint: "/var/lib/docker",
              size: dockerDiskSize,
            },
          ],
          planetary: planetary.value,
          publicIpv4: ipv4.value,
          publicIpv6: ipv6.value,
          mycelium: mycelium.value,
          envs: [
            {
              key: "SSH_KEY",
              value: selectedSSHKeys.value,
            },
            {
              key: "PRESEARCH_REGISTRATION_CODE",
              value: code.value,
            },
            {
              key: "PRESEARCH_BACKUP_PRI_KEY",
              value: privateRestoreKey.value,
            },
            {
              key: "PRESEARCH_BACKUP_PUB_KEY",
              value: publicRestoreKey.value,
            },
          ],
          rootFilesystemSize,
          nodeId: selectionDetails.value!.node!.nodeId,
          rentedBy: dedicated.value ? grid!.twinId : undefined,
          certified: certified.value,
        },
      ],
    });

    layout.value.reloadDeploymentsList();
    layout.value.setStatus("success", "Successfully deployed a Presearch instance.");
    layout.value.openDialog(vm, deploymentListEnvironments.presearch);
  } catch (e) {
    layout.value.setStatus("failed", normalizeError(e, "Failed to deploy a Presearch instance."));
  }
}

function updateSSHkeyEnv(selectedKeys: string) {
  selectedSSHKeys.value = selectedKeys;
}
</script>

<script lang="ts">
import { calculateRootFileSystem, type GridClient } from "@threefold/grid_client";

import ManageSshDeployemnt from "../components/ssh_keys/ManageSshDeployemnt.vue";
import { deploymentListEnvironments } from "../constants";
import type { SelectionDetails } from "../types/nodeSelector";
import { updateGrid } from "../utils/grid";

export default {
  name: "TFPresearch",
  component: { ManageSshDeployemnt },
};
</script>
