<template>
  <v-container>
    <v-dialog
      transition="dialog-bottom-transition"
      v-model="depositDialog"
      @update:model-value="closeDialog"
      attach="#modals"
    >
      <v-card>
        <VCardTitle class="bg-primary">Deposit TFT</VCardTitle>
        <v-card-text>
          <v-container>
            <v-row class="py-2">
              <v-col sm="12" md="6" class="">
                <div class="mb-2">
                  <p>
                    Deposit your TFTs to Threefold Bridge using a
                    {{ selectedName ? selectedName.charAt(0).toUpperCase() + selectedName.slice(1) : "" }}
                    transaction.
                  </p>
                  <p class="mt-1 mb-8 text-secondary text-sm-subtitle-2 font-weight-bold">Deposit fee is 1 TFT</p>
                </div>
                <input-tooltip
                  v-if="selectedName == 'stellar'"
                  tooltip="Threefold Stellar account"
                  :href="stellarLink"
                  target="_blank"
                >
                  <CopyReadonlyInput label="Destination" :data="depositWallet"></CopyReadonlyInput>
                </input-tooltip>
                <CopyReadonlyInput v-else label="Destination" :data="depositWallet"></CopyReadonlyInput>
                <div class="memo-text-warn">
                  <CopyReadonlyInput
                    label="Memo Text"
                    :data="`twin_${twinId}`"
                    hint="Add twin ID as memo text or you will lose your tokens"
                  />
                </div>
                <div style="margin-top: 5rem">
                  <p
                    :class="theme.name.value === AppThemeSelection.light ? 'text-primary' : 'text-info'"
                    :style="{ paddingBottom: '3rem' }"
                  >
                    Waiting for receiving TFTs{{ dots }}
                  </p>
                </div>
              </v-col>
              <v-divider class="mx-4" vertical></v-divider>
              <v-col>
                <QRPlayStore :qr="qrCodeText" />
              </v-col>
            </v-row>
          </v-container>
          <v-divider />
        </v-card-text>
        <v-card-actions class="justify-end my-1 mr-2">
          <v-btn color="anchor" @click="closeDialog"> Close </v-btn>
          <v-btn color="secondary" :href="manual.tft_bridges" target="_blank" text="Learn more?" />
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-container>
</template>

<script setup lang="ts">
import { Decimal } from "decimal.js";
import { computed, onBeforeUnmount, onMounted, ref } from "vue";
import { useTheme } from "vuetify";

import { AppThemeSelection } from "@/utils/app_theme";
import { manual } from "@/utils/manual";

import { useProfileManagerController } from "../components/profile_manager_controller.vue";
import { useGrid, useProfileManager } from "../stores";
import { createCustomToast, ToastType } from "../utils/custom_toast";
import CopyReadonlyInput from "./copy_readonly_input.vue";
const depositDialog = ref(false);
const emits = defineEmits(["close"]);
const profileManager = useProfileManager();
let destroyed = false;
const loading = ref(false);
const dots = ref(".");
const interval = ref<number | null>(null);
const ProfileManagerController = useProfileManagerController();
const gridStore = useGrid();
const grid = gridStore.client as GridClient;
const theme = useTheme();

const props = defineProps({
  selectedName: String,
  depositWallet: String,
  qrCodeText: String,
  depositFee: Number,
  openDepositDialog: Boolean,
  twinId: Number,
});

function loadingDots() {
  if (dots.value === "...") {
    dots.value = ".";
  } else {
    dots.value += ".";
  }
}

const stellarLink = computed(() => {
  if (window.env.NETWORK !== "dev" && window.env.NETWORK !== "qa") {
    return `https://stellar.expert/explorer/public/account/${props.depositWallet}`;
  }
  return `https://stellar.expert/explorer/testnet/account/${props.depositWallet}`;
});

onMounted(async () => {
  if (!props.openDepositDialog) return;
  if (interval.value !== null) {
    window.clearInterval(interval.value);
  }
  depositDialog.value = true;
  interval.value = window.setInterval(loadingDots, 500);
  try {
    loading.value = true;
    updateGrid(grid, { projectName: "" });
    const address = profileManager.profile?.address as string;
    const receivedDeposit = await grid!.bridge.listenToMintCompleted({
      address: address,
    });
    loading.value = false;
    if (destroyed) return;
    const DecimalDeposit = new Decimal(receivedDeposit);
    const divisor = new Decimal(10000000);
    createCustomToast(`You have received ${DecimalDeposit.dividedBy(divisor)} TFT`, ToastType.success);
    await ProfileManagerController.reloadBalance();
    closeDialog();
  } catch (e) {
    if (destroyed) return;
    console.log(e);
    createCustomToast(e as string, ToastType.danger);
    closeDialog();
  }
});

const closeDialog = () => {
  depositDialog.value = false;
  emits("close");
};

onBeforeUnmount(() => {
  destroyed = true;
});
</script>
<script lang="ts">
import type { GridClient } from "@threefold/grid_client";
import { defineComponent } from "vue";

import { updateGrid } from "../utils/grid";
import QRPlayStore from "./qr_play_store.vue";

export default defineComponent({
  name: "DepositDialog",
  components: { QRPlayStore },
});
</script>

<style>
.bold-text {
  font-weight: 500;
  padding-left: 1rem;
}

.memo-text-warn .copy-input-wrapper .v-messages__message {
  color: rgb(var(--v-theme-warning));
}
</style>
