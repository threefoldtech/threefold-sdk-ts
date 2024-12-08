<template>
  <view-layout>
    <v-card color="primary" class="d-flex justify-center items-center mb-4 pa-3 text-center">
      <v-icon size="30" class="pr-3">mdi-file-document-edit</v-icon>
      <v-card-title class="pa-0">TF Minting Reports</v-card-title>
    </v-card>
    <v-alert class="mb-4 text-subtitle-2 font-weight-regular" type="info" variant="tonal">
      For more information about minting check
      <a class="app-link font-weight-medium" target="_blank" :href="manual.minting_process">TFT minting process. </a>
      <br />
      The user can verify the 3Nodes' payments on Stellar Blockchain through the Threefold's
      <a class="app-link font-weight-medium" target="_blank" :href="manual.minting_reports">minting tool. </a>
      <br />
      TFT minting address on Stellar Chain:
      <a
        class="app-link font-weight-medium"
        target="_blank"
        href="https://stellar.expert/explorer/public/account/GBOVQKJYHXRR3DX6NOX2RRYFRCUMSADGDESTDNBDS6CDVLGVESRTAC47"
        >GBOVQKJYHXRR3DX6NOX2RRYFRCUMSADGDESTDNBDS6CDVLGVESRTAC47.</a
      >
      <br />
    </v-alert>
    <v-form class="d-inline-flex w-100">
      <FormValidator v-model="isValidForm">
        <InputValidator
          :value="receiptHash"
          :rules="[
            validators.required('Receipt hash is required.'),
            validators.equal('Receipt hash must be 64 characters long.', 64),
            validators.isHash('Invalid hash', 'sha256'),
          ]"
          :asyncRules="[mintingHash()]"
          #="{ props: validationProps }"
          ref="hashInput"
        >
          <VTextField
            class="mr-5"
            placeholder="Please insert your receipt hash"
            v-model="receiptHash"
            v-bind="{ ...validationProps }"
            :loading="loading"
            @update:modelValue="reset"
        /></InputValidator>
      </FormValidator>
    </v-form>
    <v-container class="mt-8" v-if="item && item.Minting">
      <VAlert type="info" class="mb-10">
        For more information about Minting Receipts check,
        <a class="app-link" target="_blank" :href="manual.minting_receipts" v-text="'Minting Receipts'" />
      </VAlert>
      <v-card>
        <v-card-title class="font-weight-bold bg-primary">Node Info</v-card-title>
        <v-list class="custom-list">
          <v-row>
            <v-col cols="2" class="column-style">
              <v-list-item v-for="header in mintNodeInfoHeaders" :key="header">
                {{ header }}
              </v-list-item>
            </v-col>
            <v-col cols="10">
              <v-list-item> {{ item.Minting.node_id }} ({{ item.Minting.node_type }})</v-list-item>
              <v-list-item> {{ item.Minting.farm_name }} ({{ item.Minting.farm_id }})</v-list-item>
              <v-list-item>
                {{ (item.Minting.measured_uptime / (3600 * 24)).toFixed(2) }}
                days ({{
                  (
                    (100 * item.Minting.measured_uptime) /
                    (item.Minting.period.end - item.Minting.period.start)
                  ).toFixed(2)
                }}%)
              </v-list-item>
            </v-col>
          </v-row>
        </v-list>
      </v-card>
      <!-- Node Resources -->
      <v-card class="mt-3">
        <v-card-title class="font-weight-bold bg-primary" color="primary">Node Resources</v-card-title>
        <v-list class="custom-list">
          <v-row>
            <v-col cols="2" class="column-style">
              <v-list-item v-for="header in mintResourcesHeaders" :key="header">
                {{ header }}
              </v-list-item>
            </v-col>
            <v-col cols="10">
              <v-list-item> {{ item.Minting.cloud_units.cu.toFixed(2) }}</v-list-item>
              <v-list-item> {{ item.Minting.cloud_units.su.toFixed(2) }}</v-list-item>
              <v-list-item>
                {{ item.Minting.cloud_units.nu.toFixed(2) }}
              </v-list-item>
              <v-list-item v-if="item.Minting.resource_units.cru && item.Minting.resource_units.cru < 0.1">
                {{ (item.Minting.resource_units.cru * 1024 ** 3).toFixed(0) }}
                vCPU
              </v-list-item>
              <v-list-item v-else> {{ item.Minting.resource_units.cru }} vCPU </v-list-item>

              <v-list-item> {{ item.Minting.resource_units.mru.toFixed(3) }} GB </v-list-item>
              <v-list-item> {{ item.Minting.resource_units.sru.toFixed(3) }} GB </v-list-item>
              <v-list-item> {{ item.Minting.resource_units.hru.toFixed(3) }} GB </v-list-item>
            </v-col>
          </v-row>
        </v-list>
      </v-card>

      <v-card class="mt-3">
        <v-card-title class="font-weight-bold bg-primary">Payout Info</v-card-title>
        <v-list class="custom-list">
          <v-row>
            <v-col cols="2" class="column-style">
              <v-list-item v-for="header in mintPayoutHeaders" :key="header">
                {{ header }}
              </v-list-item>
            </v-col>
            <v-col cols="10">
              <v-list-item>
                <input-tooltip
                  inline
                  :alignCenter="true"
                  :tooltip="`1 TFT = ${(item.Minting.tft_connection_price / 1e3).toFixed(3)}$`"
                >
                  Farmed {{ (item.Minting.reward.tft / 1e7).toFixed(3) }} TFT that's almost =
                  {{ (item.Minting.reward.musd / 1e3).toFixed(3) }}$
                </input-tooltip>
              </v-list-item>
              <v-list-item> {{ item.Minting.stellar_payout_address }}</v-list-item>
            </v-col>
          </v-row>
        </v-list>
      </v-card>
    </v-container>

    <v-container class="mt-8" v-else-if="item">
      <v-card>
        <v-card-title class="font-weight-bold bg-primary">Node Info</v-card-title>
        <v-list class="custom-list">
          <v-row>
            <v-col cols="2" class="column-style">
              <v-list-item v-for="header in fixupNodeInfoHeaders" :key="header">
                {{ header }}
              </v-list-item>
            </v-col>
            <v-col cols="10">
              <v-list-item> {{ item.Fixup.node_id }}</v-list-item>
              <v-list-item> {{ item.Fixup.farm_id }}</v-list-item>
            </v-col>
          </v-row>
        </v-list>
      </v-card>

      <v-card class="mt-3">
        <v-card-title class="font-weight-bold bg-primary" color="primary">Node Resources</v-card-title>
        <v-list class="custom-list">
          <v-row>
            <v-col cols="2" class="column-style">
              <v-list-item v-for="header in fixupResourcesHeaders" :key="header">
                {{ header }}
              </v-list-item>
            </v-col>
            <v-col cols="10">
              <v-list-item>
                {{ item.Fixup.minted_cloud_units.cu.toFixed(2) }} | {{ item.Fixup.correct_cloud_units.cu.toFixed(2) }} |
                {{ item.Fixup.fixup_cloud_units.cu.toFixed(2) }}</v-list-item
              >
              <v-list-item>
                {{ item.Fixup.minted_cloud_units.su.toFixed(2) }} | {{ item.Fixup.correct_cloud_units.su.toFixed(2) }} |
                {{ item.Fixup.fixup_cloud_units.cu.toFixed(2) }}</v-list-item
              >
              <v-list-item>
                {{ item.Fixup.minted_cloud_units.nu.toFixed(2) }} | {{ item.Fixup.correct_cloud_units.nu.toFixed(2) }} |
                {{ item.Fixup.fixup_cloud_units.cu.toFixed(2) }}</v-list-item
              >
            </v-col>
          </v-row>
        </v-list>
      </v-card>
      <v-card class="mt-3">
        <v-card-title class="font-weight-bold bg-primary">Payout Info</v-card-title>
        <v-list class="custom-list">
          <v-row>
            <v-col cols="2" class="column-style">
              <v-list-item v-for="header in fixupPayoutHeaders" :key="header">
                {{ header }}
              </v-list-item>
            </v-col>
            <v-col cols="10">
              <v-list-item> {{ item.Fixup.minted_reward.tft.toFixed(7) }} TFT</v-list-item>
              <v-list-item> {{ item.Fixup.correct_reward.tft.toFixed(7) }} TFT</v-list-item>
              <v-list-item> {{ item.Fixup.fixup_reward.tft.toFixed(7) }} TFT</v-list-item>
              <v-list-item> {{ item.Fixup.stellar_payout_address }}</v-list-item>
            </v-col>
          </v-row>
        </v-list>
      </v-card>
    </v-container>
  </view-layout>
