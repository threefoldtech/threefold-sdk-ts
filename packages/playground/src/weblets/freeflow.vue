<template>
  <weblet-layout
    ref="layout"
    :cpu="solution?.cpu"
    :memory="solution?.memory"
    :disk="solution?.disk"
    :certified="certified"
    :dedicated="dedicated"
    :ipv4="ipv4"
    :SelectedNode="selectionDetails?.node"
    :valid-filters="selectionDetails?.validFilters"
    title-image="images/icons/freeflow.png"
  >
    <template #title>Deploy a Freeflow Instance </template>

    <d-tabs :tabs="[{ title: 'Config', value: 'config' }]">
      <input-validator
        :value="threebotName"
        :rules="[
          validators.required('Name is required.'),
          validators.IsAlphanumericExpectUnderscore('Name should consist of letters ,numbers and underscores only.'),
          validators.minLength('Name must be at least 4 characters.', 4),
          validators.maxLength('Name cannot exceed 50 characters.', 50),
        ]"
        #="{ props }"
      >
        <input-tooltip
          tooltip="
          To locate your 3Bot name, please follow these steps:
          
          1. Open the ThreeFold Connect app on your device.
          2. Access the app's settings section.
          3. Within the settings, you will find your registered 3Bot name.

          Please note that your 3Bot name is the name you provided during the registration process in the ThreeFold Connect app. Should you encounter any difficulties or have further questions, please don't hesitate to reach out for assistance.
          "
        >
          <v-text-field label="3bot name" v-model="threebotName" v-bind="props" />
        </input-tooltip>
      </input-validator>

      <SelectSolutionFlavor
        v-model="solution"
        :small="{ cpu: 1, memory: 4, disk: 100 }"
        :medium="{ cpu: 2, memory: 16, disk: 500 }"
        :large="{ cpu: 4, memory: 32, disk: 1000 }"
      />

      <Networks
        required
        v-model:ipv4="ipv4"
        v-model:ipv6="ipv6"
        v-model:planetary="planetary"
        v-model:mycelium="mycelium"
        v-model:wireguard="wireguard"
        :has-custom-domain="selectionDetails?.domain?.enabledCustomDomain"
        require-domain
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
          solutionDisk: solution?.disk,
          memory: solution?.memory,
          rootFilesystemSize,
          ssdDisks: disks.map(d => d.size),
          planetary,
          mycelium,
        }"
        require-domain
        v-model="selectionDetails"
      />

      <manage-ssh-deployemnt @selected-keys="updateSSHkeyEnv($event)" />
    </d-tabs>

    <template #footer-actions="{ validateBeforeDeploy }">
      <v-btn color="secondary" @click="validateBeforeDeploy(deploy)" text="Deploy" />
    </template>
  </weblet-layout>
</template>

<script lang="ts" setup>
import { calculateRootFileSystem, type GridClient } from "@threefold/grid_client";
import { computed, onMounted, type Ref, ref } from "vue";

import { manual } from "@/utils/manual";

import { useLayout } from "../components/weblet_layout.vue";
import { useGrid } from "../stores";
import type { Flist, solutionFlavor as SolutionFlavor } from "../types";
import { ProjectName } from "../types";
import { deployVM, type Disk } from "../utils/deploy_vm";
import { deployGatewayName, rollbackDeployment } from "../utils/gateway";
import { normalizeError } from "../utils/helpers";

const layout = useLayout();

const selectionDetails = ref<SelectionDetails>();
const threebotName = ref<string>("");
const solution = ref() as Ref<SolutionFlavor>;
const flist = ref<Flist>();
const disks = ref<Disk[]>([]);
const dedicated = ref(false);
const certified = ref(false);
const { ipv4, ipv6, wireguard, planetary, mycelium } = useNetworks();
const rootFilesystemSize = computed(() =>
  calculateRootFileSystem({ CPUCores: solution.value?.cpu ?? 0, RAMInMegaBytes: solution.value?.memory ?? 0 }),
);
const selectedSSHKeys = ref("");
const gridStore = useGrid();
const grid = gridStore.client as GridClient;

