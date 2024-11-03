<template>
  <weblet-layout ref="layout">
    <template #title>
      {{ title || "Deployment List" }}
    </template>
    <template #subtitle v-if="!$props.projectName"> List your own deployments for different solutions </template>
    <d-tabs
      :tabs="tabs"
      :model-value="activeTab"
      @update:model-value="activeTab = $event"
      :disabled="deleting"
      destroy
      :hide-tabs="!!$props.projectName"
    >
      <VmDeploymentTable
        :projectName="tabs[activeTab].value"
        v-model="selectedItems"
        :deleting="deleting"
        :hideSSH="hideSSH"
        ref="table"
        @click:row="clickOpenDialog"
      >
        <template #Fullvm-actions="{ item }">
          <IconActionBtn
            tooltip="Show Details"
            icon="mdi-eye-outline"
            @click="openDialog(tabs[activeTab].value, item)"
          />

          <IconActionBtn icon="mdi-cog" tooltip="Manage Domains" @click="dialog = item.name" />

          <ManageGatewayDialog v-if="dialog === item.name" :vm="item" @close="dialog = undefined" />
        </template>

        <template #VM-actions="{ item }">
          <IconActionBtn
            tooltip="Show Details"
            icon="mdi-eye-outline"
            @click="openDialog(tabs[activeTab].value, item)"
          />

          <IconActionBtn
            icon="mdi-cog"
            tooltip="Manage Domains"
            :disabled="item.fromAnotherClient"
            @click="dialog = item.name"
          />

          <ManageGatewayDialog v-if="dialog === item.name" :vm="item" @close="dialog = undefined" />
        </template>

        <template #CapRover-actions="{ item, update }">
          <IconActionBtn
            tooltip="Show Details"
            icon="mdi-eye-outline"
            @click="openDialog(tabs[activeTab].value, item)"
          />
          <IconActionBtn
            v-if="isCaproverLeader(item)"
            tooltip="Admin Panel"
            color="anchor"
            icon="mdi-view-dashboard"
            :href="'http://captain.' + item.env.CAPROVER_ROOT_DOMAIN"
          />
          <IconActionBtn
            v-if="isCaproverLeader(item)"
            icon="mdi-cog"
            tooltip="Manage Workers"
            @click="dialog = item.name"
          />

          <ManageCaproverWorkerDialog
            v-if="dialog === item.name"
            :master="item"
            :data="item.workers || []"
            :project-name="item.projectName"
            @close="dialog = undefined"
            @update:caprover="update($event)"
          />
        </template>

        <template #Peertube-actions="{ item }">
          <IconActionBtn
            tooltip="Show Details"
            icon="mdi-eye-outline"
            @click="openDialog(tabs[activeTab].value, item)"
          />
          <IconActionBtn
            tooltip="Visit"
            icon="mdi-web"
            color="anchor"
            :href="'https://' + item.env.PEERTUBE_WEBSERVER_HOSTNAME"
          />
        </template>

        <template #Funkwhale-actions="{ item }">
          <IconActionBtn
            tooltip="Show Details"
            icon="mdi-eye-outline"
            @click="openDialog(tabs[activeTab].value, item)"
          />
          <IconActionBtn
            tooltip="Visit"
            icon="mdi-web"
            color="anchor"
            :href="'https://' + item.env.FUNKWHALE_HOSTNAME"
          />
        </template>

        <template #Jenkins-actions="{ item }">
          <IconActionBtn
            tooltip="Show Details"
            icon="mdi-eye-outline"
            @click="openDialog(tabs[activeTab].value, item)"
          />
          <IconActionBtn tooltip="Visit" icon="mdi-web" color="anchor" :href="'https://' + item.env.JENKINS_HOSTNAME" />
        </template>

        <template #Taiga-actions="{ item }">
          <IconActionBtn
            tooltip="Show Details"
            icon="mdi-eye-outline"
            @click="openDialog(tabs[activeTab].value, item)"
          />
          <IconActionBtn
            tooltip="Admin Panel"
            color="anchor"
            icon="mdi-view-dashboard"
            :href="'http://' + item.env.DOMAIN_NAME + '/admin/'"
          />
          <IconActionBtn tooltip="Visit" icon="mdi-web" color="anchor" :href="'https://' + item.env.DOMAIN_NAME" />
        </template>

        <template #Presearch-actions="{ item }">
          <IconActionBtn
            tooltip="Show Details"
            icon="mdi-eye-outline"
            @click="openDialog(tabs[activeTab].value, item)"
          />
        </template>

        <template #Mattermost-actions="{ item }">
          <IconActionBtn
            tooltip="Show Details"
            icon="mdi-eye-outline"
            @click="openDialog(tabs[activeTab].value, item)"
          />
          <IconActionBtn tooltip="Visit" color="anchor" icon="mdi-web" :href="item.env.SITE_URL" />
        </template>

        <template #Discourse-actions="{ item }">
          <IconActionBtn
            tooltip="Show Details"
            icon="mdi-eye-outline"
            @click="openDialog(tabs[activeTab].value, item)"
          />
          <IconActionBtn
            tooltip="Visit"
            icon="mdi-web"
            color="anchor"
            :href="'https://' + item.env.DISCOURSE_HOSTNAME"
          />
        </template>

        <template #Freeflow-actions="{ item }">
          <IconActionBtn
            tooltip="Show Details"
            icon="mdi-eye-outline"
            @click="openDialog(tabs[activeTab].value, item)"
          />
          <IconActionBtn
            tooltip="Visit"
            icon="mdi-web"
            color="anchor"
            :href="'https://' + item.env.DIGITALTWIN_APPID"
          />
        </template>

        <template #Casperlabs-actions="{ item }">
          <IconActionBtn
            tooltip="Show Details"
            icon="mdi-eye-outline"
            @click="openDialog(tabs[activeTab].value, item)"
          />
          <IconActionBtn
            tooltip="Visit"
            icon="mdi-web"
            color="anchor"
            :href="'https://' + item.env.CASPERLABS_HOSTNAME"
          />
        </template>

        <template #Owncloud-actions="{ item }">
          <IconActionBtn
            tooltip="Show Details"
            icon="mdi-eye-outline"
            @click="openDialog(tabs[activeTab].value, item)"
          />
          <IconActionBtn tooltip="Visit" icon="mdi-web" color="anchor" :href="'https://' + item.env.OWNCLOUD_DOMAIN" />
        </template>

        <template #Nextcloud-actions="{ item }">
          <IconActionBtn
            tooltip="Show Details"
            icon="mdi-eye-outline"
            @click="openDialog(tabs[activeTab].value, item)"
          />
          <IconActionBtn
            tooltip="Open Nextcloud"
            color="anchor"
            icon="mdi-web"
            :href="'https://' + item.env.NEXTCLOUD_DOMAIN"
          />
          <IconActionBtn
            tooltip="Nextcloud Setup"
            color="anchor"
            icon="mdi-view-dashboard"
            :href="'https://' + item.env.NEXTCLOUD_AIO_LINK"
          />
        </template>

        <template #Subsquid-actions="{ item }">
          <IconActionBtn
            tooltip="Show Details"
            icon="mdi-eye-outline"
            @click="openDialog(tabs[activeTab].value, item)"
          />
          <IconActionBtn
            tooltip="Visit"
            icon="mdi-web"
            color="anchor"
            :href="'https://' + item.env.SUBSQUID_WEBSERVER_HOSTNAME + '/graphql'"
          />
        </template>

        <template #Domains-actions="{ item }">
          <IconActionBtn
            tooltip="Show Details"
            icon="mdi-eye-outline"
            @click="openDialog(tabs[activeTab].value, item)"
          />

          <IconActionBtn
            tooltip="Visit"
            icon="mdi-web"
            color="anchor"
            :href="'https://' + (item[0].workloads[0].result.data.fqdn || item[0].workloads[0].data.fqdn)"
          />
        </template>

        <template #StaticWebsite-actions="{ item }">
          <IconActionBtn
            tooltip="Show Details"
            icon="mdi-eye-outline"
            @click="openDialog(tabs[activeTab].value, item)"
          />
          <IconActionBtn
            tooltip="Visit"
            icon="mdi-web"
            color="anchor"
            :href="'https://' + item.env.STATICWEBSITE_DOMAIN"
          />
        </template>

        <template #Algorand-actions="{ item }">
          <IconActionBtn
            tooltip="Show Details"
            icon="mdi-eye-outline"
            @click="openDialog(tabs[activeTab].value, item)"
          />
        </template>

        <template #NodePilot-actions="{ item }">
          <IconActionBtn
            tooltip="Show Details"
            icon="mdi-eye-outline"
            @click="openDialog(tabs[activeTab].value, item)"
          />
          <IconActionBtn
            tooltip="Visit"
            icon="mdi-web"
            color="anchor"
            :href="'https://' + item.env.NODE_PILOT_HOSTNAME"
          />
        </template>

        <template #Umbrel-actions="{ item }">
          <IconActionBtn
            tooltip="Show Details"
            icon="mdi-eye-outline"
            @click="openDialog(tabs[activeTab].value, item)"
          />
          <IconActionBtn
            tooltip="Admin Panel"
            color="anchor"
            icon="mdi-view-dashboard"
            :href="
              'http://' +
              (item.publicIP?.ip
                ? item.publicIP.ip.slice(0, -3)
                : item.planetary
                ? '[' + item.planetary + ']'
                : item.interfaces[0].ip)
            "
          />
        </template>

        <template #TFRobot-actions="{ item }">
          <IconActionBtn
            tooltip="Show Details"
            icon="mdi-eye-outline"
            @click="openDialog(tabs[activeTab].value, item)"
          />
        </template>

        <template #Gitea-actions="{ item }">
          <IconActionBtn
            tooltip="Show Details"
            icon="mdi-eye-outline"
            @click="openDialog(tabs[activeTab].value, item)"
          />
          <IconActionBtn tooltip="Visit" icon="mdi-web" color="anchor" :href="'https://' + item.env.GITEA__HOSTNAME" />
        </template>

        <template #Nostr-actions="{ item }">
          <IconActionBtn
            tooltip="Show Details"
            icon="mdi-eye-outline"
            @click="openDialog(tabs[activeTab].value, item)"
          />
          <IconActionBtn tooltip="Visit" icon="mdi-web" color="anchor" :href="'https://' + item.env.NOSTR_HOSTNAME" />
        </template>

        <template #Wordpress-actions="{ item }">
          <IconActionBtn
            tooltip="Show Details"
            icon="mdi-eye-outline"
            @click="openDialog(tabs[activeTab].value, item)"
          />
          <IconActionBtn tooltip="Visit" color="anchor" icon="mdi-web" :href="'https://' + item.env.WP_URL" />
          <IconActionBtn
            tooltip="Admin Panel"
            color="anchor"
            icon="mdi-view-dashboard"
            :href="'https://' + item.env.WP_URL + '/wp-admin'"
          />
        </template>

        <template #Jitsi-actions="{ item }">
          <IconActionBtn
            tooltip="Show Details"
            icon="mdi-eye-outline"
            @click="openDialog(tabs[activeTab].value, item)"
          />
          <IconActionBtn tooltip="Visit" icon="mdi-web" color="anchor" :href="'https://' + item.env.JITSI_HOSTNAME" />
        </template>
      </VmDeploymentTable>

      <template #Kubernetes>
        <K8sDeploymentTable
          :projectName="tabs[activeTab].value"
          v-model="selectedItems"
          :deleting="deleting"
          ref="table"
          @click:row="clickOpenDialog"
        >
          <template #actions="{ item }">
            <IconActionBtn
              tooltip="Show Details"
              icon="mdi-eye-outline"
              @click="openDialog(tabs[activeTab].value, item)"
            />

            <IconActionBtn
              icon="mdi-cube-outline"
              :disabled="item.fromAnotherClient"
              tooltip="Manage Workers"
              @click="dialog = item.name"
            />

            <IconActionBtn
              icon="mdi-cog"
              tooltip="Manage Domains"
              :disabled="item.fromAnotherClient"
              @click="dialog = item.masters[0].name"
            />

            <ManageGatewayDialog v-if="dialog === item.masters[0].name" :k8s="item" @close="dialog = undefined" />

            <ManageK8SWorkerDialog
              v-if="dialog === item.name"
              :data="item"
              @close="dialog = undefined"
              @update:k8s="item.workers = $event.workers"
            />
          </template>
        </K8sDeploymentTable>
      </template>
    </d-tabs>

    <template #footer-actions>
      <v-btn
        color="error"
        :disabled="selectedItems.length === 0 || deleting"
        prepend-icon="mdi-delete"
        @click="deletingDialog = true"
      >
        Delete
      </v-btn>
    </template>
  </weblet-layout>

  <v-dialog v-model="deletingDialog" scrollable width="600" attach="#modals">
    <v-card>
      <v-card-title>
        <strong>Delete the following deployments?</strong>
      </v-card-title>
      <v-card-text>
        <template v-if="hasWorkers">
          <v-alert type="warning">Please note that: This deployment contains workers workloads.</v-alert>
        </template>
        <template v-for="item in selectedItems" :key="item.name">
          <template v-if="item.workers">
            <v-chip class="ma-3" v-for="worker in item.workers" :key="worker.name">
              {{ worker.name }}
            </v-chip>
          </template>
          <v-chip class="ma-3">
            {{ item.name }}
          </v-chip>
        </template>
        <v-divider />
      </v-card-text>
      <v-card-actions class="justify-end my-1 mr-2">
        <v-btn color="anchar" @click="deletingDialog = false">Cancel</v-btn>
        <v-btn color="error" @click="onDelete(tabs[activeTab].value.toLowerCase() === 'kubernetes')"> Delete </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script lang="ts" setup>
