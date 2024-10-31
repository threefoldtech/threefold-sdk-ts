<template>
  <div class="border px-4 pb-4 rounded position-relative">
    <v-card color="primary" class="d-flex justify-center items-center mt-3 pa-3 text-center">
      <v-icon size="30" class="pr-3">mdi-account-arrow-right-outline</v-icon>
      <v-card-title class="pa-0">Transfer TFTs on the TFChain</v-card-title>
    </v-card>
    <v-card>
      <v-tabs v-model="activeTab" align-tabs="center">
        <v-tab :value="0" color="secondary">By Twin ID</v-tab>
        <v-tab :value="1" color="secondary">By Address</v-tab>
      </v-tabs>
      <v-window v-model="activeTab">
        <!-- TwinID Transfer -->
        <v-window-item :value="0">
          <v-card class="pa-5 my-5" flat>
            <form-validator :key="tick" v-model="isValidTwinIDTransfer">
              <input-validator
                :value="recipientTwinId"
                :rules="[
                  validators.required('Recipient Twin ID is required'),
                  validators.isNotEmpty('Invalid Twin ID'),
                  validators.isInt('Twin ID should be a valid integer.'),
                  validators.min('Twin ID should be greater than zero', 1),
                  isSameTwinID,
                ]"
                :async-rules="[isValidTwinID]"
                #="{ props }"
              >
                <input-tooltip tooltip="Twin ID of Recipient Account">
                  <v-text-field label="Recipient Twin ID:" v-bind="props" v-model="recipientTwinId"></v-text-field>
                </input-tooltip>
              </input-validator>

              <input-validator
                :value="transferAmount"
                ref="amountRef"
                :rules="[
                  validators.required('Transfer amount is required '),
                  validators.isNumeric('Amount should be a number.'),
                  validators.min('Amount must be greater than 0.001', 0.001),
                  validators.isDecimal('Amount can have 3 decimals only.', {
                    decimal_digits: '0,3',
                  }),
                  validators.max('Insufficient funds.', freeBalance - 0.01),
                ]"
                #="{ props }"
              >
                <input-tooltip tooltip="Up to 0.01 transaction fee will be deducted">
                  <v-text-field label="Transfer Amount:" v-bind="props" v-model.number="transferAmount"></v-text-field>
                </input-tooltip>
              </input-validator>
            </form-validator>
            <v-card-actions class="justify-end mb-1 mr-2">
              <v-btn @click="clearInput" color="anchor" :disabled="loadingTwinIDTransfer">Clear</v-btn>
              <v-btn
                color="secondary"
                :loading="loadingTwinIDTransfer"
                :disabled="!isValidTwinIDTransfer"
                @click="submitFormTwinID"
                >Send</v-btn
              >
            </v-card-actions>
          </v-card>
        </v-window-item>
        <!-- Address Transfer -->

        <v-window-item :value="1">
          <v-card class="pa-5 my-5" flat>
            <form-validator :key="tick" v-model="isValidAddressTransfer">
              <input-validator
                :value="recipientAddress"
                :rules="[
                  validators.required('Recipient address is required '),
                  validators.isAlphanumeric('Invalid Address'),
                  isSameAddress,
                ]"
                :async-rules="[isValidAddress]"
                #="{ props }"
              >
                <input-tooltip tooltip="Address of Recipient Account">
                  <v-text-field label="Recipient Address:" v-model="recipientAddress" v-bind="props"> </v-text-field>
                </input-tooltip>
              </input-validator>
              <input-validator
                :value="transferAmount"
                ref="amountRef"
                :rules="[
                  validators.required('Transfer amount is required '),
                  validators.isNumeric('Amount should be a number.'),
                  validators.min('Amount must be greater than 0.001', 0.001),
                  validators.isDecimal('Amount can have 3 decimals only.', {
                    decimal_digits: '0,3',
                  }),
                  validators.max('Insufficient funds.', freeBalance - 0.01),
                ]"
                #="{ props }"
              >
                <input-tooltip tooltip="Up to 0.01 transaction fee will be deducted">
                  <v-text-field label="Transfer Amount:" v-bind="props" v-model.number="transferAmount"></v-text-field>
                </input-tooltip>
              </input-validator>
            </form-validator>
            <v-card-actions>
              <v-spacer></v-spacer>
              <v-btn @click="clearInput" color="anchor" :disabled="loadingAddressTransfer">Clear</v-btn>

              <v-btn
                color="secondary"
                :loading="loadingAddressTransfer"
                :disabled="!isValidAddressTransfer"
                @click="submitFormAddress"
                >Send</v-btn
              >
            </v-card-actions>
          </v-card>
        </v-window-item>
      </v-window>
    </v-card>
  </div>
