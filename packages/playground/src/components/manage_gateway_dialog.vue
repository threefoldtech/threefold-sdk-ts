<template>
  <div>
    <v-dialog
      v-model="dialogVisible"
      @update:model-value="$emit('close')"
      scrollable
      :persistent="deleting || layout?.status === 'deploy'"
      attach="#modals"
    >
      <weblet-layout ref="layout" @back="onBack">
        <template #title>Manage Domains ({{ vm ? vm.name : k8s?.masters[0].name }})</template>

        <v-tabs align-tabs="center" color="secondary" class="mb-6" v-model="gatewayTab" :disabled="deleting">
          <v-tab>Domains List</v-tab>
          <v-tab>Add new domain</v-tab>
        </v-tabs>

        <v-alert
          type="warning"
          variant="tonal"
          class="mb-4"
          v-if="errorMessage && gatewayTab === 0 && !loadingGateways"
        >
          Failed to list {{ failedToListGws.length }} domains.
          <template #append>
            <v-btn
              icon="mdi-format-list-bulleted-square"
              variant="plain"
              size="x-small"
              @click="failedDomainDialog = true"
            />
          </template>
        </v-alert>

        <v-dialog v-model="failedDomainDialog" max-width="400px" scrollable attach="#modals">
          <v-card>
            <v-card-title class="bg-warning">Failed Domains</v-card-title>
            <v-card-text>
              <ul style="list-style: square">
                <li v-for="gw in failedToListGws" :key="gw">
                  <span>{{ formatDomainName(gw) }}</span>
                </li>
              </ul>
            </v-card-text>
          </v-card>
        </v-dialog>

        <div v-show="gatewayTab === 0" :class="{ 'pb-2': !loadingGateways, 'pb-6': loadingGateways }">
          <div class="d-flex justify-end mb-4">
            <v-btn
              color="secondary"
              :loading="loadingGateways"
              :disabled="deleting"
              @click="loadGateways"
              variant="outlined"
              >Reload</v-btn
            >
          </div>
          <list-table
            :headers="tableHeaders"
            :items="gateways"
            return-object
            :loading="loadingGateways"
            v-model="gatewaysToDelete"
            :deleting="deleting"
            no-data-text="No domains attached to this virtual machine."
          >
            <template #[`item.name`]="{ item }">
              {{ item.name }}
            </template>

            <template #[`item.tls_passthrough`]="{ item }">
              {{ item.tls_passthrough ? "Yes" : "No" }}
            </template>

            <template #[`item.backends`]="{ item }">
              {{ (Array.isArray(item.backends) ? item.backends[0] : item.backends) ?? "-" }}
            </template>

            <template #[`item.status`]="{ item }">
              {{ item.status.toUpperCase() }}
            </template>

            <template #[`item.actions`]="{ item }">
              <IconActionBtn tooltip="Visit" icon="mdi-web" color="anchor" :href="'https://' + item.domain" />
            </template>
            <template #[`item.attached_to`]="{ item }">
              <v-chip>{{ getDomainNode(item) }}</v-chip>
            </template>
          </list-table>
        </div>

        <div v-if="gatewayTab === 1">
          <form-validator v-model="valid">
            <input-tooltip tooltip="Selecting custom domain sets subdomain as gateway name.">
              <input-validator
                :value="subdomain"
                :rules="subdomainRules"
                :async-rules="gatewayTab === 1 ? [validateSubdomain] : []"
                #="{ props }"
              >
                <v-text-field label="Subdomain" v-model.trim="subdomain" v-bind="props" />
              </input-validator>
            </input-tooltip>

            <div :style="{ marginTop: '-10px' }">
              <TfSelectionDetails disable-node-selection require-domain use-fqdn v-model="selectionDetails" />
            </div>

            <input-validator :value="port" :rules="portRules" #="{ props }">
              <v-text-field label="Port" v-model.number="port" type="number" v-bind="props" />
            </input-validator>

            <div :style="{ marginTop: '-10px' }">
              <input-tooltip
                tooltip="When enabled, the backend service will terminate the TLS traffic, otherwise the gateway service will do the TLS traffic termination."
                inline
              >
                <v-switch
                  label="TLS Passthrough"
                  hide-details
                  inset
                  variant="tonal"
                  color="primary"
                  v-model="passThrough"
                />
              </input-tooltip>
            </div>

            <v-select
              label="Select node"
              class="mt-4"
              :items="availableK8SNodesNames"
              v-model="selectedK8SNodeName"
              v-if="k8s"
            />
            <v-select label="Supported Interfaces" class="mt-4" :items="networks" v-model="selectedIPAddress" />
            <copy-input-wrapper #="{ props }" :data="(selectedIPAddress as any)">
              <v-text-field :readonly="true" label="Selected IP Address" v-model="selectedIPAddress" v-bind="props" />
            </copy-input-wrapper>

            <copy-input-wrapper #="{ props }" :data="networkName" v-if="isWireGuard">
              <v-text-field label="Network name" v-model="networkName" readonly v-bind="props" />
            </copy-input-wrapper>
          </form-validator>
        </div>

        <template #footer-actions>
          <v-btn color="anchor" @click="$emit('close')">Close</v-btn>
          <v-btn
            color="error"
            :disabled="gatewaysToDelete.length === 0 || deleting || loadingGateways"
            v-if="gatewayTab === 0"
            @click="requestDelete = true"
          >
            Delete
          </v-btn>
          <v-btn color="secondary" @click="deployGateway" :disabled="!valid" v-else> Add </v-btn>
        </template>
      </weblet-layout>
    </v-dialog>

    <v-dialog v-model="requestDelete" max-width="600px" attach="#modals">
      <v-card>
        <v-card-title> Are you sure you want to delete the following gateways? </v-card-title>
        <v-card-text class="d-flex flex-wrap">
          <v-chip label class="mr-1 mb-5" v-for="gw in gatewaysToDelete" :key="gw.name">
            {{ gw.name }}
          </v-chip>
          <v-divider />
        </v-card-text>

        <v-card-actions class="justify-end mb-1 mr-2">
          <v-btn color="anchor" @click="requestDelete = false">Cancel</v-btn>
          <v-btn
            color="error"
            :disabled="loadingGateways || deleting"
            @click="
              () => {
                requestDelete = false;
                deleteSelectedGateways();
              }
            "
            >Delete</v-btn
          >
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script lang="ts">
import type { GridClient, ZmachineData } from "@threefold/grid_client";
import { onMounted, type PropType, ref, watch } from "vue";

