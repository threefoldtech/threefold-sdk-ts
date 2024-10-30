<template>
  <v-card ref="webletLayoutContainer">
    <section class="d-flex align-center">
      <div>
        <v-card-title v-if="$slots.title" class="font-weight-bold d-flex align-center title">
          <img
            :src="baseUrl + titleImage"
            alt="title image"
            v-if="titleImage"
            :style="{
              filter: `brightness(${$vuetify.theme.global.name === 'light' ? 0.2 : 1})`,
            }"
          />
          <slot name="title" />
        </v-card-title>
        <v-card-subtitle v-if="$slots.subtitle" :style="{ whiteSpace: 'initial' }">
          <slot name="subtitle" />
        </v-card-subtitle>
      </div>
      <v-spacer />
      <div class="mr-4" v-if="$slots['header-actions']">
        <slot name="header-actions" :hasProfile="!!profileManager.profile" />
      </div>
    </section>
    <v-card-text>
      <slot v-if="disableAlerts" />
      <template v-else>
        <v-alert variant="tonal" type="info" v-show="!profileManager.profile"> Please connect your wallet </v-alert>

        <div ref="msgAlert">
          <v-alert variant="tonal" v-show="profileManager.profile && status" :type="alertType">
            {{ message }}
          </v-alert>
        </div>

        <div v-show="profileManager.profile && !status">
          <slot v-if="profileManager.profile" />
        </div>
      </template>
    </v-card-text>

    <template v-if="dedicated && !status">
      <v-alert class="mb-4 mx-4" type="info" variant="tonal"> You need to rent a node before deploying on it. </v-alert>
    </template>

    <template v-if="$slots['footer-actions'] && (profileManager.profile || disableAlerts)">
      <v-alert
        v-show="!status"
        class="mx-4"
        :style="{ fontSize: '1.2rem' }"
        type="info"
        variant="tonal"
        v-if="showPrice"
      >
        <div v-if="ipv4 && dedicated">
          <span>
            There are no fees will be added since the selected node is rented by you and the cost already included in
            the rent contract. <br />Please be aware that an additional fee of
            <span class="font-weight-black">
              {{ costLoading ? "Calculating..." : normalizeBalance(onlyIPV4TftPrice) }}
            </span>
            TFTs or approximately
            <span class="font-weight-black">
              {{ costLoading ? "Calculating..." : normalizeBalance(onlyIPV4UsdPrice) }}
            </span>
            USD per month.
          </span>
        </div>
        <div v-else-if="!ipv4 && dedicated">
          <span>
            There are no fees will be added since the selected node is rented by you and the cost already included in
            the rent contract.
          </span>
        </div>
        <div v-else>
          Based on the cloud resources you have selected (CPU: {{ cpu }} Cores, RAM: {{ memory }} MB, SSD:
          {{ disk }} GB{{ ipv4 ? ", Public IP: Enabled" : "" }}) your deployment costs
          <span class="font-weight-black">{{ costLoading ? "Calculating..." : normalizeBalance(tft) }}</span>
          TFTs or approximately
          <span class="font-weight-black">{{ costLoading ? "Calculating..." : normalizeBalance(usd) }}</span>
          USD per month.

          <div v-if="SelectedNode?.certificationType === 'Certified'">
            You selected a certified node. Please note that this deployment costs more TFT.
          </div>
        </div>
        <div v-if="ipv4">Please Note that the Bandwidth affects the total cost (1 Bandwidth = 0.01 TFT/hour).</div>
        <a :href="manual.pricing" target="_blank" class="app-link">
          Learn more about the pricing and how to unlock discounts.
        </a>
      </v-alert>
      <v-divider class="mt-3" />
      <v-card-actions class="justify-end my-1 mr-2">
        <slot name="footer-actions" :validateBeforeDeploy="validateBeforeDeploy" v-if="!status" />
        <v-btn v-else color="secondary" :loading="status === 'deploy'" @click="reset"> Back </v-btn>
      </v-card-actions>
    </template>
  </v-card>

  <DeploymentDataDialog
    :data="dialogData"
    :environments="environments"
    :onlyJson="onlyJson"
    v-if="dialogData"
    @close="dialogData = environments = undefined"
  />
</template>

<script lang="ts" setup>
import { events, type GridClient, type NodeInfo } from "@threefold/grid_client";
import debounce from "lodash/debounce.js";
import { computed, ref, watch } from "vue";

import { manual } from "@/utils/manual";

import { useGrid, useProfileManager } from "../stores";
import { loadBalance, updateGrid } from "../utils/grid";
import { normalizeBalance } from "../utils/helpers";

