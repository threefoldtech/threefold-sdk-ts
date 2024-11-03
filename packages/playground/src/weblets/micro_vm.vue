<template>
  <weblet-layout
    ref="layout"
    @mount="layoutMount"
    :cpu="solution?.cpu"
    :memory="solution?.memory"
    :disk="disks.reduce((total, disk) => total + disk.size, solution?.disk ?? 0)"
    :ipv4="ipv4"
    :dedicated="dedicated"
    :SelectedNode="selectionDetails?.node"
    :valid-filters="selectionDetails?.validFilters"
    title-image="images/icons/vm.png"
  >
    <template #title>Deploy a Micro Virtual Machine </template>

    <d-tabs
      :tabs="[
        { title: 'Config', value: 'config' },
        { title: 'Environment Variables', value: 'env' },
        { title: 'Disks', value: 'disks' },
      ]"
      ref="tabs"
    >
      <template #config>
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

        <SelectVmImage :images="images" v-model="flist" />
        <SelectSolutionFlavor
          :small="{ cpu: 1, memory: 2, disk: 25 }"
          :medium="{ cpu: 2, memory: 4, disk: 50 }"
          :large="{ cpu: 4, memory: 16, disk: 100 }"
          v-model="solution"
        />

        <Networks
          required
          v-model:ipv4="ipv4"
          v-model:ipv6="ipv6"
          v-model:planetary="planetary"
          v-model:mycelium="mycelium"
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
            cpu: solution?.cpu,
            ssdDisks: disks.map(disk => disk.size),
            memory: solution?.memory,
            rootFilesystemSize: solution?.disk,
          }"
          v-model="selectionDetails"
        />

        <manage-ssh-deployemnt @selected-keys="updateSSHkeyEnv($event)" />
      </template>

      <template #env>
        <ExpandableLayout
          v-model="envs"
          @add="envs.push({ key: '', value: '' })"
          #="{ index, isRequired }"
          :required="[0]"
        >
          <input-validator
            :value="envs[index].key"
            :rules="[
              validators.required('Key name is required.'),
              (key: string) => validators.isAlpha('Key must start with alphabetical character.')(key[0]),
              validators.pattern('Invalid key format.', { pattern: /^[^0-9_\s][a-zA-Z0-9_]+$/ }),
              validators.maxLength('Key maximum length is 128 characters.', 128),
            ]"
            #="{ props }"
          >
            <input-tooltip tooltip="Environment key.">
              <v-text-field label="Name" v-model="envs[index].key" :disabled="isRequired" v-bind="props" />
            </input-tooltip>
          </input-validator>

          <input-validator
            :value="envs[index].value"
            :rules="[validators.required('Value is required.')]"
            #="{ props }"
          >
            <input-tooltip tooltip="Environment Value.">
              <v-textarea label="Value" v-model="envs[index].value" no-resize :spellcheck="false" />
            </input-tooltip>
          </input-validator>
        </ExpandableLayout>
      </template>

      <template #disks>
        <ExpandableLayout
          v-model="disks"
          @add="addDisk"
          title="Add additional disk space to your micro virtual machine"
          #="{ index }"
        >
          <p class="text-h6 mb-4">Disk #{{ index + 1 }}</p>
          <input-validator
            :value="disks[index].name"
            :rules="[
              validators.required('Disk name is required.'),
              validators.pattern('Disk name can\'t start with a number, a non-alphanumeric character or a whitespace', {
                pattern: /^[A-Za-z]/,
              }),
              validators.minLength('Disk name minimum length is 2 characters.', 2),
              validators.isAlphanumeric('Disk name only accepts alphanumeric characters.'),
              validators.maxLength('Disk name maximum length is 50 characters.', 50),
            ]"
            #="{ props }"
          >
            <input-tooltip tooltip="Disk name.">
              <v-text-field label="Name" v-model="disks[index].name" v-bind="props" />
            </input-tooltip>
          </input-validator>
          <input-validator
            :value="disks[index].size"
            :rules="[
              validators.required('Disk size is required.'),
              validators.isInt('Disk size must be a valid integer.'),
              validators.min('Minimum allowed disk size is 1 GB.', 1),
              validators.max('Maximum allowed disk size is 10000 GB.', 10000),
            ]"
            #="{ props }"
          >
            <input-tooltip tooltip="Disk Size.">
              <v-text-field label="Size (GB)" type="number" v-model.number="disks[index].size" v-bind="props" />
            </input-tooltip>
          </input-validator>
          <input-validator
            :value="disks[index].mountPoint"
            :rules="[
              validators.required('Mount Point is required.'),
              validators.pattern('Mount Point should start with / and have additional characters', {
                pattern: /^\/.+/,
              }),
            ]"
            #="{ props }"
          >
            <input-tooltip tooltip="Disk Size.">
              <v-text-field label="Mount Point" type="text" v-model="disks[index].mountPoint" v-bind="props" />
            </input-tooltip>
          </input-validator>
        </ExpandableLayout>
      </template>
    </d-tabs>

    <template #footer-actions="{ validateBeforeDeploy }">
      <v-btn color="secondary" @click="validateBeforeDeploy(deploy)" text="Deploy" />
    </template>
  </weblet-layout>