import { useGrid } from "../stores";
import { ProjectName } from "../types";
import type { SelectionDetails } from "../types/nodeSelector";
import {
  type DeployGatewayConfig,
  deployGatewayName,
  type GridGateway,
  loadDeploymentGateways,
} from "../utils/gateway";
import { updateGrid } from "../utils/grid";
import { normalizeError } from "../utils/helpers";
import { generateName } from "../utils/strings";
import * as validators from "../utils/validators";
import { isAvailableName } from "../utils/validators";
import IconActionBtn from "./icon_action_btn.vue";
import ListTable from "./list_table.vue";
import { useLayout } from "./weblet_layout.vue";

type VMNetwork = {
  title: string;
  value: string;
};

enum NetworkInterfaces {
  PublicIPV4 = "Public IPv4",
  PublicIPV6 = "Public IPv6",
  Planetary = "Planetary",
  Mycelium = "Mycelium",
  WireGuard = "WireGuard",
}

export default {
  name: "ManageGatewayDialog",
  components: { ListTable, IconActionBtn },
  props: {
    vm: { type: Object as PropType<any>, required: false },
    k8s: {
      type: Object as PropType<{ projectName: string; masters: ZmachineData[]; workers: ZmachineData[] }>,
      required: false,
    },
  },
  setup(props) {
    const layout = useLayout();
    const gatewayTab = ref(0);
    const dialogVisible = ref(true);
    const isWireGuard = ref(false);

    const oldPrefix = ref("");
    const prefix = ref("");
    const subdomain = ref("");
    const port = ref(props.vm ? 80 : 443);
    const passThrough = ref(false);
    const valid = ref(false);
    const selectionDetails = ref<SelectionDetails>();
    const networks = ref<VMNetwork[]>([]);
    const selectedIPAddress = ref<VMNetwork | null>(null);
    const networkName = props.vm
      ? (props.vm.interfaces[0].network as string)
      : (props.k8s?.masters[0].interfaces[0].network as string);
    const gridStore = useGrid();
    const grid = gridStore.client as GridClient;

    const loadingGateways = ref(false);
    const gateways = ref<GridGateway[]>([]);
    const failedToListGws = ref<string[]>([]);
    const failedDomainDialog = ref(false);
    const requestDelete = ref(false);
    const gatewaysToDelete = ref<GridGateway[]>([]);
    const deleting = ref(false);
    const availableK8SNodes = props.k8s ? [...props.k8s.masters, ...props.k8s.workers] : [];
    const availableK8SNodesNames = availableK8SNodes.map(node => node.name);
    const selectedK8SNodeName = ref(availableK8SNodesNames[0]);
    const selectedNode = ref();
    const errorMessage = ref("");

    watch(selectedK8SNodeName, getSupportedNetworks, { deep: true });
    const tableHeaders = ref([
      { title: "Name", key: "name" },
      { title: "Contract ID", key: "contractId" },
      { title: "Domain", key: "domain" },
      { title: "TLS Passthrough", key: "tls_passthrough" },
      { title: "Backend", key: "backends", sortable: false },
      { title: "Status", key: "status" },
      { title: "Actions", key: "actions", sortable: false },
    ]);

    onMounted(async () => {
      updateGrid(grid, { projectName: "" });
      suggestName();
      await loadGateways();
      getSupportedNetworks();
      updateHeaders();
    });

    const updateHeaders = () => {
      if (props.k8s) {
        const actionsIndex = tableHeaders.value.findIndex(header => header.key === "actions");
        if (actionsIndex !== -1) {
          tableHeaders.value.splice(actionsIndex, 0, { title: "Attached to", key: "attached_to", sortable: false });
        }
      }
    };

    const getDomainNode = (domain: GridGateway): string => {
      const extractIP = (input: string) => input.replace("https://", "").replace("http://", "").split(":")[0];

      const IP = extractIP(domain.backends[0]);

      const isMatchingIP = (ip: string) => ip === IP;

      const isMaster =
        isMatchingIP(props.k8s!.masters[0].interfaces[0].ip) ||
        (props.k8s!.masters[0].publicIP && isMatchingIP(props.k8s!.masters[0].publicIP.ip.split("/")[0]));

      if (isMaster) {
        return props.k8s!.masters[0].name;
      }

      const worker = props.k8s!.workers.find(
        (worker: ZmachineData) =>
          isMatchingIP(worker.interfaces[0].ip) || (worker.publicIP && isMatchingIP(worker.publicIP.ip.split("/")[0])),
      );

      return worker ? worker.name : "-";
    };

    async function loadGateways() {
      try {
        gateways.value = [];
        gatewaysToDelete.value = [];
        loadingGateways.value = true;
        updateGrid(grid, { projectName: props.vm ? props.vm.projectName : props.k8s!.projectName });

        const { gateways: gws, failedToList } = await loadDeploymentGateways(grid, {
          filter: gw => true,
        });
        gateways.value = gws;
        failedToListGws.value = failedToList;
        if (failedToListGws.value.length) {
          errorMessage.value = `Failed to list ${failedToListGws.value.length} domains`;
        }
      } catch (error) {
        errorMessage.value = "Failed to list this deployment's domains";
        layout.value.setStatus("failed", normalizeError(error, errorMessage.value));
      } finally {
        loadingGateways.value = false;
      }
    }

    async function deployGateway() {
      layout.value.setStatus("deploy");
      try {
        const IP = selectedIPAddress.value as unknown as string;

        const gwConfig: DeployGatewayConfig = {
          subdomain: subdomain.value,
          ip: IP,
          port: port.value,
          tlsPassthrough: passThrough.value,
        };

        if (isWireGuard.value) {
          gwConfig.network = networkName;
          const [x, y] = IP.split(".");
          const data = {
            name: networkName,
            ipRange: `${x}.${y}.0.0/16`,
            nodeId: selectionDetails.value!.domain!.selectedDomain!.nodeId,
            mycelium: false,
          };

          const hasNode = await grid.networks.hasNode(data);

          if (!hasNode) {
            await grid.networks.addNode(data);
          }
        }

        await deployGatewayName(grid, selectionDetails.value!.domain, gwConfig);
        suggestName();
        layout.value.setStatus("success", "Successfully deployed gateway.");
      } catch (error) {
        layout.value.setStatus("failed", normalizeError(error, "Something went wrong."));
      }
    }

    async function deleteSelectedGateways() {
      deleting.value = true;
      const deletedGateways = new Set<GridGateway>();
      for (const gw of gatewaysToDelete.value) {
        await grid.gateway
          .delete_name(gw)
          .then(() => deletedGateways.add(gw))
          .catch(() => []);
      }
      gatewaysToDelete.value = gatewaysToDelete.value.filter(gw => !deletedGateways.has(gw));
      gateways.value = gateways.value.filter(gw => !deletedGateways.has(gw));
      deleting.value = false;
      if (gatewaysToDelete.value.length > 0) {
        layout.value.setStatus("failed", `Failed to delete some of the selected gateways.`);
      }
    }

    async function validateSubdomain() {
      return await isAvailableName(grid, subdomain.value);
    }

    function addNetwork(title: string, value: string) {
      if (value) {
        networks.value.push({ title, value });
      }
    }

    function getSupportedNetworks() {
      (selectedNode.value = props.vm
        ? props.vm
        : availableK8SNodes.filter(node => node.name === selectedK8SNodeName.value)[0]),
        (networks.value = []);
      const { publicIP, planetary, myceliumIP, interfaces } = selectedNode.value;

      addNetwork(NetworkInterfaces.WireGuard, interfaces?.[0]?.ip);
      addNetwork(NetworkInterfaces.PublicIPV4, publicIP?.ip.split("/")[0]);

      if (props.vm) {
        addNetwork(NetworkInterfaces.Planetary, planetary);
        addNetwork(NetworkInterfaces.Mycelium, myceliumIP);
        addNetwork(NetworkInterfaces.PublicIPV6, publicIP?.ip6.split("/")[0]);
      }
      selectedIPAddress.value = networks.value[0];
    }

    watch(
      selectedIPAddress,
      () => {
        if (selectedIPAddress.value?.value) {
          selectedIPAddress.value = selectedIPAddress.value.value as unknown as VMNetwork;
        }

        const IP = selectedIPAddress.value as unknown as string;
        isWireGuard.value = networks.value.find(net => net.value === IP)?.title === NetworkInterfaces.WireGuard;
      },
      { deep: true },
    );

    function formatDomainName(gw: string) {
      if (gw.startsWith(prefix.value)) {
        return gw.slice(prefix.value.length);
      } else if (gw.startsWith(oldPrefix.value)) {
        return gw.slice(oldPrefix.value.length);
      } else {
        return gw;
      }
    }

    function onBack() {
      gatewayTab.value = 0;
      loadGateways();
    }

    function suggestName() {
      if (props.k8s) {
        oldPrefix.value = props.k8s.projectName.toLowerCase().includes(ProjectName.Fullvm.toLowerCase())
          ? "k8s"
          : "k8s" + grid.config.twinId;
        prefix.value = oldPrefix.value + props.k8s.masters[0].name;
      } else {
        oldPrefix.value =
          (props.vm.projectName.toLowerCase().includes(ProjectName.Fullvm.toLowerCase()) ? "fvm" : "vm") +
          grid.config.twinId;
        prefix.value = oldPrefix.value + props.vm.name;
      }
      subdomain.value = generateName({ prefix: prefix.value }, 4).toLowerCase();
    }

    const subdomainRules = [
      validators.required("Subdomain is required."),
      validators.isLowercase("Subdomain should consist of lowercase letters only."),
      validators.isAlphanumeric("Subdomain should consist of letters and numbers only."),
      (subdomain: string) => validators.isAlpha("Subdomain must start with an alphabet char.")(subdomain[0]),
      validators.minLength("Subdomain must be at least 4 characters.", 4),
      (subdomain: string) => validators.maxLength("Subdomain cannot exceed 50 characters.", 50)(subdomain),
    ];

    const portRules = [validators.required("Port is required."), validators.isPort("Please provide a valid port.")];

    return {
      layout,
      dialogVisible,
      gatewayTab,
      oldPrefix,
      prefix,
      subdomain,
      port,
      passThrough,
      valid,
      selectionDetails,
      networks,
      selectedIPAddress,
      networkName,
      loadingGateways,
      gateways,
      failedToListGws,
      failedDomainDialog,
      requestDelete,
      gatewaysToDelete,
      deleting,
      loadGateways,
      deployGateway,
      deleteSelectedGateways,
      validateSubdomain,
      addNetwork,
      getSupportedNetworks,
      formatDomainName,
      onBack,
      getDomainNode,
      tableHeaders,
      subdomainRules,
      portRules,
      isWireGuard,
      availableK8SNodesNames,
      selectedK8SNodeName,
      errorMessage,
    };
  },
};
</script>