</template>

<script lang="ts" setup>
import { Keyring } from "@polkadot/keyring";
import type { Twin } from "@threefold/tfchain_client";
import { TwinNotExistError } from "@threefold/types";
import { computed, ref, watch } from "vue";

import { useProfileManagerController } from "../components/profile_manager_controller.vue";
import { useGrid, useProfileManager } from "../stores";
import { createCustomToast, ToastType } from "../utils/custom_toast";
const gridStore = useGrid();
const profileManagerController = useProfileManagerController();
const activeTab = ref(0);
const recipientTwinId = ref("");
const isValidTwinIDTransfer = ref(false);
const transferAmount = ref();
const amountRef = ref();
const loadingTwinIDTransfer = ref(false);
const loadingAddressTransfer = ref(false);
const isValidAddressTransfer = ref(false);
const recipientAddress = ref("");
const profileManager = useProfileManager();
const profile = ref(profileManager.profile!);
const recepTwinFromAddress = ref<Twin>();
const receptTwinFromTwinID = ref<Twin>();
const balance = profileManagerController.balance;
const freeBalance = computed(() => balance.value?.free ?? 0);

watch(freeBalance, async () => {
  if (transferAmount.value) {
    await amountRef.value?.reset();
    amountRef.value?.validate();
  }
});

const tick = ref(0);
function isSameTwinID(value: string) {
  if (parseInt(value.trim()) == profile.value?.twinId) {
    return { message: "Cannot transfer to yourself" };
  }
}
async function isValidTwinID(value: string) {
  try {
    if (gridStore) {
      receptTwinFromTwinID.value = await gridStore.client.twins.get({
        id: parseInt(value.trim()),
      });
      if (receptTwinFromTwinID.value == null) {
        return { message: "This twin id doesn't exist" };
      }
    }
  } catch (err) {
    if (err instanceof TwinNotExistError) return { message: "This twin id doesn't exist" };
    else return { message: "Couldn't validate twin id" };
  }
}
function isSameAddress(value: string) {
  if (value.trim() == profile.value?.address) {
    return { message: "Cannot transfer to yourself" };
  }
}
async function isValidAddress() {
  const keyring = new Keyring({ type: "sr25519" });
  try {
    keyring.addFromAddress(recipientAddress.value.trim());
  } catch (error) {
    return { message: "Invalid address." };
  }
  try {
    if (gridStore) {
      const twinId = await gridStore.client.twins.get_twin_id_by_account_id({
        public_key: recipientAddress.value.trim(),
      });
      recepTwinFromAddress.value = await gridStore.client.twins.get({
        id: twinId,
      });
      if (recepTwinFromAddress.value == null) {
        return { message: "Twin ID doesn't exist" };
      }
    }
  } catch (err) {
    return { message: "Invalid address. Twin ID doesn't exist" };
  }
}
function clearInput() {
  transferAmount.value = undefined;
  recipientTwinId.value = "";
  recipientAddress.value = "";
  tick.value++;
}

async function transfer(recipientTwin: Twin) {
  try {
    if (gridStore) {
      await gridStore.client.balance.transfer({
        address: recipientTwin.accountId,
        amount: transferAmount.value,
      });
      clearInput();
      createCustomToast("Transaction Complete!", ToastType.success);
      profileManagerController.reloadBalance();
    }
  } catch (err) {
    createInvalidTransferToast("transfer failed!");
  }
}
async function submitFormAddress() {
  loadingAddressTransfer.value = true;
  await transfer(recepTwinFromAddress.value!);
  loadingAddressTransfer.value = false;
}
function createInvalidTransferToast(message: string) {
  createCustomToast(message, ToastType.danger);
}
async function submitFormTwinID() {
  if (gridStore) {
    const twinDetails = await gridStore.client.twins.get({
      id: parseInt(recipientTwinId.value.trim()),
    });
    if (twinDetails != null) {
      loadingTwinIDTransfer.value = true;
      await transfer(twinDetails);
      loadingTwinIDTransfer.value = false;
    } else {
      createInvalidTransferToast("twin ID doesn't exist");
    }
  }
}
</script>
