<template>
  <ViewLayout>
    <VCard>
      <v-card color="primary" class="d-flex justify-center items-center pa-3 text-center">
        <v-icon size="30" class="pr-3">mdi-currency-usd</v-icon>
        <v-card-title class="pa-0">Pricing Calculator</v-card-title>
      </v-card>
      <VCardText>
        <VContainer fluid>
          <VAlert type="info" class="mb-10">
            For more information about Threefold Pricing check,
            <a class="app-link" target="_blank" :href="manual.pricing" v-text="'Cloud Unit Pricing'" />
          </VAlert>

          <VForm
            ref="form"
            @vue:mounted="($refs.form as VForm).validate()"
            :model-value="valid"
            @update:model-value="
              valid = $event as boolean;
              if ($event) {
                priceTask.run();
              }
            "
            @input="priceTask.run()"
          >
            <VRow>
              <v-col md="6" sm="12" xs="12">
                <InputTooltip tooltip="The number of virtual cores.">
                  <VTextField
                    label="CPU (vCores)"
                    suffix="vCores"
                    min="1"
                    max="256"
                    :rules="[cruRules]"
                    v-model="resources.cru"
                  />
                </InputTooltip>
              </v-col>

              <v-col md="6" sm="12" xs="12">
                <InputTooltip tooltip="The amount of RAM (Random Access Memory) in GB.">
                  <VTextField
                    label="Memory (GB)"
                    suffix="GB"
                    min="1"
                    max="1024"
                    :rules="[mruRules]"
                    v-model="resources.mru"
                  />
                </InputTooltip>
              </v-col>

              <VCol lg="6" md="6" sm="12">
                <InputTooltip tooltip="The SSD capacity storage.">
                  <VTextField
                    label="Disk SSD"
                    suffix="GB"
                    min="1"
                    max="1000000"
                    :rules="[sruRules]"
                    v-model="resources.sru"
                  />
                </InputTooltip>
              </VCol>

              <VCol lg="6" md="6" sm="12">
                <InputTooltip tooltip="The HDD capacity storage.">
                  <VTextField
                    label="Disk HDD"
                    suffix="GB"
                    min="0"
                    max="1000000"
                    :rules="[hruRules]"
                    v-model="resources.hru"
                  />
                </InputTooltip>
              </VCol>

              <VCol lg="6" md="6" sm="12">
                <InputTooltip tooltip="To input network bandwidth, The public IPv4 should be enabled.">
                  <VTextField
                    label="Bandwidth"
                    suffix="GB"
                    min="0"
                    max="1000000"
                    :disabled="!resources.ipv4"
                    :rules="[nuRules]"
                    v-model="resources.nu"
                  />
                </InputTooltip>
              </VCol>

              <VCol lg="6" md="6" sm="12">
                <InputTooltip tooltip="The amount of TFT to calculate discount.">
                  <VTextField
                    label="Balance"
                    :max="10 ** 15"
                    suffix="TFT"
                    :rules="[balanceRules]"
                    :disabled="userBalance && resources.useCurrentBalance"
                    :model-value="userBalance && resources.useCurrentBalance ? userBalance.free : resources.balance"
                    @update:model-value="resources.balance = $event"
                  />
                </InputTooltip>
              </VCol>
            </VRow>

            <VRow class="x_small">
              <VCol lg="4" md="6" sm="12" xs="12">
                <InputTooltip
                  inline
                  tooltip=" A certified node will receive 25% more reward compared to a non-certified node."
                >
                  <VSwitch color="primary" inset label="Certified Node" hide-details v-model="resources.certified" />
                </InputTooltip>
              </VCol>

              <VCol lg="4" md="6" sm="12" xs="12">
                <InputTooltip
                  inline
                  tooltip="An Internet Protocol version 4 address that is globally unique and accessible over the internet"
                >
                  <VSwitch color="primary" inset label="With a Public IPv4" hide-details v-model="resources.ipv4" />
                </InputTooltip>
              </VCol>

              <VCol
                lg="4"
                md="6"
                sm="12"
                xs="12"
                v-if="userBalance"
                @vue:unmounted="
                  resources.useCurrentBalance = true;
                  priceTask.run();
                "
              >
                <input-tooltip inline tooltip="Use current balance to calculate the discount.">
                  <VSwitch
                    color="primary"
                    inset
                    label="Use current balance"
                    hide-details
                    v-model="resources.useCurrentBalance"
                  />
                </input-tooltip>
              </VCol>
            </VRow>
          </VForm>

          <VDivider class="my-8" />
          <VRow v-if="valid && priceTask.error">
            <VCol cols="12">
              <VAlert type="error" :text="normalizeError(priceTask.error, 'Failed to calculate price.')" />
            </VCol>
          </VRow>

          <VRow class="text-center text-body-1 text-black" v-else-if="valid">
            <VCol lg="6" md="6" sm="12">
              <div
                class="rounded pa-4 discount border"
                :style="{
                  background: computePackageColor(priceTask.data?.dedicatedPackage.package),
                }"
              >
                <input-tooltip
                  justifyCenter
                  alignCenter
                  tooltip="Dedicated Node allow user to reserve an entire node then use it exclusively to deploy solutions."
                >
                  <p>
                    Cost of reserving a
                    <strong class="mr-1" v-text="'Dedicated Node'" />
                    <strong v-text="'Loading...'" v-if="priceTask.loading" />
                    <strong v-else v-text="dedicatedPriceUSD + ' USD/month, ' + dedicatedPriceTFT + ' TFT/month'" />
                  </p>
                </input-tooltip>
              </div>

              <section
                class="card mt-5"
                v-if="!priceTask.loading && priceTask.data?.dedicatedPackage.package !== 'gold'"
              >
                <p class="card-info pa-2">
                  <b>Too expensive?</b> can upgrade to <b>Gold package</b> to get discount up to 60% when you fund your
                  wallet with <b>{{ dedicatedUpgradePrice }}</b> TFT
                </p>
              </section>
            </VCol>
            <VCol lg="6" md="6" sm="12">
              <div
                class="rounded pa-4 discount border"
                :style="{
                  background: computePackageColor(priceTask.data?.sharedPackage.package),
                }"
              >
                <input-tooltip
                  justifyCenter
                  alignCenter
                  tooltip="Shared Nodes allow several users to host various workloads on a single node."
                >
                  <p>
                    Cost of reservation on a
                    <strong class="mr-1" v-text="'Shared Node'" />
                    <strong v-text="'Loading...'" v-if="priceTask.loading" />
                    <strong v-else v-text="sharedPriceUSD + ' USD/month, ' + sharedPriceTFT + ' TFT/month'" />
                  </p>
                </input-tooltip>
              </div>
              <section
                class="card mt-5 pa-2"
                v-if="!priceTask.loading && priceTask.data?.sharedPackage.package !== 'gold'"
              >
                <p class="card-info">
                  <b>Too expensive?</b> can upgrade to <b>Gold package</b> to get discount up to 60% when you fund your
                  wallet with <b>{{ sharedUpgradePrice }}</b> TFT
                </p>
              </section>
            </VCol>
          </VRow>

          <VRow v-else>
            <VCol cols="12">
              <VAlert type="error">
                Please provide a valid data in order to calculate your deployment price correctly.
              </VAlert>
            </VCol>
          </VRow>
        </VContainer>
      </VCardText>
    </VCard>
  </ViewLayout>