const props = defineProps({
  disableAlerts: {
    type: Boolean,
    required: false,
    default: false,
  },
  cpu: {
    type: Number,
    required: false,
  },
  memory: {
    type: Number,
    required: false,
  },
  disk: {
    type: Number,
    required: false,
  },
  titleImage: {
    type: String,
    required: false,
  },
  ipv4: {
    type: Boolean,
    required: false,
    default: () => false,
  },
  dedicated: {
    type: Boolean,
    required: false,
    default: () => false,
  },
  SelectedNode: Object as PropType<NodeInfo>,
  validFilters: Boolean,
});
const emits = defineEmits<{ (event: "mount"): void; (event: "back"): void }>();
const baseUrl = import.meta.env.BASE_URL;
const profileManager = useProfileManager();
const webletLayoutContainer = ref<VCard>();
const status = ref<WebletStatus>();
const message = ref<string>();
const gridStore = useGrid();
const grid = gridStore.client as GridClient;
const msgAlert = ref<HTMLElement>();

function onLogMessage(msg: string) {
  if (typeof msg === "string") {
    message.value = msg;
  }
}

watch(status, s => {
  if (s === "deploy") events.addListener("logs", onLogMessage);
  else events.removeListener("logs", onLogMessage);
});
const alertType = computed(() => {
  if (status.value === "deploy") return "info";
  else if (status.value === "failed") return "error";
  return "success";
});

const dialogData = ref();
const environments = ref();
const onlyJson = ref();

let __forms: FormValidatorService[] = [];
let __setTab: (tab: number) => void = () => void 0;

provideService({
  set(forms, setTab) {
    __forms = forms as any;
    __setTab = setTab;
  },
  clear() {
    __forms = [];
    __setTab = () => void 0;
  },
});

function validateBeforeDeploy(fn: () => void, documentScrollend = false) {
  const forms = __forms;

  let errorInput: [number, any, boolean] | null = null;

  out: for (let i = 0; i < forms.length; i++) {
    const form = forms[i];
    const inputs = form.inputs as unknown as InputValidatorService[];

    for (const input of inputs) {
      const status = typeof input.status === "string" ? input.status : (input.status as any)?.value;
      if (status === ValidatorStatus.Invalid) {
        errorInput = [i, input.$el, input.highlightOnError || false];
        break out;
      }

      const valid = status === ValidatorStatus.Valid || (status === ValidatorStatus.Init && form.validOnInit);

      if ((!status || !valid) && !errorInput) {
        errorInput = [i, input.$el, input.highlightOnError || false];
      }
    }
  }

  if (errorInput) {
    const [tab, __input, highlightOnError] = errorInput;

    const input =
      __input && typeof __input === "object" && "value" in __input && __input.value instanceof HTMLElement
        ? __input.value
        : __input instanceof HTMLElement
        ? __input
        : null;

    if (!input || !__setTab) {
      return;
    }

    __setTab(tab);

    // Timeout so the ui gets render before scroll
    setTimeout(() => {
      const _input = input.querySelector("textarea") || input.querySelector("input") || input;
      if (!(_input instanceof HTMLElement)) {
        return;
      }

      documentScrollend && document.addEventListener("scrollend", _improveUx, { once: true });
      !documentScrollend && setTimeout(_improveUx, 500);
      _input.scrollIntoView({ behavior: "smooth", block: "center" });

      async function _improveUx() {
        if (!(_input instanceof HTMLElement)) return;

        if (_input instanceof HTMLInputElement || _input instanceof HTMLTextAreaElement) {
          // use `requestAnimationFrame` to avoid browser possible lagging
          requestAnimationFrame(() => _input.focus());
          requestAnimationFrame(() => _input.blur());
          requestAnimationFrame(() => _input.focus());
        }

        if (input instanceof HTMLElement && highlightOnError) {
          input.classList.add("weblet-layout-error-transition");
          requestAnimationFrame(() => {
            input.classList.add("weblet-layout-error");
          });
        }
      }
    }, 250);

    return;
  }

  msgAlert.value?.scrollIntoView({ behavior: "smooth", block: "center" });
  return fn();
}

defineExpose({
  async validateBalance(grid: GridClient, min = 2) {
    message.value = "Checking your balance...";

    const balance = await loadBalance(grid);
    if (balance.free < min) {
      throw new Error(`Insufficient balance: it's required to have at least ${min} TFT.`);
    }
    message.value = "You have enough TFT to continue...";
    return balance;
  },

  setStatus(s: WebletStatus, m?: string) {
    if (s !== "deploy" && !m) {
      throw new Error("Message need to be passed while settingStatus.");
    }

    message.value = m ? m : "Preparing to deploy...";
    status.value = s;
  },

  openDialog(data?: any, envs?: { [key: string]: string | boolean } | false, json?: boolean) {
    dialogData.value = data;
    environments.value = envs;
    onlyJson.value = json;
  },
  validateSSH() {
    if (!profileManager.profile!.ssh) {
      throw new Error("You must provide an SSH key to deploy");
    }
  },

  status: computed(() => status.value),

  reloadDeploymentsList,
});

function reset() {
  if (status.value === "success") {
    const element = webletLayoutContainer.value?.$el as HTMLElement;
    if (element) {
      element.dispatchEvent(new CustomEvent("render:solution", { bubbles: true, cancelable: true, composed: true }));
    }
  }
  status.value = undefined;
  message.value = undefined;
  emits("back");
}

