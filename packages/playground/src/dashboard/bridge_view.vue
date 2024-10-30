<template>
  <div class="border px-4 pb-4 rounded position-relative">
    <v-card color="primary" class="d-flex justify-center items-center mt-3 pa-3 text-center">
      <v-icon size="30" class="pr-3">mdi-swap-horizontal</v-icon>
      <v-card-title class="pa-0">Transfer TFT Across Chains</v-card-title>
    </v-card>
    <v-card class="white--text pa-4">
      <v-row class="text-center pt-4">
        <v-col cols="12">
          <v-text-field model-value="Stellar" label="Selected Chain" variant="outlined" readonly></v-text-field>
        </v-col>
      </v-row>
      <v-row class="max_line justify-space-between pa-sm-4">
        <v-btn class="mb-4 mr-2" color="secondary" @click="navigation">Learn How?</v-btn>
        <div class="mb-2">
          <v-btn color="secondary" class="mr-2" @click="openWithdrawDialog = true">Withdraw</v-btn>
          <v-btn variant="elevated" class="" @click="openDepositDialog = true">Deposit</v-btn>
        </div>
      </v-row>
    </v-card>
  </div>

  <!-- Deposit Dialog -->
  <deposit-dialog
    v-if="openDepositDialog"
    :selectedName="selectedName"
    :depositWallet="depositWallet"
    :qrCodeText="qrCodeText"
    :depositFee="depositFee"
    :openDepositDialog="openDepositDialog"
    :twinId="profileManager.profile?.twinId"
    @close="openDepositDialog = false"
  ></deposit-dialog>

  <!-- Withdraw Dialog -->
  <withdraw-dialog
    v-if="openWithdrawDialog"
    :selectedName="selectedName"
    :withdrawFee="withdrawFee"
    :openWithdrawDialog="openWithdrawDialog"
    :freeBalance="freeBalance"
    @close="openWithdrawDialog = false"
  ></withdraw-dialog>
</template>

<script lang="ts" setup>
import { onMounted, ref } from "vue";

import { useGrid, useProfileManager } from "../stores";
import { loadBalance } from "../utils/grid";

const profileManager = useProfileManager();
const items = ref([{ id: 1, name: "stellar" }]);
const selectedItem = ref(items.value[0]);
const openDepositDialog = ref(false);
const openWithdrawDialog = ref(false);
const selectedName = ref("");
const withdrawFee = ref(0);
const freeBalance = ref(0);
const depositWallet = ref("");
const qrCodeText = ref("");
const depositFee = ref(0);
const gridStore = useGrid();
const grid = gridStore.client as GridClient;

onMounted(async () => {
  selectedName.value = items.value.filter(item => item.id === selectedItem.value.id)[0].name;
  depositWallet.value = window.env.BRIDGE_TFT_ADDRESS;
  qrCodeText.value = `TFT:${depositWallet.value}?message=twin_${profileManager.profile?.twinId}&sender=me`;
  try {
    if (grid) {
      const WithdrawFee = await grid.bridge.getWithdrawFee();
      withdrawFee.value = WithdrawFee;

      const DepositFee = await grid.bridge.getDepositFee();
      depositFee.value = DepositFee;

      const balance = await loadBalance(grid);
      freeBalance.value = balance.free;
    }
  } catch (e) {
    console.log(e);
  }
});

function navigation() {
  window.open(manual.tfchain_stellar_bridge, "_blank");
}
</script>

<script lang="ts">
import type { GridClient } from "@threefold/grid_client";

import DepositDialog from "@/components/deposit_dialog.vue";
import WithdrawDialog from "@/components/withdraw_dialog.vue";
import { manual } from "@/utils/manual";

export default {
  name: "Bridge",
  components: {
    DepositDialog,
    WithdrawDialog,
  },
};
</script>

<style scoped>
@media (max-width: 425px) {
  .max_line {
    flex-basis: auto !important;
    justify-content: center !important;
  }
}
</style>