</template>

<script lang="ts" setup>
import { type Ref, ref, watch } from "vue";

import { manual } from "@/utils/manual";

import Networks, { useNetworks } from "../components/networks.vue";
import SelectSolutionFlavor from "../components/select_solution_flavor.vue";
import { useLayout } from "../components/weblet_layout.vue";
import { useGrid } from "../stores";
import { type Flist, ProjectName } from "../types";
import { deployVM, type Disk, type Env } from "../utils/deploy_vm";
import { generateName } from "../utils/strings";

const layout = useLayout();
const tabs = ref();

const images = [
  {
    name: "Ubuntu-24.04",
    flist: "https://hub.grid.tf/tf-official-vms/ubuntu-24.04-latest.flist",
    entryPoint: "/sbin/zinit init",
  },
  {
    name: "Ubuntu-23.10",
    flist: "https://hub.grid.tf/tf-official-vms/ubuntu-23.10-mycelium.flist",
    entryPoint: "/sbin/zinit init",
  },
  {
    name: "Ubuntu-22.04",
    flist: "https://hub.grid.tf/tf-official-apps/threefoldtech-ubuntu-22.04.flist",
    entryPoint: "/sbin/zinit init",
  },
  {
    name: "Arch",
    flist: "https://hub.grid.tf/tf-official-vms/arch-mycelium.flist",
    entryPoint: "/sbin/zinit init",
  },
  {
    name: "Debian-12",
    flist: "https://hub.grid.tf/tf-official-apps/threefoldtech-debian-12.flist",
    entryPoint: "/sbin/zinit init",
  },
  {
    name: "Alpine-3",
    flist: "https://hub.grid.tf/tf-official-apps/threefoldtech-alpine-3.flist",
    entryPoint: "/entrypoint.sh",
  },
  {
    name: "CentOS-8",
    flist: "https://hub.grid.tf/tf-official-apps/threefoldtech-centos-8.flist",
    entryPoint: "/entrypoint.sh",
  },
  {
    name: "Nixos",
    flist: "https://hub.grid.tf/tf-official-vms/nixos-micro-latest.flist",
    entryPoint: "/entrypoint.sh",
  },
  {
    name: "BTC Node Mycelium",
    flist: "https://hub.grid.tf/petep.3bot/btc_node-mycelium.flist",
    entryPoint: "/sbin/zinit init",
  },
];

const name = ref(generateName({ prefix: "vm" }));
const flist = ref<Flist>();
const { ipv4, ipv6, planetary, mycelium, wireguard } = useNetworks();
const envs = ref<Env[]>([]);
const disks = ref<Disk[]>([]);
const dedicated = ref(false);
const certified = ref(false);
const selectionDetails = ref<SelectionDetails>();
const selectedSSHKeys = ref("");
const gridStore = useGrid();
const grid = gridStore.client as GridClient;

function layoutMount() {
  if (envs.value.length > 0) {
    envs.value.splice(0, 1);
  }

  envs.value.unshift({
    key: "SSH_KEY",
    value: selectedSSHKeys.value,
  });
}

function addDisk() {
  const name = generateName();
  disks.value.push({
    name: "disk" + name,
    size: 50,
    mountPoint: "/mnt/" + name,
  });
}

async function deploy() {
  layout.value.setStatus("deploy");

  const projectName = ProjectName.VM.toLowerCase() + "/" + name.value;

  try {
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
          flist: flist.value!.value,
          entryPoint: flist.value!.entryPoint,
          disks: disks.value,
          envs: envs.value,
          planetary: planetary.value,
          mycelium: mycelium.value,
          publicIpv4: ipv4.value,
          publicIpv6: ipv6.value,
          rootFilesystemSize: solution.value?.disk,
          nodeId: selectionDetails.value?.node?.nodeId,
          rentedBy: dedicated.value ? grid!.twinId : undefined,
          certified: certified.value,
        },
      ],
    });

    layout.value.reloadDeploymentsList();
    layout.value.setStatus("success", "Successfully deployed a micro virtual machine instance.");
    layout.value.openDialog(vm, deploymentListEnvironments.vm);
  } catch (e) {
    layout.value.setStatus("failed", normalizeError(e, "Failed to deploy micro virtual machine instance."));
  }
}

function updateSSHkeyEnv(selectedKeys: string) {
  selectedSSHKeys.value = selectedKeys;
}

watch(selectedSSHKeys, layoutMount, { deep: true });
</script>

<script lang="ts">
import type { GridClient } from "@threefold/grid_client";

import ExpandableLayout from "../components/expandable_layout.vue";
import SelectVmImage from "../components/select_vm_image.vue";
import ManageSshDeployemnt from "../components/ssh_keys/ManageSshDeployemnt.vue";
import { deploymentListEnvironments } from "../constants";
import type { solutionFlavor as SolutionFlavor } from "../types";
import type { SelectionDetails } from "../types/nodeSelector";
import { updateGrid } from "../utils/grid";
import { normalizeError } from "../utils/helpers";

const solution = ref() as Ref<SolutionFlavor>;

export default {
  name: "MicroVm",
  components: {
    SelectVmImage,
    SelectSolutionFlavor,
    ExpandableLayout,
  },
};
</script>
