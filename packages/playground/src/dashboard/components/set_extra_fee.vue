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
          @click="showDialogue = true"
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
            <form-validator v-model="valid">
              <input-validator
                :value="fee"
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
                    v-model="fee"
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
import { onMounted, ref, watch } from "vue";

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
    const fee = ref<number>(0);
    const isDisabled = ref(false);

    onMounted(async () => {
      fee.value = (await getExtraFee()) as unknown as number;
    });

    async function getExtraFee() {
      try {
        const extraFee = await gridStore.grid.contracts.getDedicatedNodeExtraFee({ nodeId: props.nodeId });
        return extraFee;
      } catch (error) {
        console.log(error);
      }
    }

    watch(fee, async (value, _) => {
      const currentFee = await getExtraFee();
      if (Number(value) == currentFee || value === null) {
        isDisabled.value = true;
      } else {
        isDisabled.value = false;
      }
    });

    async function setExtraFee() {
      try {
        isSetting.value = true;
        await gridStore.grid.contracts.setDedicatedNodeExtraFee({
          nodeId: props.nodeId,
          extraFee: +fee.value,
        });
        createCustomToast("Additional fee is set successfully.", ToastType.success);
        await getExtraFee();
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
      fee,
      isSetting,
      isDisabled,
      setExtraFee,
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
