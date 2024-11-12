<template>
  <weblet-layout
    ref="layout"
    :cpu="solution?.cpu"
    :memory="solution?.memory"
    :disk="(solution?.disk ?? 0) + rootFilesystemSize"
    :dedicated="dedicated"
    :ipv4="ipv4"
    :SelectedNode="selectionDetails?.node"
    :valid-filters="selectionDetails?.validFilters"
    title-image="images/icons/discourse.png"
  >
    <template #title> Deploy a Discourse Instance </template>
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
          :value="email"
          :rules="[
            validators.required('Email is required.'),
            validators.isEmail('Please provide a valid email address.'),
          ]"
          #="{ props }"
        >
          <input-tooltip tooltip="This email will be used to login to your instance.">
            <v-text-field
              label="Email"
              placeholder="This email will be used to login to your instance."
              v-model="email"
              v-bind="props"
            />
          </input-tooltip>
        </input-validator>

        <SelectSolutionFlavor
          v-model="solution"
          :medium="{ cpu: 2, memory: 4, disk: 50 }"
          :large="{ cpu: 4, memory: 16, disk: 100 }"
        />
        <Networks
          v-model:mycelium="mycelium"
          v-model:planetary="planetary"
          v-model:ipv6="ipv6"
          v-model:wireguard="wireguard"
          :ipv4="ipv4"
          :has-custom-domain="selectionDetails?.domain?.enabledCustomDomain"
          require-domain
          :has-smtp="true"
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
      </template>

      <template #mail>
        <SmtpServer v-model="smtp" persistent tls>
          Discourse needs SMTP service so please configure these settings properly.
        </SmtpServer>
      </template>
    </d-tabs>

    <template #footer-actions="{ validateBeforeDeploy }">
      <v-btn color="secondary" @click="validateBeforeDeploy(deploy)" text="Deploy" />
    </template>
  </weblet-layout>
</template>

<script lang="ts" setup>
import { calculateRootFileSystem, type GridClient } from "@threefold/grid_client";
import { Buffer } from "buffer";
import TweetNACL from "tweetnacl";
import { computed, type Ref, ref, watch } from "vue";

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
const tabs = ref();
const selectionDetails = ref<SelectionDetails>();
const profileManager = useProfileManager();
const name = ref(generateName({ prefix: "dc" }));
const email = ref(profileManager.profile?.email || "");
const solution = ref() as Ref<SolutionFlavor>;
const { ipv4, ipv6, planetary, mycelium, wireguard } = useNetworks({ ipv4: true });
const smtp = ref(createSMTPServer());
const dedicated = ref(false);
const certified = ref(false);
const rootFilesystemSize = computed(() =>
  calculateRootFileSystem({ CPUCores: solution.value?.cpu ?? 0, RAMInMegaBytes: solution.value?.memory ?? 0 }),
);
const flist: Flist = {
  value: "https://hub.grid.tf/tf-official-apps/forum-docker-v3.1.2.flist",
  entryPoint: "/sbin/zinit init",
};
const selectedSSHKeys = ref("");
const gridStore = useGrid();
const grid = gridStore.client as GridClient;

function finalize(deployment: any) {
  layout.value.reloadDeploymentsList();
  layout.value.setStatus("success", "Successfully deployed a Discourse instance.");
  layout.value.openDialog(deployment, deploymentListEnvironments.discourse);
}

async function deploy() {
  layout.value.setStatus("deploy");

  const projectName = ProjectName.Discourse.toLowerCase() + "/" + name.value;

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
    updateGrid(grid, { projectName });
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
          disks: [{ size: solution.value?.disk, mountPoint: "/var/lib/docker" }],
          flist: flist.value,
          entryPoint: flist.entryPoint,
          rootFilesystemSize: rootFilesystemSize.value,
          publicIpv4: ipv4.value,
          publicIpv6: ipv6.value,
          planetary: planetary.value,
          mycelium: mycelium.value,
          envs: [
            { key: "SSH_KEY", value: selectedSSHKeys.value },
            { key: "DISCOURSE_HOSTNAME", value: domain },
            { key: "DISCOURSE_DEVELOPER_EMAILS", value: email.value },
            { key: "DISCOURSE_SMTP_ADDRESS", value: smtp.value.hostname },
            { key: "DISCOURSE_SMTP_PORT", value: smtp.value.port.toString() },
            { key: "DISCOURSE_SMTP_ENABLE_START_TLS", value: smtp.value.tls ? "true" : "false" },
            { key: "DISCOURSE_SMTP_USER_NAME", value: smtp.value.username },
            { key: "DISCOURSE_SMTP_PASSWORD", value: smtp.value.password },
            { key: "THREEBOT_PRIVATE_KEY", value: generatePubKey() },
            { key: "FLASK_SECRET_KEY", value: generatePassword(8) },
          ],
          nodeId: selectionDetails.value!.node!.nodeId,
          rentedBy: dedicated.value ? grid!.twinId : undefined,
          certified: certified.value,
        },
      ],
    });
  } catch (e) {
    return layout.value.setStatus("failed", normalizeError(e, "Failed to deploy a Discourse instance."));
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
      port: 88,
      network: vm[0].interfaces[0].network,
    });

    finalize(vm);
  } catch (e) {
    layout.value.setStatus("deploy", "Rollbacking back due to fail to deploy gateway...");
    await rollbackDeployment(grid!, name.value);
    layout.value.setStatus("failed", normalizeError(e, "Failed to deploy a Discourse instance."));
  }
}

function generatePubKey(): string {
  const keypair = TweetNACL.box.keyPair();
  return Buffer.from(keypair.publicKey).toString("base64");
}

function updateSSHkeyEnv(selectedKeys: string) {
  selectedSSHKeys.value = selectedKeys;
}

watch(
  () => smtp.value.enabled,
  newValue => {
    if (newValue) {
      ipv4.value = true;
    }
  },
);
watch(
  () => ipv4.value,
  newValue => {
    if (!newValue && smtp.value.enabled) {
      smtp.value.enabled = false;
    }
  },
);
</script>

<script lang="ts">
import Networks, { useNetworks } from "../components/networks.vue";
import SelectSolutionFlavor from "../components/select_solution_flavor.vue";
import SmtpServer, { createSMTPServer } from "../components/smtp_server.vue";
import ManageSshDeployemnt from "../components/ssh_keys/ManageSshDeployemnt.vue";
import { deploymentListEnvironments } from "../constants";
import type { SelectionDetails } from "../types/nodeSelector";
import { updateGrid } from "../utils/grid";

export default {
  name: "TfDiscourse",
  components: {
    SmtpServer,
    SelectSolutionFlavor,
    Networks,
    ManageSshDeployemnt,
  },
};
</script>