const deploymentListManager = useDeploymentListManager();
function reloadDeploymentsList() {
  deploymentListManager?.load();
}

watch(
  () => !!profileManager.profile || props.disableAlerts,
  (value, oldValue) => {
    if (value && value !== oldValue) {
      reset();
      emits("mount");
    }
  },
  { immediate: true },
);

/* Calculate Price */
const showPrice = computed(
  () => props.validFilters && !!profileManager.profile && props.cpu && props.memory && props.disk,
);
const usd = ref<number>();
const tft = ref<number>();
const costLoading = ref(false);
const shouldUpdateCost = ref(false);
const onlyIPV4TftPrice = ref<number>();
const onlyIPV4UsdPrice = ref<number>();

watch(
  () => [props.cpu, props.memory, props.disk, props.ipv4, props.dedicated, props.SelectedNode],
  debounce((value, oldValue) => {
    if (
      oldValue &&
      value[0] === oldValue[0] &&
      value[1] === oldValue[1] &&
      value[2] === oldValue[2] &&
      value[3] === oldValue[3] &&
      value[4] === oldValue[4] &&
      value[5] === oldValue[5]
    )
      return;
    shouldUpdateCost.value = true;
  }, 500),
  { immediate: true },
);

watch(
  () => [profileManager.profile, costLoading.value, shouldUpdateCost.value] as const,
  ([profile, loading, shouldUpdate]) => {
    if (!profile || loading || !shouldUpdate) return;
    shouldUpdateCost.value = false;
    loadCost(profile);
  },
);

async function getIPv1Price(grid: GridClient) {
  const { sharedPrice } = await grid!.calculator.calculateWithMyBalance({
    sru: 0,
    mru: 0,
    cru: 0,
    ipv4u: props.ipv4,
    hru: 0,
    certified: false,
  });
  onlyIPV4UsdPrice.value = sharedPrice;
  onlyIPV4TftPrice.value = parseFloat((onlyIPV4UsdPrice.value / (await grid!.calculator.tftPrice())).toFixed(2));
}

async function loadCost(profile: { mnemonic: string }) {
  if (!props.validFilters) {
    return;
  }

  costLoading.value = true;
  updateGrid(grid, { projectName: "" });
  const { sharedPrice, dedicatedPrice } = await grid!.calculator.calculateWithMyBalance({
    cru: typeof props.cpu === "number" ? props.cpu : 0,
    sru: typeof props.disk === "number" ? props.disk : 0,
    mru: typeof props.memory === "number" ? (props.memory ?? 0) / 1024 : 0,
    hru: 0,
    ipv4u: props.ipv4,
    certified: props.SelectedNode?.certificationType === "Certified" ?? false,
  });
  await getIPv1Price(grid!);
  usd.value = props.dedicated ? dedicatedPrice : sharedPrice;
  tft.value = parseFloat((usd.value / (await grid!.calculator.tftPrice())).toFixed(2));
  costLoading.value = false;
}
</script>

<script lang="ts">
import type { ComputedRef, PropType, Ref } from "vue";
import { inject, provide } from "vue";
import type { VCard } from "vuetify/components/VCard";

import { type FormValidatorService, ValidatorStatus } from "@/hooks/form_validator";
import type { InputValidatorService } from "@/hooks/input_validator";

import type { Balance } from "../utils/grid";
import DeploymentDataDialog from "./deployment_data_dialog.vue";
import { useDeploymentListManager } from "./deployment_list_manager.vue";

export type WebletStatus = "deploy" | "success" | "failed";

export interface WebletLayout {
  validateBalance(grid: GridClient, min?: number): Promise<Balance>;
  setStatus(status: WebletStatus, message?: string): void;
  openDialog(
    data: any,
    envs?: { [key: string]: string | boolean | { label: string; type?: string } } | false,
    json?: boolean,
  ): void;
  status: ComputedRef<WebletStatus> | string;
  reloadDeploymentsList(): void;
  validateSSH(): void;
}

export function useLayout() {
  return ref() as Ref<WebletLayout>;
}

const KEY = "weblet:layout";

export interface WebletLayoutService {
  set(forms: FormValidatorService[], activeTab: (tab: number) => void): void;
  clear(): void;
}

function provideService(service: WebletLayoutService) {
  provide(KEY, service);
}

export function useWebletLayoutServie() {
  return inject(KEY) as WebletLayoutService;
}

export default {
  name: "WebletLayout",
  components: {
    DeploymentDataDialog,
  },
};
</script>

<style>
.title img {
  margin-right: 5px;
  max-height: 24px;
}

.weblet-layout-error-transition {
  will-change: padding;
  transition: padding 0.15s ease-in-out;
}

.weblet-layout-error {
  border: thin solid rgba(var(--v-theme-error), 1) !important;
  padding: 8px !important;
  margin-bottom: 8px !important;
}
</style>