import { computed, getCurrentInstance, onUnmounted, type Ref, ref, watch } from "vue";

import type { Tab } from "../components/dynamic_tabs.vue";
import { useLayout } from "../components/weblet_layout.vue";
import { deploymentListEnvironments } from "../constants/deployment_list";
import { useGrid } from "../stores";
import { deleteDeployment, deleteGatewayDeployment } from "../utils/delete_deployment";
import { updateGrid } from "../utils/grid";

const props = defineProps<{
  projectName?: ProjectName;
  title?: string;
  hideSSH?: boolean;
}>();

const tabs: Tab[] = [
  { title: "Full Virtual Machine", value: "Fullvm", imgPath: "images/icons/vm.png" },
  { title: "Micro Virtual Machine", value: "VM", imgPath: "images/icons/vm.png" },
  { title: "Kubernetes", value: "Kubernetes", imgPath: "images/icons/kubernetes.png" },
  { title: "CapRover", value: "CapRover", imgPath: "images/icons/caprover.png" },
  { title: "Peertube", value: "Peertube", imgPath: "images/icons/peertube.png" },
  { title: "Funkwhale", value: "Funkwhale", imgPath: "images/icons/funkwhale.png" },
  { title: "Mattermost", value: "Mattermost", imgPath: "images/icons/mattermost.png" },
  { title: "Discourse", value: "Discourse", imgPath: "images/icons/discourse.png" },
  { title: "Taiga", value: "Taiga", imgPath: "images/icons/taiga.png" },
  { title: "Owncloud", value: "Owncloud", imgPath: "images/icons/owncloud.png" },
  { title: "Nextcloud", value: "Nextcloud", imgPath: "images/icons/nextcloud.png" },
  { title: "Presearch", value: "Presearch", imgPath: "images/icons/presearch.png" },
  { title: "Subsquid", value: "Subsquid", imgPath: "images/icons/subsquid.png" },
  { title: "Casperlabs", value: "Casperlabs", imgPath: "images/icons/casperlabs.png" },
  { title: "Algorand", value: "Algorand", imgPath: "images/icons/algorand.png" },
  { title: "Node Pilot", value: "NodePilot", imgPath: "images/icons/vm.png" },
  { title: "Umbrel", value: "Umbrel", imgPath: "images/icons/umbrel.png" },
  { title: "Freeflow", value: "Freeflow", imgPath: "images/icons/freeflow.png" },
  { title: "Wordpress", value: "Wordpress", imgPath: "images/icons/wordpress.png" },
  { title: "Static Website", value: "StaticWebsite", imgPath: "images/icons/wordpress.png" },
  { title: "TFRobot", value: "TFRobot", imgPath: "images/icons/tfrobot.png" },
  { title: "Gitea", value: "Gitea", imgPath: "images/icons/gitea.png" },
  { title: "Nostr", value: "Nostr", imgPath: "images/icons/nostr.png" },
  { title: "Jenkins", value: "Jenkins", imgPath: "images/icons/jenkins.png" },
  { title: "Domains", value: "Domains", imgPath: "images/icons/domains.png" },
  { title: "Jitsi", value: "Jitsi", imgPath: "images/icons/jitsi.png" },
];

