<template>
  <v-container>
    <v-dialog
      transition="dialog-bottom-transition"
      v-model="withdrawDialog"
      @update:model-value="closeDialog"
      attach="#modals"
    >
      <v-card>
        <v-card-title class="bg-primary"> Withdraw TFT </v-card-title>
        <v-card-text>
          Interact with the bridge in order to withdraw your TFT to
          {{ selectedName?.charAt(0).toUpperCase() + selectedName!.slice(1) }} (withdraw fee is: {{ withdrawFee }} TFT)
        </v-card-text>
        <v-card-text>
          <FormValidator v-model="valid">
            <InputValidator
              :value="target"
              :rules="[validators.required('This field is required'), () => swapAddressCheck()]"
              :async-rules="[validateAddress]"
              #="{ props: validationProps }"
            >
              <v-text-field
                v-bind="{ ...validationProps }"
                v-model="target"
                :label="selectedName?.charAt(0).toUpperCase() + selectedName!.slice(1) + ' Target Wallet Address'"
                :disabled="validatingAddress"
                :loading="validationProps.loading"
              >
              </v-text-field>
            </InputValidator>
            <InputValidator
              :value="amount"
              #="{ props: validationProps }"
              :rules="[
              validators.required('This field is required'),
              validators.min('Amount should be at least 2 TFT', 2),
              validators.max( 'Amount cannot exceed balance',freeBalance!),
              validators.isValidDecimalNumber(3,'Amount must have 3 decimals only')
            ]"
            >
              <v-text-field
                v-bind="{ ...validationProps }"
                @paste.prevent
                label="Amount (TFT)"
                v-model="amount"
                type="number"
                onkeydown="javascript: return event.keyCode == 69 || /^\+$/.test(event.key) ? false : true"
              >
              </v-text-field>
            </InputValidator>
          </FormValidator>
          <v-divider />
        </v-card-text>
        <v-card-actions class="justify-end mb-1 mr-2">
          <v-btn color="anchor" @click="closeDialog"> Close </v-btn>
          <v-btn
            color="secondary"
            @click="withdrawTFT(target, amount)"
            :disabled="!valid || validatingAddress"
            :loading="loadingWithdraw"
            >Send</v-btn
          >
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-container>
</template>

<script setup lang="ts">
import { StrKey } from "stellar-sdk";
import { onMounted, ref } from "vue";

import { useProfileManagerController } from "../components/profile_manager_controller.vue";
import { useGrid } from "../stores";
import { createCustomToast, ToastType } from "../utils/custom_toast";
import { isValidStellarAddress } from "../utils/validators";
const withdrawDialog = ref(false);
const targetError = ref("");
const target = ref("");
const valid = ref(false);
const validatingAddress = ref(false);
const loadingWithdraw = ref(false);
const ProfileManagerController = useProfileManagerController();
const amount = ref(2);
const emits = defineEmits(["close"]);
const gridStore = useGrid();
const grid = gridStore.client as GridClient;

const props = defineProps({
  selectedName: String,
  withdrawFee: Number,
  openWithdrawDialog: Boolean,
  freeBalance: Number,
});

onMounted(async () => {
  if (!props.openWithdrawDialog) return;
  withdrawDialog.value = true;
});

function swapAddressCheck() {
  targetError.value = "";
  if (!target.value) {
    return;
  }
  const isValid = StrKey.isValidEd25519PublicKey(target.value);
  const blockedAddresses = [
    "GBNOTAYUMXVO5QDYWYO2SOCOYIJ3XFIP65GKOQN7H65ZZSO6BK4SLWSC",
    "GA2CWNBUHX7NZ3B5GR4I23FMU7VY5RPA77IUJTIXTTTGKYSKDSV6LUA4",
  ];
  if (blockedAddresses.includes(target.value)) {
    return {
      message: "Bridge address cannot be used as Stellar target wallet address.",
    };
  }
  if (!isValid || target.value.match(/\W/)) {
    return {
      message: "Invalid address",
    };
  }
  targetError.value = "";
}

async function validateAddress() {
  if (props.selectedName == "stellar") return await isValidStellarAddress(target.value);
}

async function withdrawTFT(targetAddress: string, withdrawAmount: number) {
  loadingWithdraw.value = true;
  try {
    updateGrid(grid, { projectName: "" });
    await grid?.bridge.swapToStellar({ amount: +withdrawAmount, target: targetAddress });

    await ProfileManagerController.reloadBalance();
    createCustomToast("Transaction Succeeded", ToastType.success);
    closeDialog();
  } catch (e) {
    console.log("Error withdrawing, Error: ", e);

    createCustomToast("Withdraw Failed!", ToastType.danger);
    closeDialog();
  }
}

const closeDialog = () => {
  withdrawDialog.value = false;
  emits("close");
};
</script>
<script lang="ts">
import type { GridClient } from "@threefold/grid_client";
import { defineComponent } from "vue";

import { updateGrid } from "../utils/grid";

export default defineComponent({
  name: "WithdrawDialog",
});
</script>

<style>
.bold-text {
  font-weight: 500;
  padding-left: 1rem;
}
</style>