</template>

<script lang="ts">
import { QueryClient } from "@threefold/tfchain_client";
import { computed, ref, watch } from "vue";
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import type { VForm } from "vuetify/components/VForm";

import { manual } from "@/utils/manual";

import { calculator as Calculator } from "../../../grid_client/dist/es6";
import { useProfileManagerController } from "../components/profile_manager_controller.vue";
import { useAsync } from "../hooks";
import { useProfileManager } from "../stores";
import { normalizeError } from "../utils/helpers";
import { balanceRules, cruRules, hruRules, mruRules, nuRules, sruRules } from "../utils/pricing_calculator";
import { computePackageColor, normalizePrice } from "../utils/pricing_calculator";
export default {
  name: "PricingCalculator",
  setup() {
    const calculator = new Calculator(new QueryClient(window.env.SUBSTRATE_URL));
    const profileManager = useProfileManager();
    const userBalance = useProfileManagerController().balance;
    const valid = ref(true);
    const resources = ref({
      cru: "1",
      mru: "1",
      sru: "25",
      hru: "100",
      nu: "0",
      balance: "1",
      certified: false,
      ipv4: false,
      useCurrentBalance: true,
    });
    const dedicatedUpgradePrice = Math.ceil(114.473 * 18);
    const sharedUpgradePrice = Math.ceil(228.947 * 18);
    const tftPriceTask = useAsync(() => calculator.tftPrice(), {
      init: true,
      default: 0,
    });
    const priceTask = useAsync(
      () => {
        return calculator.calculate({
          cru: +resources.value.cru,
          mru: +resources.value.mru,
          hru: +resources.value.hru,
          sru: +resources.value.sru,
          ipv4u: resources.value.ipv4,
          certified: resources.value.certified,
          balance:
            userBalance.value && resources.value.useCurrentBalance ? userBalance.value.free : +resources.value.balance,
          nu: +resources.value.nu,
        });
      },
      {
        init: true,
        shouldRun: () => valid.value,
      },
    );

    watch(userBalance, () => {
      if (resources.value.useCurrentBalance) priceTask.value.run();
    });

    const dedicatedPriceUSD = computed(() => {
      const price = priceTask.value.data?.dedicatedPrice;
      if (price) {
        return normalizePrice(price);
      }
      return 0;
    });

    const dedicatedPriceTFT = computed(() => {
      const tftPrice = tftPriceTask.value.data;
      const dedicatedPrice = dedicatedPriceUSD.value;
      if (dedicatedPrice && tftPrice) {
        const price = dedicatedPrice / tftPrice;
        return normalizePrice(price);
      }
      return 0;
    });

    const sharedPriceUSD = computed(() => {
      const price = priceTask.value.data?.sharedPrice;
      if (price) {
        return normalizePrice(price);
      }
      return 0;
    });

    const sharedPriceTFT = computed(() => {
      const tftPrice = tftPriceTask.value.data;
      const sharedPrice = sharedPriceUSD.value;
      if (sharedPrice && tftPrice) {
        const price = sharedPrice / tftPrice;
        return normalizePrice(price);
      }
      return 0;
    });

    return {
      valid,
      cruRules,
      mruRules,
      sruRules,
      hruRules,
      nuRules,
      balanceRules,
      userBalance,
      resources,
      priceTask,
      dedicatedPriceUSD,
      dedicatedPriceTFT,
      sharedPriceUSD,
      sharedPriceTFT,
      computePackageColor,
      normalizeError,
      profileManager,
      manual,
      dedicatedUpgradePrice,
      sharedUpgradePrice,
    };
  },
};
</script>

<style scoped>
.discount p {
  padding: 10px 0;
}

.x_small {
  display: flex !important;
}
.card {
  background: white;
  border: 1px solid #ccc;
  border-radius: 5px;
}

@media (max-width: 600px) {
  .v-col {
    flex-basis: auto !important;
  }

  .x_small {
    display: block !important;
  }
}
</style>