const layout = useLayout();
const dialog = ref<string>();
const selectedItems = ref<any[]>([]);
const deleting = ref(false);
const deletingDialog = ref(false);
const table = ref() as Ref<{ loadDeployments(): void }>;
const gridStore = useGrid();
const grid = gridStore.client as GridClient;
const hasWorkers = computed(() => selectedItems.value.map(item => item.workers && item.workers.length).some(i => i));
const isCaproverLeader = (vm: ZmachineData) => vm.env["SWM_NODE_MODE"] === "leader";

const _idx = tabs.findIndex(t => t.value === props.projectName);
const activeTab = ref(!props.projectName ? 0 : _idx) as Ref<number>;
watch(activeTab, () => (selectedItems.value = []));

async function onDelete(k8s = false) {
  deletingDialog.value = false;
  deleting.value = true;

  try {
    const projectNameLower = props.projectName?.toLowerCase();
    const allSelectedItems = [...selectedItems.value];
    selectedItems.value.forEach(item => {
      if (item.projectName.toLowerCase().includes(ProjectName.Caprover.toLowerCase()) && item.workers) {
        allSelectedItems.push(...item.workers);
      }
    });

    await allSelectedItems.reduce(async (acc, item) => {
      await acc;
      try {
        if (projectNameLower === ProjectName.Domains.toLowerCase()) {
          await deleteGatewayDeployment(
            updateGrid(grid, { projectName: projectNameLower }),
            item[0].workloads[0].name as string,
          );
        } else {
          await deleteDeployment(updateGrid(grid!, { projectName: item.projectName }), {
            deploymentName: item.deploymentName,
            name: k8s ? item.deploymentName : item.name,
            projectName: item.projectName,
            ip: getDeploymentIps(item),
            k8s,
          });
        }
      } catch (e: any) {
        createCustomToast(`Failed to delete deployment with name: ${item.name}`, ToastType.danger);
        console.error("Error while deleting deployment", e.message);
      }
    }, Promise.resolve());

    table.value?.loadDeployments();
  } catch (e) {
    createCustomToast((e as Error).message, ToastType.danger);
  } finally {
    selectedItems.value = [];
    deleting.value = false;
  }
}

