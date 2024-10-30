<template>
  <VContainer>
    <VRow class="mx-2" align="center">
      <span v-if="showPrice" v-text="usdPrice + ' USD'" :class="{ 'order-0': swap, 'order-2': !swap }" />
      <VTooltip :text="priceTask.error || ''" :disabled="!priceTask.error">
        <template #activator="{ props }">
          <VBtn
            icon="mdi-swap-horizontal"
            class="mx-1 order-1"
            @click="priceTask.error ? priceTask.run() : toggleSwap()"
            :loading="priceTask.loading"
            :color="priceTask.error ? 'error' : 'anchor'"
            v-bind="props"
          />
        </template>
      </VTooltip>
      <span v-if="showPrice" v-text="tftPrice + ' TFT'" :class="{ 'order-2': swap, 'order-0': !swap }" />

      <VTooltip text="More information" location="left">
        <template #activator="{ props }">
          <VBtn
            icon="mdi-information-outline"
            href="https://stellar.expert/explorer/public/asset/TFT-GBOVQKJYHXRR3DX6NOX2RRYFRCUMSADGDESTDNBDS6CDVLGVESRTAC47-1?asset[]=TFT-GBOVQKJYHXRR3DX6NOX2RRYFRCUMSADGDESTDNBDS6CDVLGVESRTAC47-1&filter=markets&market=USDC-GA5ZSEJYB37JRC5AVCIA5MOP4RHTM335X2KGX3IHOJAPP5RE34K4KZVN-1"
            target="_blank"
            v-bind="props"
            color="anchor"
            class="mr-0 mr-md-4 ml-1 order-3"
          />
        </template>
      </VTooltip>

      <div class="order-10">
        <slot />
      </div>
    </VRow>
  </VContainer>
</template>

<script lang="ts">
import { computed, ref } from "vue";

import { queryClient } from "../clients";
import { useAsync } from "../hooks";
import { resolveAsync } from "../utils/nodeSelector";

export default {
  name: "TfSwapPrice",
  setup() {
    const priceTask = useAsync<number, string>(
      async () => {
        const [price, error] = await resolveAsync(queryClient.tftPrice.get());
        if (!price || error) {
          throw `Failed to load TFT price. Please click to reload.`;
        }

        return price / 1000;
      },
      { init: true, default: 1, tries: 5 },
    );

    const swap = ref(false);
    const toggleSwap = () => (swap.value = !swap.value);

    const tftPrice = computed(() => {
      if (!swap.value || !priceTask.value.initialized) {
        return 1;
      }

      const r = 1 / (priceTask.value.data as number);
      return Math.floor(r * 1000) / 1000;
    });

    const usdPrice = computed(() => {
      if (swap.value || !priceTask.value.initialized) {
        return 1;
      }

      return priceTask.value.data;
    });

    const showPrice = computed(() => {
      const { initialized, loading, error } = priceTask.value;
      return initialized && !loading && !error;
    });

    return { priceTask, swap, toggleSwap, usdPrice, tftPrice, showPrice };
  },
};
</script>