onMounted(() => {
  disks.value.push({
    name: "disk",
    size: solution?.value?.disk,
    mountPoint: "/disk",
  });

  flist.value = {
    value: "https://hub.grid.tf/lennertapp2.3bot/threefoldjimber-freeflow-latest.flist",
    entryPoint: "/sbin/zinit init",
  };
});

function finalize(deployment: any) {
  layout.value.reloadDeploymentsList();
  layout.value.setStatus("success", "Successfully deployed a Freeflow instance.");
  layout.value.openDialog(deployment, deploymentListEnvironments.freeflow);
}

async function deploy() {
  layout.value.setStatus("deploy");

  const projectName = ProjectName.FreeFlow.toLowerCase() + "/" + threebotName.value;

  const domain = selectionDetails.value!.domain!.enabledCustomDomain
    ? selectionDetails.value!.domain!.customDomain
    : threebotName.value + "." + selectionDetails.value!.domain!.selectedDomain!.publicConfig.domain;

  let vm: any;

  try {
    layout.value?.validateSSH();
    updateGrid(grid, { projectName });

    await layout.value.validateBalance(grid!);

    vm = await deployVM(grid!, {
      name: threebotName.value,
      network: {
        addAccess: wireguard.value || selectionDetails.value!.domain!.enableSelectedDomain,
        accessNodeId: selectionDetails.value!.domain!.selectedDomain?.nodeId,
      },
      machines: [
        {
          name: threebotName.value,
          cpu: solution.value.cpu,
          memory: solution.value.memory,
          disks: disks.value,
          flist: flist?.value!.value,
          entryPoint: flist.value!.entryPoint,
          publicIpv4: ipv4.value,
          publicIpv6: ipv6.value,
          planetary: planetary.value,
          mycelium: mycelium.value,
          envs: [
            { key: "SSH_KEY", value: selectedSSHKeys.value },
            { key: "USER_ID", value: threebotName.value },
            { key: "DIGITALTWIN_APPID", value: domain },
            { key: "NODE_ENV", value: "staging" },
          ],
          nodeId: selectionDetails.value!.node!.nodeId,
          rentedBy: dedicated.value ? grid!.twinId : undefined,
          certified: certified.value,
          rootFilesystemSize: rootFilesystemSize.value,
        },
      ],
    });
  } catch (e) {
    return layout.value.setStatus("failed", normalizeError(e, "Failed to deploy a Freeflow instance."));
  }

  if (!selectionDetails.value?.domain?.enableSelectedDomain) {
    vm[0].customDomain = selectionDetails.value?.domain?.customDomain;
    finalize(vm);
    return;
  }

  try {
    layout.value.setStatus("deploy", "Preparing to deploy gateway...");

    await deployGatewayName(grid, selectionDetails.value.domain, {
      subdomain: threebotName.value,
      ip: vm[0].interfaces[0].ip,
      port: 80,
      network: vm[0].interfaces[0].network,
    });

    finalize(vm);
  } catch (e) {
    layout.value.setStatus("deploy", "Rollbacking back due to fail to deploy gateway...");

    await rollbackDeployment(grid!, threebotName.value);
    layout.value.setStatus("failed", normalizeError(e, "Failed to deploy a Freeflow instance."));
  }
}

function updateSSHkeyEnv(selectedKeys: string) {
  selectedSSHKeys.value = selectedKeys;
}
</script>

<script lang="ts">
import Networks, { useNetworks } from "../components/networks.vue";
import SelectSolutionFlavor from "../components/select_solution_flavor.vue";
import ManageSshDeployemnt from "../components/ssh_keys/ManageSshDeployemnt.vue";
import { deploymentListEnvironments } from "../constants";
import type { SelectionDetails } from "../types/nodeSelector";
import { updateGrid } from "../utils/grid";

export default {
  name: "TFFreeflow",
  components: { SelectSolutionFlavor, Networks, ManageSshDeployemnt },
};
</script>