const VMS: string[] = [ProjectName.Fullvm, ProjectName.VM, ProjectName.NodePilot];
function openDialog(project: string, item?: any): void {
  const key: keyof typeof deploymentListEnvironments = VMS.includes(project)
    ? "vm"
    : project === ProjectName.Kubernetes
    ? "k8s"
    : (project.toLowerCase() as any);

  if (item && item.projectName && item.projectName.includes(ProjectName.Caprover.toLocaleLowerCase())) {
    if (!item.workers) {
      item = [item];
    } else {
      item = [item, ...item.workers];
    }
  }

  layout.value.openDialog(item, deploymentListEnvironments[key]);
}

function clickOpenDialog(_: MouseEvent, { item }: any) {
  return openDialog(tabs[activeTab.value].value, item);
}
/**
 * Collect the deployment interfaces ips
 * @param item deployment data
 * @returns {string[]} list of strings
 */
function getDeploymentIps(item: any): string[] {
  const ips = [];
  // wg ip
  if (item.interfaces) {
    for (const iface of item.interfaces) {
      if (iface.ip) ips.push(iface.ip);
    }
  }
  // public ip, ipv6
  if (item.publicIP) {
    if (item.publicIP.ip) ips.push(item.publicIP.ip.split("/")[0]);
    if (item.publicIP.ip6) ips.push(item.publicIP.ip6.split("/")[0]);
  }
  if (item.planetary) ips.push(item.planetary);
  if (item.myceliumIP) ips.push(item.myceliumIP);
  return ips;
}

