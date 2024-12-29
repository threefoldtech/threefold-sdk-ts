<template>
  <div>
    <v-alert v-if="errorMessage" type="error" variant="tonal">
      {{ errorMessage }}
    </v-alert>
    <v-alert v-if="!loading && count && items.length < count" type="warning" variant="tonal">
      Failed to load <strong>{{ count - items.length }}</strong> deployment{{ count - items.length > 1 ? "s" : "" }}.

      <span>
        This might happen because the node is down or it's not reachable
        <span v-if="showEncryption"
          >or the deployment{{ count - items.length > 1 ? "s are" : " is" }} encrypted by another key</span
        >.
      </span>
      <v-tooltip location="top" text="Show failed deployments">
        <template #activator="{ props }">
          <v-icon v-bind="props" class="custom-icon" @click="showDialog = true"
            >mdi-file-document-refresh-outline
          </v-icon>
        </template>
      </v-tooltip>

      <v-dialog
        transition="dialog-bottom-transition"
        v-model="showDialog"
        max-width="500px"
        scrollable
        attach="#modals"
      >
        <v-card>
          <v-card-title style="font-weight: bold">Failed Deployments</v-card-title>
          <v-divider color="#FFCC00" />
          <v-card-text>
            <v-alert type="error" variant="tonal">
              Failed to load
              <strong>{{ count - items.length }}</strong> deployment{{ count - items.length > 1 ? "s" : "" }}.

              <span>
                This might happen because the node is down or it's not reachable
                <span v-if="showEncryption"
                  >or the deployment{{ count - items.length > 1 ? "s are" : " is" }} encrypted by another key</span
                >.
              </span>
            </v-alert>
            <v-list :items="failedDeploymentList" item-props lines="three">
              <template v-slot:subtitle="{ subtitle }">
                <div v-html="subtitle"></div>
              </template>
            </v-list>
          </v-card-text>
          <v-card-actions class="justify-end my-1 mr-2">
            <v-btn @click="showDialog = false" color="anchor">Close</v-btn>
          </v-card-actions>
        </v-card>
      </v-dialog>
    </v-alert>

    <AccessDeploymentAlert v-if="!hideSSH" />

    <InputTooltip
      v-if="props.projectName.toLowerCase() === 'vm'"
      tooltip="Didn't find your deployments in the list? Enable to show all deployments."
      inline
    >
      <VSwitch
        inset
        color="primary"
        label="Show All Deployments"
        v-model="showAllDeployments"
        @update:model-value="loadDeployments"
      />
    </InputTooltip>

    <ListTable
      :headers="filteredHeaders"
      :items="showAllDeployments ? items : items.filter(i => !i.fromAnotherClient)"
      :loading="loading"
      :deleting="deleting"
      :model-value="$props.modelValue"
      :items-per-page-options="[
        { value: 5, title: '5' },
        { value: 10, title: '10' },
        { value: 20, title: '20' },
        { value: 50, title: '50' },
      ]"
      @update:model-value="$emit('update:model-value', $event)"
      @click:row="$attrs['onClick:row']"
      :sort-by="sortBy"
    >
      <template #[`item.name`]="{ item }">
        {{ item.name }}
      </template>

      <template #[`item.ipv4`]="{ item }">
        {{ item.publicIP?.ip?.split("/")?.[0] || item.publicIP?.ip || "-" }}
      </template>

      <template #[`item.mycelium`]="{ item }">
        {{ item.myceliumIP || "-" }}
      </template>

      <template #[`item.flist`]="{ item }">
        <v-tooltip :text="item.flist" location="bottom right">
          <template #activator="{ props }">
            <p v-bind="props">
              {{ renameFlist(item.flist) }}
            </p>
          </template>
        </v-tooltip>
      </template>

      <template #[`item.billing`]="{ item }">
        {{ item.billing || "No Data Available" }}
      </template>
      <template #[`item.created`]="{ item }">
        {{ toHumanDate(item.created) }}
      </template>
      <template #[`item.actions`]="{ item }">
        <v-chip color="error" v-if="deleting && ($props.modelValue || []).includes(item)"> Deleting... </v-chip>
        <v-btn-group variant="tonal" v-else>
          <slot :name="projectName + '-actions'" :item="item" :update="updateItem"></slot>
        </v-btn-group>
      </template>

      <template #[`item.status`]="{ item }">
        <v-chip :color="getNodeHealthColor(item.status as string).color">
          <v-tooltip v-if="item.status == NodeHealth.Error" activator="parent" location="top">{{
            item.message
          }}</v-tooltip>
          <v-tooltip v-if="item.status == NodeHealth.Paused" activator="parent" location="top"
            >The deployment contract is in grace period</v-tooltip
          >
          <span class="text-uppercase">
            {{ getNodeHealthColor(item.status as string).type }}
          </span>
        </v-chip>
      </template>
      <template #[`item.health`]="{ item }">
        <v-chip :color="getNodeHealthColor(item[0].workloads[0].result.state as string).color">
          <v-tooltip v-if="item[0].workloads[0].result.state == NodeHealth.Error" activator="parent" location="top">{{
            item.message
          }}</v-tooltip>
          <v-tooltip v-if="item[0].workloads[0].result.state == NodeHealth.Paused" activator="parent" location="top"
            >The deployment contract is in grace period</v-tooltip
          >
          <span class="text-uppercase">
            {{ getNodeHealthColor(item[0].workloads[0].result.state as string).type }}
          </span>
        </v-chip>
      </template>

      <template #no-data-text>
        <div v-if="failedDeploymentList.length > 0" class="text-center">
          <p v-text="'Couldn\'t load any of your ' + projectName + ' deployments.'" />
          <VBtn
            class="mt-4"
            variant="outlined"
            color="secondary"
            prepend-icon="mdi-reload"
            text="Reload"
            @click="loadDeployments"
          />
        </div>
        <p v-else v-text="'No ' + projectName + ' deployments found on this account.'" />
      </template>
    </ListTable>
  </div>
