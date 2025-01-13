<template>
  <weblet-layout
    ref="layout"
    :cpu="solution?.cpu"
    :memory="solution?.memory"
    :disk="(solution?.disk ?? 0) + 10 + rootFilesystemSize"
    :ipv4="ipv4"
    :dedicated="dedicated"
    :SelectedNode="selectionDetails?.node"
    :valid-filters="selectionDetails?.validFilters"
    title-image="images/icons/umbrel.png"
  >
    <template #title>Deploy an Umbrel Instance </template>

    <d-tabs :tabs="[{ title: 'Config', value: 'config' }]">
      <input-validator
        :value="name"
        :rules="[
          validators.required('Name is required.'),
          validators.IsAlphanumericExpectUnderscore('Name should consist of letters ,numbers and underscores only.'),
          (name: string) => validators.isAlpha('Name must start with an alphabetical character.')(name[0]),
          validators.minLength('Name must be at least 2 characters.', 2),
          validators.maxLength('Name cannot exceed 35 characters.', 35),
        ]"
        #="{ props }"
      >
        <input-tooltip tooltip="Instance name.">
          <v-text-field label="Name" v-model="name" v-bind="props" />
        </input-tooltip>
      </input-validator>

      <input-validator
        :value="username"
        :rules="[
          validators.required('Username is required.'),
          validators.isLowercase('Username should consist of lowercase letters only.'),
          validators.isAlphanumeric('Username should consist of letters and numbers only.'),
          (username: string) => validators.isAlpha('Username must start with alphabet char.')(username[0]),
          validators.minLength('Username must be at least 2 characters.', 2),
          validators.maxLength('Username cannot exceed 15 characters.', 15),
        ]"
        #="{ props }"
      >
        <input-tooltip tooltip="Umbrel admin username.">
          <v-text-field label="Username" v-model="username" v-bind="props" />
        </input-tooltip>
      </input-validator>

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
          #="{ props: validatorProps }"
        >
          <input-tooltip tooltip="Umbrel admin password.">
            <v-text-field label="Password" v-model="password" v-bind="{ ...props, ...validatorProps }" />
          </input-tooltip>
        </input-validator>
      </password-input-wrapper>

      <Networks
        required
        v-model:ipv4="ipv4"
        v-model:planetary="planetary"
        v-model:wireguard="wireguard"
        v-model:mycelium="mycelium"
        v-model:ipv6="ipv6"
        :domain="selectionDetails?.domain"
      />

      <SelectSolutionFlavor
        v-model="solution"
        :small="{ cpu: 1, memory: 2, disk: 10 }"
        :medium="{ cpu: 2, memory: 4, disk: 50 }"
        :large="{ cpu: 4, memory: 16, disk: 100 }"
      />

      <input-tooltip inline tooltip="Click to know more about dedicated machines." :href="manual.dedicated_machines">
        <v-switch color="primary" inset label="Dedicated" v-model="dedicated" hide-details />
      </input-tooltip>

      <input-tooltip inline tooltip="Renting capacity on certified nodes is charged 25% extra.">
        <v-switch color="primary" inset label="Certified" v-model="certified" hide-details />
      </input-tooltip>

      <TfSelectionDetails
        :filters-validators="{
          solutionDisk: { min: 10 },
        }"
        :filters="{
          ipv4,
          ipv6,
          certified,
          dedicated,
          cpu: solution?.cpu,
          solutionDisk: solution?.disk,
          ssdDisks: [10],
          memory: solution?.memory,
          rootFilesystemSize,
          planetary,
          mycelium,
          wireguard,
        }"
        v-model="selectionDetails"
      />

      <manage-ssh-deployemnt @selected-keys="updateSSHkeyEnv($event)" />
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
import { computed, type Ref, ref } from "vue";

import { manual } from "@/utils/manual";

import Networks, { useNetworks } from "../components/networks.vue";
import { useLayout } from "../components/weblet_layout.vue";
import { useGrid } from "../stores";
import type { Flist, solutionFlavor as SolutionFlavor } from "../types";
import { ProjectName } from "../types";
import { deployVM } from "../utils/deploy_vm";
import { normalizeError } from "../utils/helpers";
import { generateName, generatePassword } from "../utils/strings";

const layout = useLayout();
const selectionDetails = ref<SelectionDetails>();

const name = ref(generateName({ prefix: "um" }));
const username = ref("admin");
const password = ref(generatePassword());
const { ipv4, ipv6, planetary, mycelium, wireguard } = useNetworks();
const solution = ref() as Ref<SolutionFlavor>;
const flist: Flist = {
  value: "https://hub.grid.tf/tf-official-apps/umbrel-latest.flist",
  entryPoint: "/sbin/zinit init",
};
const dedicated = ref(false);
const certified = ref(false);
const rootFilesystemSize = computed(() =>
  calculateRootFileSystem({ CPUCores: solution.value?.cpu ?? 0, RAMInMegaBytes: solution.value?.memory ?? 0 }),
);
const selectedSSHKeys = ref("");
const gridStore = useGrid();
const grid = gridStore.client as GridClient;

async function deploy() {
  layout.value.setStatus("deploy");

  const projectName = ProjectName.Umbrel.toLowerCase() + "/" + name.value;

  try {
    layout.value?.validateSSH();
    updateGrid(grid, { projectName });

    await layout.value.validateBalance(grid!);

    const vm = await deployVM(grid!, {
      name: name.value,
      network: {
        addAccess: wireguard.value,
      },
      machines: [
        {
          name: name.value,
          cpu: solution.value.cpu,
          memory: solution.value.memory,
          disks: [
            {
              size: 10,
              mountPoint: "/var/lib/docker",
            },
            {
              size: solution.value.disk,
              mountPoint: "/umbrelDisk",
            },
          ],
          flist: flist.value,
          entryPoint: flist.entryPoint,
          planetary: planetary.value,
          mycelium: mycelium.value,
          publicIpv4: ipv4.value,
          publicIpv6: ipv6.value,
          envs: [
            { key: "SSH_KEY", value: selectedSSHKeys.value },
            { key: "USERNAME", value: username.value },
            { key: "PASSWORD", value: password.value },
            { key: "UMBREL_DISK", value: "/umbrelDisk" },
          ],
          rootFilesystemSize: rootFilesystemSize.value,
          nodeId: selectionDetails.value!.node!.nodeId,
          rentedBy: dedicated.value ? grid!.twinId : undefined,
          certified: certified.value,
        },
      ],
    });

    layout.value.reloadDeploymentsList();
    layout.value.setStatus("success", "Successfully deployed an Umbrel instance.");
    layout.value.openDialog(vm, deploymentListEnvironments.umbrel);
  } catch (e) {
    layout.value.setStatus("failed", normalizeError(e, "Failed to deploy an Umbrel instance."));
  }
}

function updateSSHkeyEnv(selectedKeys: string) {
  selectedSSHKeys.value = selectedKeys;
}
</script>

<script lang="ts">
import { calculateRootFileSystem, type GridClient } from "@threefold/grid_client";

import { updateGrid } from "@/utils/grid";

import SelectSolutionFlavor from "../components/select_solution_flavor.vue";
import ManageSshDeployemnt from "../components/ssh_keys/ManageSshDeployemnt.vue";
import { deploymentListEnvironments } from "../constants";
import type { SelectionDetails } from "../types/nodeSelector";

export default {
  name: "TfUmbrel",
  components: { SelectSolutionFlavor, ManageSshDeployemnt },
};
</script>
