<template>
  <span>
    <v-tooltip text="Set Additional Fees">
      <template #activator="{ props }">
        <v-icon
          class="mx-1"
          v-bind="props"
          size="large"
          :disabled="isAdding"
          :loading="isAdding"
          @click="setupDialog()"
        >
          mdi-currency-usd
        </v-icon>
      </template>
    </v-tooltip>

    <span v-if="showDialogue">
      <v-dialog v-model="showDialogue" max-width="600" attach="#modals">
        <v-card>
          <v-card-title class="bg-primary"> Set Additional Fees </v-card-title>
          <v-card-text>
            Additional fees will be added to your node {{ $props.nodeId }} (for the special hardware you’re providing
            e.g. GPUs) while renting.
          </v-card-text>
          <v-card-text>
            <VProgressLinear indeterminate color="primary" height="2" v-if="loading" />
            <form-validator v-model="valid" v-else>
              <input-validator
                :value="inputFee"
                :rules="[
                  validators.required('Fee is required.'),
                  validators.isNumeric('Fee must be a valid number.'),
                  validators.min('Fee must be a 0 or more.', 0),
                  validators.max('Maximum allowed fee is 1000000', 10000000),
                ]"
                #="{ props }"
              >
                <input-tooltip tooltip="Fee is in USD/month">
                  <v-text-field
                    v-model="inputFee"
                    v-bind:="props"
                    suffix="USD/month"
                    outlined
                    label="Additional Fees"
                    :disabled="isSetting"
                  ></v-text-field>
                </input-tooltip>
              </input-validator>
            </form-validator>
            <v-divider></v-divider>
          </v-card-text>
          <v-card-actions class="justify-end my-1 mr-2">
            <v-btn @click="showDialogue = false" color="anchor">Close</v-btn>
            <v-btn
              color="secondary"
              @click="setExtraFee()"
              :loading="isSetting"
              :disabled="!valid || isSetting || isDisabled"
              >Save</v-btn
            >
          </v-card-actions>
        </v-card>
      </v-dialog>
    </span>
  </span>
</template>

<script lang="ts">
import { TFChainError } from "@threefold/tfchain_client";
import { ValidationError } from "@threefold/types";
import { computed, ref } from "vue";

import { useGrid } from "../../stores";
import { createCustomToast, ToastType } from "../../utils/custom_toast";

export default {
  name: "SetExtraFee",
  props: {
    nodeId: {
      type: Number,
      required: true,
    },
  },
  setup(props) {
    const showDialogue = ref(false);
    const isAdding = ref(false);
    const gridStore = useGrid();
    const valid = ref(false);
    const isSetting = ref(false);
    const inputFee = ref(0);
    const isDisabled = computed(() => {
      return currentFee.value === inputFee.value;
    });
    const currentFee = ref(0);
    const currentNodeId = ref(0);
    const loading = ref(false);

    async function setupDialog() {
      loading.value = true;
      showDialogue.value = true;
      currentNodeId.value = props.nodeId;
      currentFee.value = (await getExtraFee()) ?? 0;
      inputFee.value = currentFee.value;
      loading.value = false;
    }
    async function getExtraFee() {
      try {
        const extraFee = await gridStore.grid.contracts.getDedicatedNodeExtraFee({ nodeId: currentNodeId.value });
        return extraFee as number;
      } catch (error) {
        console.log(error);
      }
    }

    async function setExtraFee() {
      try {
        isSetting.value = true;
        await gridStore.grid.contracts.setDedicatedNodeExtraFee({
          nodeId: props.nodeId,
          extraFee: +inputFee.value,
        });
        createCustomToast("Additional fee is set successfully.", ToastType.success);
        currentFee.value = inputFee.value;
      } catch (e) {
        let msg = "Failed to set additional fees";
        if (e instanceof TFChainError && e.keyError === "NodeHasActiveContracts") msg += ". Node has active contracts.";
        if (e instanceof ValidationError && e.toString().includes("Balance is not enough"))
          msg += " due to insufficient balance.";
        createCustomToast(msg, ToastType.danger);
      } finally {
        isSetting.value = false;
        showDialogue.value = false;
      }
    }

    return {
      showDialogue,
      isAdding,
      valid,
      inputFee,
      isSetting,
      isDisabled,
      setExtraFee,
      setupDialog,
      loading,
    };
  },
};
</script>

<style scoped>
.custom-toolbar {
  height: 2.5rem !important;
  padding-left: 10px;
}
</style>