</template>

<script lang="ts" setup>
import { capitalize, computed, onMounted, ref } from "vue";

import { getNodeHealthColor, NodeHealth } from "@/utils/get_nodes";

import { useProfileManager } from "../stores";
import { getGrid, updateGrid } from "../utils/grid";
import { markAsFromAnotherClient } from "../utils/helpers";
import { type LoadedDeployments, loadVms, mergeLoadedDeployments } from "../utils/load_deployment";

const profileManager = useProfileManager();

const props = defineProps<{
  projectName: string;
  modelValue: any[];
  deleting: boolean;
  hideSSH?: boolean;
}>();
defineEmits<{ (event: "update:model-value", value: any[]): void }>();

const loading = ref(false);
const count = ref<number>();
const items = ref<any[]>([]);
const showDialog = ref(false);
const showEncryption = ref(false);
const errorMessage = ref<string>("");
const showAllDeployments = ref(false);
const failedDeployments = ref<
  {
    name: string;
    nodes?: number[];
    contracts?: { contractID: number; node_id: number }[];
  }[]
>([]);

onMounted(loadDeployments);

async function loadDomains() {
  try {
    loading.value = true;
    const grid = await getGrid(profileManager.profile!, props.projectName.toLowerCase());
    const gateways = await grid!.gateway.list();
    const gws = await Promise.all(gateways.map(name => grid!.gateway.get_name({ name })));
    items.value = gws.map(gw => {
      (gw as any).name = gw[0].workloads[0].name;
      return gw;
    });
  } catch (e) {
    errorMessage.value = `Failed to load Deployments: ${e}`;
  } finally {
    loading.value = false;
  }
}

