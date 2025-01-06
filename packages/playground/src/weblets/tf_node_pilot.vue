<template>
  <weblet-layout
    ref="layout"
    :cpu="solution?.cpu"
    :memory="solution?.memory"
    :disk="solution?.disk"
    :dedicated="dedicated"
    ipv4
    :SelectedNode="selectionDetails?.node"
    :valid-filters="selectionDetails?.validFilters"
    title-image="images/icons/vm.png"
  >
    <template #title>Deploy a Node Pilot Instance</template>
    <d-tabs :tabs="[{ title: 'Config', value: 'config' }]">
      <input-validator
        :value="name"
        :rules="[
          validators.required('Name is required.'),
          validators.IsAlphanumericExpectUnderscore('Name should consist of letters ,numbers and underscores only.'),
          (name: string) => validators.isAlpha('Name must start with an alphabetical character.')(name[0]),
          validators.minLength('Name must be at least 2 characters.', 2),
          validators.maxLength('Name cannot exceed 15 characters.', 15),
        ]"
        #="{ props }"
      >
        <input-tooltip tooltip="Instance name.">
          <v-text-field label="Name" v-model="name" v-bind="props" />
        </input-tooltip>
      </input-validator>

      <SelectSolutionFlavor
        :small="{ cpu: 4, memory: 8, disk: 500 }"
        :medium="{ cpu: 8, memory: 16, disk: 1000 }"
        :large="{ cpu: 8, memory: 32, disk: 2000 }"
        v-model="solution"
      />

      <Networks
        required
        :ipv4="ipv4"
        :ipv6="ipv6"
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
          ipv4: ipv4,
          certified,
          dedicated,
          cpu: solution?.cpu,
          memory: solution?.memory,
          solutionDisk: solution?.disk,
          rootFilesystemSize,
        }"
        v-model="selectionDetails"
        require-domain
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
import { type Ref, ref } from "vue";

import { manual } from "@/utils/manual";

import Networks, { useNetworks } from "../components/networks.vue";
import { useLayout } from "../components/weblet_layout.vue";
import { useGrid, useProfileManager } from "../stores";
import { type Flist, ProjectName } from "../types";
import { deployVM } from "../utils/deploy_vm";
import { generateName } from "../utils/strings";
const layout = useLayout();
const name = ref(generateName({ prefix: "np" }));
const selectionDetails = ref<SelectionDetails>();

const solution = ref() as Ref<SolutionFlavor>;
const flist: Flist = {
  value: "https://hub.grid.tf/tf-official-vms/node-pilot-zdbfs.flist",
  entryPoint: "/",
};
const { ipv4, ipv6, planetary, mycelium, wireguard } = useNetworks({ ipv4: true, ipv6: true });
const dedicated = ref(false);
const certified = ref(false);
const rootFilesystemSize = 2;
const selectedSSHKeys = ref("");
const gridStore = useGrid();
const grid = gridStore.client as GridClient;
const profileManager = useProfileManager();

function finalize(deployment: any) {
  layout.value.reloadDeploymentsList();
  layout.value.setStatus("success", "Successfully deployed a Node Pilot instance.");
  layout.value.openDialog(deployment, deploymentListEnvironments.nodepilot);
}
async function deploy() {
  layout.value.setStatus("deploy");

  const projectName = ProjectName.NodePilot.toLowerCase() + "/" + name.value;

  const subdomain = getSubdomain({
    deploymentName: name.value,
    projectName,
    twinId: profileManager.profile!.twinId,
  });

  const domain = selectionDetails.value?.domain?.enabledCustomDomain
    ? selectionDetails.value.domain.customDomain
    : subdomain + "." + selectionDetails.value?.domain?.selectedDomain?.publicConfig.domain;

  let vm: VM[];

  try {
    layout.value?.validateSSH();
    updateGrid(grid, { projectName });

    await layout.value.validateBalance(grid!);
    vm = await deployVM(grid!, {
      name: name.value,
      network: {
        addAccess: wireguard.value || selectionDetails.value!.domain!.enableSelectedDomain,
        accessNodeId: selectionDetails.value!.domain?.selectedDomain?.nodeId,
      },
      machines: [
        {
          name: name.value,
          cpu: solution.value.cpu,
          memory: solution.value.memory,
          flist: flist.value,
          entryPoint: flist.entryPoint,
          publicIpv4: ipv4.value,
          publicIpv6: ipv6.value,
          planetary: planetary.value,
          mycelium: mycelium.value,
          envs: [
            { key: "SSH_KEY", value: selectedSSHKeys.value },
            { key: "NODE_PILOT_HOSTNAME", value: domain },
          ],
          rootFilesystemSize,
          disks: [
            {
              size: solution.value.disk,
              mountPoint: "/",
            },
          ],
          nodeId: selectionDetails.value!.node!.nodeId,
          rentedBy: dedicated.value ? grid!.twinId : undefined,
          certified: certified.value,
        },
      ],
    });
    if (!selectionDetails.value?.domain?.enableSelectedDomain) {
      vm[0].customDomain = selectionDetails.value?.domain?.customDomain;
      finalize(vm);
      return;
    }

    try {
      layout.value.setStatus("deploy", "Preparing to deploy gateway...");
      await deployGatewayName(grid, selectionDetails.value.domain, {
        subdomain,
        ip: vm[0].interfaces[0].ip,
        port: 34416,
        network: vm[0].interfaces[0].network,
      });

      finalize(vm);
    } catch (e) {
      layout.value.setStatus("deploy", "Rollbacking back due to fail to deploy gateway...");

      await rollbackDeployment(grid!, name.value);
      layout.value.setStatus("failed", normalizeError(e, "Failed to deploy a Node Pilot instance."));
    }
  } catch (e) {
    layout.value.setStatus("failed", normalizeError(e, "Failed to deploy a Node Pilot instance."));
  }
}

function updateSSHkeyEnv(selectedKeys: string) {
  selectedSSHKeys.value = selectedKeys;
}
</script>

<script lang="ts">
import type { GridClient, VM } from "@threefold/grid_client";

import SelectSolutionFlavor from "../components/select_solution_flavor.vue";
import ManageSshDeployemnt from "../components/ssh_keys/ManageSshDeployemnt.vue";
import { deploymentListEnvironments } from "../constants";
import type { solutionFlavor as SolutionFlavor } from "../types";
import type { SelectionDetails } from "../types/nodeSelector";
import { deployGatewayName, getSubdomain, rollbackDeployment } from "../utils/gateway";
import { updateGrid } from "../utils/grid";
import { normalizeError } from "../utils/helpers";

export default {
  name: "NodePilot",
  components: { ManageSshDeployemnt, SelectSolutionFlavor },
};
</script>
