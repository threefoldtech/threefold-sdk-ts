<template>
  <weblet-layout
    ref="layout"
    :cpu="solution?.cpu"
    :memory="solution?.memory"
    :disk="disks.reduce((total, disk) => total + disk.size, rootFilesystemSize)"
    :ipv4="ipv4"
    :dedicated="dedicated"
    :SelectedNode="selectionDetails?.node"
    :valid-filters="selectionDetails?.validFilters"
    title-image="images/icons/gitea.png"
  >
    <template #title>Deploy a Gitea Instance</template>

    <d-tabs
      :tabs="[
        { title: 'Config', value: 'config' },
        { title: 'Mail Server', value: 'mail' },
      ]"
      ref="tabs"
    >
      <template #config>
        <input-validator
          :value="name"
          :rules="[
            validators.required('Name is required.'),
            validators.isLowercase('Name should consist of lowercase letters only.'),
            validators.isAlphanumeric('Name should consist of alphabets & numbers only.'),
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
          :has-custom-domain="selectionDetails?.domain?.enabledCustomDomain"
          require-domain
          :has-smtp="smtp.enabled"
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
            solutionDisk: solution?.disk,
            memory: solution?.memory,
            rootFilesystemSize,
          }"
          v-model="selectionDetails"
          require-domain
        />

        <manage-ssh-deployemnt @selected-keys="updateSSHkeyEnv($event)" />
      </template>
      <template #mail>
        <SmtpServer v-model="smtp" email tls ssl>
          Gitea needs SMTP service so please configure these settings properly.
        </SmtpServer>
      </template>
    </d-tabs>

    <template #footer-actions="{ validateBeforeDeploy }">
      <v-btn color="secondary" variant="outlined" @click="validateBeforeDeploy(deploy)" text="Deploy" />
    </template>
  </weblet-layout>
</template>

<script lang="ts" setup>
import { computed, type Ref, ref, watch } from "vue";

import { manual } from "@/utils/manual";

import Networks, { useNetworks } from "../components/networks.vue";
import SelectSolutionFlavor from "../components/select_solution_flavor.vue";
import { useLayout } from "../components/weblet_layout.vue";
import { useGrid, useProfileManager } from "../stores";
import { ProjectName } from "../types";
import { deployVM, type Disk } from "../utils/deploy_vm";
import { generateName } from "../utils/strings";

const layout = useLayout();
const tabs = ref();

const selectionDetails = ref<SelectionDetails>();
const name = ref(generateName({ prefix: "gt" }));
const { ipv4, ipv6, planetary, mycelium, wireguard } = useNetworks();
const disks = ref<Disk[]>([]);
const dedicated = ref(false);
const certified = ref(false);
const rootFilesystemSize = computed(() => solution.value?.disk);
const selectedSSHKeys = ref("");
const smtp = ref(createSMTPServer());
const gridStore = useGrid();
const grid = gridStore.client as GridClient;
const profileManager = useProfileManager();

function finalize(deployment: any) {
  layout.value.reloadDeploymentsList();
  layout.value.setStatus("success", "Successfully deployed a Gitea instance.");
  layout.value.openDialog(deployment, deploymentListEnvironments.gitea);
}

async function deploy() {
  layout.value.setStatus("deploy");

  const projectName = ProjectName.Gitea.toLowerCase() + "/" + name.value;

  let vm: VM[];
  try {
    updateGrid(grid, { projectName });

    const subdomain = getSubdomain({
      deploymentName: name.value,
      projectName,
      twinId: profileManager.profile!.twinId,
    });

    const domain = selectionDetails.value?.domain?.enabledCustomDomain
      ? selectionDetails.value.domain.customDomain
      : subdomain + "." + selectionDetails.value?.domain?.selectedDomain?.publicConfig.domain;

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
          flist: "https://hub.grid.tf/tf-official-apps/gitea-mycelium.flist",
          entryPoint: "/sbin/zinit init",
          disks: disks.value,
          envs: [
            {
              key: "SSH_KEY",
              value: selectedSSHKeys.value,
            },
            {
              key: "GITEA__HOSTNAME",
              value: domain,
            },
            { key: "GITEA__mailer__PROTOCOL", value: "smtp" },
            { key: "GITEA__mailer__ENABLED", value: smtp.value?.enabled.toString() },
            { key: "GITEA__mailer__HOST", value: smtp.value?.hostname },
            { key: "GITEA__mailer__FROM", value: smtp.value?.email },
            { key: "GITEA__mailer__PORT", value: smtp.value?.port.toString() },
            { key: "GITEA__mailer__USER", value: smtp.value?.username },
            { key: "GITEA__mailer__PASSWD", value: smtp.value?.password },
          ],
          planetary: planetary.value,
          mycelium: mycelium.value,
          publicIpv4: ipv4.value,
          publicIpv6: ipv6.value,
          rootFilesystemSize: rootFilesystemSize.value,
          nodeId: selectionDetails.value?.node?.nodeId,
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
        port: 3000,
        network: vm[0].interfaces[0].network,
      });

      finalize(vm);
    } catch (e) {
      layout.value.setStatus("deploy", "Rollbacking back due to fail to deploy gateway...");

      await rollbackDeployment(grid!, name.value);
      layout.value.setStatus("failed", normalizeError(e, "Failed to deploy a Gitea instance."));
    }
  } catch (e) {
    layout.value.setStatus("failed", normalizeError(e, "Failed to deploy a Gitea instance."));
  }
}

function updateSSHkeyEnv(selectedKeys: string) {
  selectedSSHKeys.value = selectedKeys;
}
</script>

<script lang="ts">
import type { GridClient, VM } from "@threefold/grid_client";

import SmtpServer, { createSMTPServer } from "../components/smtp_server.vue";
import ManageSshDeployemnt from "../components/ssh_keys/ManageSshDeployemnt.vue";
import { deploymentListEnvironments } from "../constants";
import type { solutionFlavor as SolutionFlavor } from "../types";
import type { SelectionDetails } from "../types/nodeSelector";
import { deployGatewayName, getSubdomain, rollbackDeployment } from "../utils/gateway";
import { updateGrid } from "../utils/grid";
import { normalizeError } from "../utils/helpers";

const solution = ref() as Ref<SolutionFlavor>;

export default {
  name: "Gitea",
  components: {
    ManageSshDeployemnt,
    SelectSolutionFlavor,
    SmtpServer,
  },
};
</script>