async function loadDeployments() {
  if (props.projectName.toLowerCase() === ProjectName.Domains.toLowerCase()) {
    return loadDomains();
  }

  const migrateGateways = props.projectName.toLowerCase() !== "fullvm" && props.projectName.toLowerCase() !== "vm";

  items.value = [];
  loading.value = true;
  const grid = await getGrid(profileManager.profile!, props.projectName);
  try {
    const chunk1 = await loadVms(grid!);
    if (chunk1.count > 0 && migrateGateways) {
      await migrateModule(grid!.gateway);
    }

    const chunk2 = await loadVms(updateGrid(grid!, { projectName: props.projectName.toLowerCase() }));
    if (chunk2.count > 0 && migrateGateways) {
      await migrateModule(grid!.gateway);
    }

    let chunk3: LoadedDeployments<any[]> = { count: 0, items: [], failedDeployments: [] };
    if (showAllDeployments.value) {
      chunk3 =
        props.projectName.toLowerCase() === ProjectName.VM.toLowerCase()
          ? await loadVms(updateGrid(grid!, { projectName: "" }))
          : { count: 0, items: [], failedDeployments: [] };

      if (chunk3.count > 0 && migrateGateways) {
        await migrateModule(grid!.gateway);
      }

      chunk3.items = chunk3.items.map(markAsFromAnotherClient);
    }

    const vms = mergeLoadedDeployments(chunk1, chunk2, chunk3 as any);
    failedDeployments.value = vms.failedDeployments;
    count.value = vms.count;
    items.value = mergeCaproverDeployments(vms.items);
  } catch (err) {
    errorMessage.value = `Failed to load Deployments: ${err}`;
  } finally {
    loading.value = false;
  }

  loading.value = false;
}

const filteredHeaders = computed(() => {
  if (props.projectName.toLowerCase() === ProjectName.Domains.toLowerCase()) {
    return [
      {
        title: "Name",
        key: "domain-name",
        value(item: any) {
          const [workload] = item[0].workloads;
          return workload.data.name || workload.name;
        },
      },
      {
        title: "Backends",
        key: "backends",
        value(item: any) {
          return item[0].workloads[0].data.backends.join(", ");
        },
        sortable: false,
      },
      {
        title: "Domain",
        key: "fqdn",
        value(item: any) {
          const [workload] = item[0].workloads;
          return workload.result.data.fqdn || workload.data.fqdn;
        },
      },
      {
        title: "Health",
        key: "health",
        value(item: any) {
          return capitalize(item[0].workloads[0].result.state);
        },
        sortable: false,
      },
      { title: "Actions", key: "actions", sortable: false },
    ];
  }

  let headers = [
    { title: "PLACEHOLDER", key: "data-table-select" },
    { title: "Name", key: "name" },
    {
      title: "Networks",
      key: "networks",
      sortable: false,
      children: [
        { title: "Public IPv4", key: "ipv4", sortable: false },
        { title: "Mycelium IP", key: "mycelium", sortable: false },
      ],
    },
    { title: "Flist", key: "flist" },
    { title: "Cost", key: "billing" },
    { title: "Created At", key: "created" },
    { title: "Health", key: "status", sortable: false },
    { title: "Actions", key: "actions", sortable: false },
  ];

  const IPV6Solutions = [
    ProjectName.NodePilot,
    ProjectName.VM,
    ProjectName.Fullvm,
    ProjectName.Presearch,
    ProjectName.Umbrel,
    ProjectName.Nextcloud,
    ProjectName.Funkwhale,
    ProjectName.Casperlabs,
    ProjectName.Mattermost,
    ProjectName.Discourse,
    ProjectName.Taiga,
    ProjectName.StaticWebsite,
    ProjectName.Wordpress,
    ProjectName.TFRobot,
    ProjectName.Gitea,
    ProjectName.Nostr,
    ProjectName.Algorand,
    ProjectName.Subsquid,
    ProjectName.Peertube,
    ProjectName.Jenkins,
    ProjectName.Jitsi,
  ] as string[];

  const IPV4Solutions = [
    ProjectName.NodePilot,
    ProjectName.VM,
    ProjectName.Fullvm,
    ProjectName.Presearch,
    ProjectName.Umbrel,
    ProjectName.Nextcloud,
    ProjectName.Funkwhale,
    ProjectName.Casperlabs,
    ProjectName.Mattermost,
    ProjectName.Discourse,
    ProjectName.Taiga,
    ProjectName.StaticWebsite,
    ProjectName.Wordpress,
    ProjectName.TFRobot,
    ProjectName.Gitea,
    ProjectName.Nostr,
    ProjectName.Algorand,
    ProjectName.Subsquid,
    ProjectName.Peertube,
    ProjectName.Jenkins,
    ProjectName.Caprover,
    ProjectName.Jitsi,
  ] as string[];

  const WireguardSolutions = [ProjectName.VM, ProjectName.Fullvm, ProjectName.Umbrel, ProjectName.TFRobot] as string[];

  const flistSolutions = [ProjectName.VM, ProjectName.Fullvm] as string[];

  if (headers[2].children) {
    if (!IPV6Solutions.includes(props.projectName)) {
      headers[2].children = headers[2].children.filter(h => h.key !== "ipv6");
    }

    if (!IPV4Solutions.includes(props.projectName)) {
      headers[2].children = headers[2].children.filter(h => h.key !== "ipv4");
    }

    if (!WireguardSolutions.includes(props.projectName)) {
      headers[2].children = headers[2].children.filter(h => h.key !== "wireguard");
    }
  }
  if (!flistSolutions.includes(props.projectName)) {
    headers = headers.filter(h => h.key !== "flist");
  }

  return headers;
});

