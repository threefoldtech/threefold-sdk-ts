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
    title-image="images/icons/static_website.png"
  >
    <template #title>Deploy a Static Website Instance </template>

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

      <input-validator
        :value="gitUrl"
        :rules="[
          validators.required('Git https URL is required.'),
          validators.isURL('Git URL must be a valid  https URL.', {
            protocols: ['https'],
            require_protocol: true,
          }),
        ]"
        :async-rules="[isGithubRepoExist]"
        #="{ props }"
      >
        <input-tooltip tooltip="Git https url to serve.">
          <v-text-field label="Git URL" v-model="gitUrl" v-bind="props" />
        </input-tooltip>
      </input-validator>

      <input-tooltip tooltip="Git Branch name to serve (optional).">
        <v-text-field label="Git Branch" v-model="gitBranch" />
      </input-tooltip>
      <input-tooltip
        tooltip="HTML directory to be served. Please ensure correct casing, as this field is case-sensitive. If the directory is the root of the repository, it should not be added."
      >
        <v-text-field label="HTML Directory" v-model="root" />
      </input-tooltip>

      <SelectSolutionFlavor
        v-model="solution"
        :small="{ cpu: 1, memory: 2, disk: 50 }"
        :medium="{ cpu: 2, memory: 4, disk: 100 }"
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
        }"
        require-domain
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
import { calculateRootFileSystem, type GridClient } from "@threefold/grid_client";
import { computed, type Ref, ref } from "vue";

import { manual } from "@/utils/manual";

import { useLayout } from "../components/weblet_layout.vue";
import { useProfileManager } from "../stores";
import type { Flist, solutionFlavor as SolutionFlavor } from "../types";
import { ProjectName } from "../types";
import { deployVM } from "../utils/deploy_vm";
import { deployGatewayName, getSubdomain, rollbackDeployment } from "../utils/gateway";
import { getGrid } from "../utils/grid";
import { normalizeError } from "../utils/helpers";
import { generateName } from "../utils/strings";

const layout = useLayout();
const profileManager = useProfileManager();
const selectionDetails = ref<SelectionDetails>();

const name = ref(generateName({ prefix: "sw" }));
const gitUrl = ref("");
const gitBranch = ref("");
const root = ref("");
const domain = ref();

const { ipv4, ipv6, planetary, mycelium, wireguard } = useNetworks();
const solution = ref() as Ref<SolutionFlavor>;
const flist: Flist = {
  // Should be upgraded to an oficial Flist
  value: "https://hub.grid.tf/tf-official-apps/staticwebsite-latest.flist",
  entryPoint: "/sbin/zinit init",
};
const dedicated = ref(false);
const certified = ref(false);
const rootFilesystemSize = computed(() =>
  calculateRootFileSystem({ CPUCores: solution.value?.cpu ?? 0, RAMInMegaBytes: solution.value?.memory ?? 0 }),
);
const selectedSSHKeys = ref("");
function updateSSHkeyEnv(selectedKeys: string) {
  selectedSSHKeys.value = selectedKeys;
}

function finalize(deployment: any) {
  layout.value.reloadDeploymentsList();
  layout.value.setStatus("success", "Successfully deployed a Static Website instance.");
  layout.value.openDialog(deployment, deploymentListEnvironments.static_website);
}

async function deploy() {
  layout.value.setStatus("deploy");

  const projectName = ProjectName.StaticWebsite.toLowerCase() + "/" + name.value;

  const subdomain = getSubdomain({
    deploymentName: name.value,
    projectName,
    twinId: profileManager.profile!.twinId,
  });

  if (
    selectionDetails.value?.domain?.customDomain ||
    selectionDetails.value?.domain?.selectedDomain?.publicConfig.domain
  ) {
    domain.value = selectionDetails.value?.domain?.enabledCustomDomain
      ? selectionDetails.value.domain.customDomain
      : subdomain + "." + selectionDetails.value?.domain?.selectedDomain?.publicConfig.domain;
  }

  let grid: GridClient | null;
  let vm: any;

  try {
    layout.value?.validateSSH();
    grid = await getGrid(profileManager.profile!, projectName);

    await layout.value.validateBalance(grid!);

    vm = await deployVM(grid!, {
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
              mountPoint: "/var/lib/docker",
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
            { key: "GITHUB_URL", value: gitUrl.value },
            { key: "GITHUB_BRANCH", value: gitBranch.value },
            { key: "HTML_DIR", value: root.value ? "website/" + root.value : "website" },
            { key: "USER_DOMAIN", value: selectionDetails.value?.domain?.enabledCustomDomain ? domain.value : "" },
            { key: "STATICWEBSITE_DOMAIN", value: domain.value },
          ],
          nodeId: selectionDetails.value!.node!.nodeId,
          rentedBy: dedicated.value ? grid!.twinId : undefined,
          certified: certified.value,
          rootFilesystemSize: rootFilesystemSize.value,
        },
      ],
    });
  } catch (e) {
    return layout.value.setStatus("failed", normalizeError(e, "Failed to deploy a Static Website instance."));
  }
  if (domain.value) {
    if (!selectionDetails.value?.domain?.enableSelectedDomain) {
      vm[0].customDomain = selectionDetails.value?.domain?.customDomain;
      return;
    }

    try {
      layout.value.setStatus("deploy", "Preparing to deploy gateway...");

      await deployGatewayName(grid, selectionDetails.value.domain, {
        subdomain,
        ip: vm[0].interfaces[0].ip,
        port: 9000,
        network: vm[0].interfaces[0].network,
      });
      finalize(vm);
    } catch (e) {
      layout.value.setStatus("deploy", "Rollbacking back due to fail to deploy gateway...");

      await rollbackDeployment(grid!, name.value);
      layout.value.setStatus("failed", normalizeError(e, "Failed to deploy a Static Website instance."));
    }
  }
  finalize(vm);
}

async function isGithubRepoExist(gitUrl: string) {
  if (gitUrl.includes("github.com")) {
    try {
      gitUrl = gitUrl.replace("https://github.com", "");
      gitUrl = gitUrl.replace("/", "");
      gitUrl = gitUrl.replace(".git", "");

      const res = await fetch("https://api.github.com/repos/" + gitUrl);
      if (res.status !== 200) throw new Error();
    } catch (error) {
      return { message: `Github repository doesn't exist.`, isExist: false };
    }
  }
}
</script>

<script lang="ts">
import Networks, { useNetworks } from "../components/networks.vue";
import SelectSolutionFlavor from "../components/select_solution_flavor.vue";
import ManageSshDeployemnt from "../components/ssh_keys/ManageSshDeployemnt.vue";
import { deploymentListEnvironments } from "../constants";
import type { SelectionDetails } from "../types/nodeSelector";

export default {
  name: "TfStaticWebsite",
  components: { SelectSolutionFlavor, Networks, ManageSshDeployemnt },
};
</script>