</template>

<script lang="ts" setup>
import { ref } from "vue";

import type { AsyncRule, RuleReturn } from "@/components/input_validator.vue";
import { useInputRef } from "@/hooks/input_validator";
import { manual } from "@/utils/manual";

import { getMintingData } from "../utils/mintings";

const receiptHash = ref();
const isValidForm = ref(false);
const hashInput = useInputRef();
const loading = ref(false);
const item = ref();
const mintNodeInfoHeaders = ["ID", "Farm", "Measured Uptime"];
const fixupNodeInfoHeaders = ["ID", "Farm"];
const mintResourcesHeaders = ["CU", "SU", "NU", "CRU", "MRU", "SRU", "HRU"];
const fixupResourcesHeaders = ["CU", "SU", "NU"];
const mintPayoutHeaders = ["TFT Farmed", "Payout Address"];
const fixupPayoutHeaders = ["TFT Received", "TFT Owed", "Additional TFT Minted", "Payout Address"];

function reset() {
  item.value = null;
}
function mintingHash(): AsyncRule {
  const asyncValidator: AsyncRule = async (): Promise<RuleReturn> => {
    loading.value = true;
    reset();
    try {
      item.value = await getMintingData(receiptHash.value);
      return { message: "" };
    } catch (e) {
      return { message: "Receipt not found." };
    } finally {
      loading.value = false;
    }
  };

  return asyncValidator;
}
</script>

<style scoped>
.custom-list {
  overflow: hidden;
  font-size: 0.875rem;
}

.v-list-item {
  border-bottom: 0.1px solid #8a8a8a;
}
.column-style {
  border-right: 0.1px solid #8a8a8a;
}
.v-list-item:last-child {
  border-bottom: none;
}
</style>