/* List Manager */
const { uid } = getCurrentInstance() as { uid: number };
const deploymentListManager = useDeploymentListManager();

deploymentListManager?.register(uid, () => {
  return table.value?.loadDeployments;
});

onUnmounted(() => deploymentListManager?.unregister(uid));
</script>

<script lang="ts">
import type { GridClient, ZmachineData } from "@threefold/grid_client";

import { useDeploymentListManager } from "../components/deployment_list_manager.vue";
import IconActionBtn from "../components/icon_action_btn.vue";
import K8sDeploymentTable from "../components/k8s_deployment_table.vue";
import ManageCaproverWorkerDialog from "../components/manage_caprover_worker_dialog.vue";
import ManageGatewayDialog from "../components/manage_gateway_dialog.vue";
import ManageK8SWorkerDialog from "../components/manage_k8s_worker_dialog.vue";
import VmDeploymentTable from "../components/vm_deployment_table.vue";
import { ProjectName } from "../types";
import { createCustomToast, ToastType } from "../utils/custom_toast";

export default {
  name: "TfDeploymentList",
  components: {
    VmDeploymentTable,
    IconActionBtn,
    K8sDeploymentTable,
    ManageK8SWorkerDialog,
    ManageCaproverWorkerDialog,
    ManageGatewayDialog,
  },
};
</script>