const failedDeploymentList = computed(() => {
  return failedDeployments.value
    .map(({ name, nodes = [], contracts = [] }, index) => {
      const nodeMessage =
        nodes.length > 0
          ? `<span class="ml-4 text-primary font-weight-bold">On Node:</span> ${nodes.join(", ")}.<br/>`
          : "";
      const contractMessage =
        contracts.length > 0
          ? ` <span class="ml-4 text-primary font-weight-bold">With Contract ID:</span> ${contracts
              .map(c => c.contractID)
              .join(", ")}.`
          : "";

      const subtitle =
        nodeMessage + contractMessage === ""
          ? `<span class="ml-4 text-error font-weight-bold">Error:</span> Failed to decrypt deployment data.`
          : nodeMessage + contractMessage;
      if (subtitle.includes("Failed to decrypt deployment data.")) {
        showEncryption.value = true;
      }

      const item: any[] = [{ title: name, subtitle }];

      if (index + 1 !== failedDeployments.value.length) {
        item.push({ type: "divider", inset: false });
      }

      return item;
    })
    .flat(1);
});

function updateItem(newItem: any) {
  const index = items.value.findIndex(i => i.contractId === newItem.contractId);
  if (index > -1) {
    items.value[index] = newItem;
  }
}

function renameFlist(url: string) {
  const flist = url.substring(url.lastIndexOf("/") + 1, url.lastIndexOf("."));

  return flist.length > 40 ? flist.substring(0, 40) + "..." : flist;
}

defineExpose({ loadDeployments });
</script>

<script lang="ts">
import toHumanDate from "@/utils/date";
import { mergeCaproverDeployments } from "@/utils/deploy_helpers";

import { ProjectName } from "../types";
import { migrateModule } from "../utils/migration";
import AccessDeploymentAlert from "./AccessDeploymentAlert.vue";
import ListTable from "./list_table.vue";

export default {
  name: "VmDeploymentTable",
  components: {
    ListTable,
    AccessDeploymentAlert,
  },
  data() {
    return {
      sortBy: [
        { key: "name", order: "asc" },
        { key: "flist", order: "asc" },
        { key: "billing", order: "asc" },
        { key: "created", order: "asc" },
      ],
    };
  },
};
</script>

<style>
.custom-icon {
  float: right;
}
</style>
