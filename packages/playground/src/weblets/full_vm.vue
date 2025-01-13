<template>
  <weblet-layout
    ref="layout"
    :cpu="solution?.cpu"
    :memory="solution?.memory"
    :disk="disks.reduce((total, disk) => total + disk.size, solution?.disk + 2)"
    :ipv4="ipv4"
    :dedicated="dedicated"
    :SelectedNode="selectionDetails?.node"
    :valid-filters="selectionDetails?.validFilters"
    title-image="images/icons/vm.png"
  >
    <template #title> Deploy a Full Virtual Machine </template>

    <d-tabs
      :tabs="[
        { title: 'Config', value: 'config' },
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
            validators.maxLength('Name cannot exceed 35 characters.', 35),
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
        <input-tooltip
          inline
          tooltip="
          Selecting a Node with GPU.
          When selecting a node with GPU resources, please make sure that you have a rented node. To rent a node and gain access to GPU capabilities, you can use our dashboard.
          "
        >
          <v-switch color="primary" inset label="GPU" v-model="hasGPU" hide-details />
        </input-tooltip>
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
            hasGPU,
            certified,
            dedicated,
            cpu: solution?.cpu,
            ssdDisks: disks.map(disk => disk.size),
            solutionDisk: solution?.disk,
            memory: solution?.memory,
            rootFilesystemSize,
          }"
          v-model="selectionDetails"
        />

        <!-- Manage the selected keys and send them to the deployment as env var -->
        <manage-ssh-deployemnt @selected-keys="updateSSHkeyEnv($event)" />
      </template>

      <template #disks>
        <ExpandableLayout
          v-model="disks"
          @add="addDisk"
          title="Add additional disk space to your full virtual machine"
          #="{ index }"
        >
          <p class="text-h6 mb-4">Disk #{{ index + 1 }}</p>
          <input-validator
            :value="disks[index].name"
            :rules="[
              validators.required('Disk name is required.'),
              (name: string) => validators.isAlpha('Name must start with an alphabetical character.')(name[0]), 
              validators.minLength('Disk name minimum length is 2 characters.', 2), 
              validators.isAlphanumeric('Disk name only accepts alphanumeric characters.'),
              validators.maxLength('Disk name maximum length is 35 characters.', 35),
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
import { computed, type Ref, ref, watch } from "vue";

import { manual } from "@/utils/manual";

import Networks, { useNetworks } from "../components/networks.vue";
import { useLayout } from "../components/weblet_layout.vue";
import { useGrid } from "../stores";
import type { solutionFlavor as SolutionFlavor } from "../types";
import { type Flist, ProjectName } from "../types";
import { deployVM, type Disk } from "../utils/deploy_vm";
import { normalizeError } from "../utils/helpers";
import { generateName } from "../utils/strings";

const selectionDetails = ref<SelectionDetails>();

const layout = useLayout();
const tabs = ref();
const solution = ref() as Ref<SolutionFlavor>;
const images: VmImage[] = [
  {
    name: "Ubuntu-24.04",
    flist: "https://hub.grid.tf/tf-official-vms/ubuntu-24.04-full.flist",
    entryPoint: "",
  },
  {
    name: "Ubuntu-22.04",
    flist: "https://hub.grid.tf/tf-official-vms/ubuntu-22.04.flist",
    entryPoint: "/init.sh",
  },
  {
    name: "Ubuntu-20.04",
    flist: "https://hub.grid.tf/tf-official-vms/ubuntu-20.04-lts.flist",
    entryPoint: "/init.sh",
  },
  {
    name: "Ubuntu-18.04",
    flist: "https://hub.grid.tf/tf-official-vms/ubuntu-18.04-lts.flist",
    entryPoint: "/init.sh",
  },
  {
    name: "Nixos-22.11",
    flist: "https://hub.grid.tf/tf-official-vms/nixos-22.11.flist",
    entryPoint: "/init.sh",
  },
];

const selectedSSHKeys = ref("");
const name = ref(generateName({ prefix: "vm" }));
const flist = ref<Flist>();
const { ipv4, ipv6, mycelium, planetary, wireguard } = useNetworks();
const dedicated = ref(false);
const certified = ref(false);
const disks = ref<Disk[]>([]);
const hasGPU = ref(false);
const rootFilesystemSize = computed(() =>
  flist.value?.name === "Ubuntu-24.04" || flist.value?.name === "Other" ? solution.value?.disk : 2,
);
const gridStore = useGrid();
const grid = gridStore.client as GridClient;

function addDisk() {
  const name = generateName();
  disks.value.push({
    name: "disk" + name,
    size: 50,
    mountPoint: "/mnt/" + name,
  });
}

watch(
  dedicated,
  dedicated => {
    if (dedicated === false) {
      hasGPU.value = dedicated;
    }
  },
  { immediate: true },
);

watch(
  hasGPU,
  hasGPU => {
    if (hasGPU) {
      dedicated.value = true;
    }
  },
  { immediate: true },
);

async function deploy() {
  layout.value.setStatus("deploy");

  const projectName = ProjectName.Fullvm.toLowerCase() + "/" + name.value;

  try {
    layout.value?.validateSSH();
    updateGrid(grid, { projectName });

    await layout.value.validateBalance(grid!);

    const vm = await deployVM(grid!, {
      name: name.value,
      machines: [
        {
          name: name.value,
          cpu: solution.value.cpu,
          memory: solution.value.memory,
          flist: flist.value!.value,
          entryPoint: flist.value!.entryPoint,
          disks:
            flist.value?.name === "Ubuntu-24.04" || flist.value?.name === "Other"
              ? [...disks.value]
              : [{ size: solution?.value.disk, mountPoint: "/" }, ...disks.value],
          publicIpv4: ipv4.value,
          publicIpv6: ipv6.value,
          planetary: planetary.value,
          mycelium: mycelium.value,
          envs: [{ key: "SSH_KEY", value: selectedSSHKeys.value }],
          rootFilesystemSize: rootFilesystemSize.value,
          hasGPU: hasGPU.value,
          nodeId: selectionDetails.value?.node?.nodeId,
          gpus: hasGPU.value ? selectionDetails.value?.gpuCards.map(card => card.id) : undefined,
          rentedBy: dedicated.value ? grid!.twinId : undefined,
          certified: certified.value,
        },
      ],
      network: { addAccess: wireguard.value },
    });

    layout.value.reloadDeploymentsList();
    layout.value.setStatus("success", "Successfully deployed a full virtual machine instance.");
    layout.value.openDialog(vm, deploymentListEnvironments.vm);
  } catch (e) {
    layout.value.setStatus("failed", normalizeError(e, "Failed to deploy a full virtual machine instance."));
  }
}

function updateSSHkeyEnv(selectedKeys: string) {
  selectedSSHKeys.value = selectedKeys;
}
</script>

<script lang="ts">
import type { GridClient } from "@threefold/grid_client";

import ExpandableLayout from "../components/expandable_layout.vue";
import SelectSolutionFlavor from "../components/select_solution_flavor.vue";
import SelectVmImage, { type VmImage } from "../components/select_vm_image.vue";
import ManageSshDeployemnt from "../components/ssh_keys/ManageSshDeployemnt.vue";
import { deploymentListEnvironments } from "../constants";
import type { SelectionDetails } from "../types/nodeSelector";
import { updateGrid } from "../utils/grid";

export default {
  name: "FullVm",
  components: {
    SelectVmImage,
    SelectSolutionFlavor,
    ExpandableLayout,
    ManageSshDeployemnt,
  },
};
</script>
