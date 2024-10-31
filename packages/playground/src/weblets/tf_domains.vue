<template>
  <weblet-layout ref="layout">
    <template #title
      ><span><v-icon class="pr-3">mdi-web-box</v-icon></span
      >Deploy Domains Instance
    </template>

    <d-tabs :tabs="[{ title: 'Config', value: 'config' }]">
      <template #config>
        <input-tooltip tooltip="Selecting Custom Domain sets the subdomain as the gateway name.">
          <input-validator
            :value="subdomain"
            :rules="[
              validators.required('Subdomain is required.'),
              validators.isLowercase('Subdomain should consist of lowercase letters only.'),
              validators.isAlphanumeric('Subdomain should consist of letters and numbers only.'),
              subdomain => validators.isAlpha('Subdomain must start with alphabet char.')(subdomain[0]),
              validators.minLength('Subdomain must be at least 4 characters.', 4),
              subdomain => validators.maxLength('Subdomain cannot exceed 50 characters.', 50)(subdomain),
            ]"
            :async-rules="[validateSubdomain]"
            #="{ props }"
          >
            <v-text-field label="Subdomain" v-model.trim="subdomain" v-bind="props" />
          </input-validator>
        </input-tooltip>

        <div :style="{ marginTop: '-10px' }">
          <TfSelectionDetails disable-node-selection require-domain use-fqdn v-model="selectionDetails" />
        </div>

        <input-tooltip tooltip="The port used to access the machine.">
          <input-validator
            :value="port"
            :rules="[validators.required('Port is required.'), validators.isPort('Please provide a valid port.')]"
            #="{ props }"
          >
            <v-text-field label="Port" v-model.number="port" type="number" v-bind="props" />
          </input-validator>
        </input-tooltip>

        <input-tooltip
          tooltip="User's machine's IP: It could be Mycelium IP, Yggdrasil IP, or a public IP (IPv4 or IPv6)."
        >
          <input-validator
            :value="ip"
            :rules="[
              validators.required('IP is required.'),
              validators.isIP('Public IP is not valid.'),
              validators.startsWith('Public IP is not valid.', '127.'),
            ]"
            #="{ props }"
          >
            <v-text-field label="IP" v-model="ip" v-bind="props" />
          </input-validator>
        </input-tooltip>

        <input-tooltip
          tooltip="When enabled, the backend service will terminate the TLS traffic, otherwise the gateway service will do the TLS traffic termination."
          inline
        >
          <v-switch label="TLS Passthrough" hide-details inset variant="tonal" color="primary" v-model="passThrough" />
        </input-tooltip>
      </template>
    </d-tabs>

    <template #footer-actions="{ validateBeforeDeploy }">
      <v-btn color="secondary" @click="validateBeforeDeploy(deploy)" text="Deploy" />
    </template>
  </weblet-layout>
</template>

<script lang="ts" setup>
import type { GridClient } from "@threefold/grid_client";
import { ref } from "vue";

import { useLayout } from "../components/weblet_layout.vue";
import { useGrid } from "../stores";
import { ProjectName } from "../types";
import { deployGatewayName, rollbackGateway } from "../utils/gateway";
import { normalizeError } from "../utils/helpers";
import { generateName } from "../utils/strings";

const layout = useLayout();
const ip = ref();
const name = ref(generateName({ prefix: "dm" }));
const subdomain = ref(generateName({ prefix: "dm" }));
const port = ref(80);
const passThrough = ref(false);
const selectionDetails = ref<SelectionDetails>();

const gridStore = useGrid();
const grid = gridStore.client as GridClient;

function finalize(deployment: any) {
  layout.value.reloadDeploymentsList();
  layout.value.setStatus("success", "Successfully deployed a Domains instance.");
  layout.value.openDialog(deployment);
}

async function deploy() {
  layout.value.setStatus("deploy");

  const projectName = ProjectName.Domains.toLowerCase() + "/" + name.value;
  const domain = selectionDetails.value?.domain?.enabledCustomDomain
    ? selectionDetails.value.domain.customDomain
    : subdomain.value + "." + selectionDetails.value?.domain?.selectedDomain?.publicConfig.domain;

  try {
    updateGrid(grid, { projectName });
    await layout.value.validateBalance(grid!);

    layout.value.setStatus("deploy", "Preparing to deploy gateway...");

    const gateway: any = await deployGatewayName(grid, selectionDetails.value?.domain, {
      subdomain: subdomain.value,
      ip: ip.value,
      port: port.value,
      tlsPassthrough: passThrough.value,
    });
    const gw = await grid.gateway.get_name({ name: subdomain.value });
    (gw as any).name = gw[0].workloads[0].name;

    finalize(gw);
  } catch (e) {
    layout.value.setStatus("deploy", "Rollbacking back due to fail to deploy gateway...");
    await rollbackGateway(grid!, subdomain.value);
    layout.value.setStatus("failed", normalizeError(e, "Failed to deploy a Domains instance."));
  }
}
async function validateSubdomain() {
  return await isAvailableName(grid, subdomain.value);
}
</script>

<script lang="ts">
import { deploymentListEnvironments } from "@/constants";
import { isAvailableName } from "@/utils/validators";

import type { SelectionDetails } from "../types/nodeSelector";
import { updateGrid } from "../utils/grid";

export default {
  name: "TfDomains",
};
</script>
