<template>
  <weblet-layout
    ref="layout"
    :cpu="solution?.cpu"
    :memory="solution?.memory"
    :disk="solution?.disk"
    :ipv4="ipv4"
    :dedicated="dedicated"
    :SelectedNode="selectionDetails?.node"
    :valid-filters="selectionDetails?.validFilters"
    title-image="images/icons/wordpress.png"
  >
    <template #title>Deploy a Wordpress Instance </template>

    <d-tabs :tabs="[{ title: 'Config', value: 'config' }]">
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
        <input-tooltip tooltip="Wordpress admin username.">
          <v-text-field label="Username" v-model="username" v-bind="{ ...props }" />
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
          <input-tooltip tooltip="Wordpress admin password.">
            <v-text-field label="Password" v-model="password" v-bind="{ ...props, ...validatorProps }" />
          </input-tooltip>
        </input-validator>
      </password-input-wrapper>

      <input-validator
        :value="email"
        :rules="[
          validators.required('Email is required.'),
          validators.isEmail('Please provide a valid email address.'),
        ]"
        #="{ props }"
      >
        <input-tooltip tooltip="Wordpress admin email.">
          <v-text-field
            label="Email"
            placeholder="This email will be used to login to your instance."
            v-model="email"
            v-bind="{ ...props }"
          />
        </input-tooltip>
      </input-validator>

      <SelectSolutionFlavor
        v-model="solution"
        :medium="{ cpu: 2, memory: 4, disk: 50 }"
        :large="{ cpu: 4, memory: 16, disk: 100 }"
      />

      <Networks
        v-model:ipv4="ipv4"
        v-model:mycelium="mycelium"
        v-model:planetary="planetary"
        v-model:ipv6="ipv6"
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
          planetary,
          mycelium,
          wireguard,
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
import { computed, type Ref, ref } from "vue";

import { updateGrid } from "@/utils/grid";
import { manual } from "@/utils/manual";

import { useLayout } from "../components/weblet_layout.vue";
import { useGrid, useProfileManager } from "../stores";
import type { Flist, solutionFlavor as SolutionFlavor } from "../types";
import { ProjectName } from "../types";
import { deployVM } from "../utils/deploy_vm";
import { deployGatewayName, getSubdomain, rollbackDeployment } from "../utils/gateway";
import { normalizeError } from "../utils/helpers";
import { generateName, generatePassword } from "../utils/strings";

const layout = useLayout();
const profileManager = useProfileManager();
const selectionDetails = ref<SelectionDetails>();

const name = ref(generateName({ prefix: "wp" }));
const username = ref("admin");
const email = ref(profileManager.profile?.email || "");
const password = ref(generatePassword());
const solution = ref() as Ref<SolutionFlavor>;
const flist: Flist = {
  value: "https://hub.grid.tf/tf-official-apps/tf-wordpress-latest.flist",
  entryPoint: "/sbin/zinit init",
};
const dedicated = ref(false);
const certified = ref(false);
const { ipv4, ipv6, planetary, mycelium, wireguard } = useNetworks();
const rootFilesystemSize = computed(() =>
  calculateRootFileSystem({ CPUCores: solution.value?.cpu ?? 0, RAMInMegaBytes: solution.value?.memory ?? 0 }),
);
const selectedSSHKeys = ref("");
const gridStore = useGrid();
const grid = gridStore.client as GridClient;
function finalize(deployment: any) {
  layout.value.reloadDeploymentsList();
  layout.value.setStatus("success", "Successfully deployed a Wordpress instance.");
  layout.value.openDialog(deployment, deploymentListEnvironments.wordpress);
}
async function deploy() {
  layout.value.setStatus("deploy");

  const projectName = ProjectName.Wordpress.toLowerCase() + "/" + name.value;
  updateGrid(grid, { projectName });

  const subdomain = getSubdomain({
    deploymentName: name.value,
    projectName,
    twinId: profileManager.profile!.twinId,
  });

  const domain = selectionDetails.value?.domain?.enabledCustomDomain
    ? selectionDetails.value.domain.customDomain
    : subdomain + "." + selectionDetails.value?.domain?.selectedDomain?.publicConfig.domain;

  let vm: any;
  try {
    layout.value?.validateSSH();
    await layout.value.validateBalance(grid);

    vm = await deployVM(grid, {
      name: name.value,
      network: {
        addAccess: wireguard.value || selectionDetails.value!.domain!.enableSelectedDomain,
        accessNodeId: selectionDetails.value?.domain?.selectedDomain?.nodeId,
      },
      machines: [
        {
          name: name.value,
          cpu: solution.value.cpu,
          memory: solution.value.memory,
          disks: [
            {
              size: solution.value.disk,
              mountPoint: "/var/www/html",
            },
          ],
          flist: flist.value,
          entryPoint: flist.entryPoint,
          publicIpv4: ipv4.value,
          publicIpv6: ipv6.value,
          mycelium: mycelium.value,
          planetary: planetary.value,
          envs: [
            { key: "SSH_KEY", value: selectedSSHKeys.value },
            { key: "MYSQL_USER", value: username.value },
            { key: "MYSQL_PASSWORD", value: password.value },
            { key: "ADMIN_EMAIL", value: email.value },
            { key: "WP_URL", value: domain },
          ],
          nodeId: selectionDetails.value!.node!.nodeId,
          rentedBy: dedicated.value ? grid!.twinId : undefined,
          certified: certified.value,
          rootFilesystemSize: rootFilesystemSize.value,
        },
      ],
    });
  } catch (e) {
    return layout.value.setStatus("failed", normalizeError(e, "Failed to deploy a Wordpress instance."));
  }

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
      port: 80,
      network: vm[0].interfaces[0].network,
    });

    finalize(vm);
  } catch (e) {
    layout.value.setStatus("deploy", "Rollbacking back due to fail to deploy gateway...");

    await rollbackDeployment(grid, name.value);
    layout.value.setStatus("failed", normalizeError(e, "Failed to deploy a Wordpress instance."));
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

export default {
  name: "TFWordpress",
  components: { SelectSolutionFlavor, Networks, ManageSshDeployemnt },
};
</script>
