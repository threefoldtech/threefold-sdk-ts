<template>
  <div>
    <KycVerifier
      v-if="kycDialog"
      :loading="kycDialogLoading"
      @update:loading="kycDialogLoading = $event"
      :moduleValue="kycDialog"
      @update:moduleValue="kycDialog = $event"
    />
    <v-container v-if="editingTwin">
      <v-dialog v-model="editingTwin" max-width="600" attach="#modals">
        <v-card>
          <v-toolbar color="primary" dark class="custom-toolbar">Edit Twin</v-toolbar>
          <div class="text-h2 pa-10">
            <v-text-field v-model="relay" outlined label="Relay" :error-messages="errorMsg"></v-text-field>
          </div>
          <v-card-actions class="justify-end mb-1 mr-2">
            <v-btn @click="editingTwin = false" color="anchor">Close</v-btn>
            <v-btn @click="UpdateRelay">Save</v-btn>
          </v-card-actions>
        </v-card>
      </v-dialog>
    </v-container>

    <v-dialog v-model="openVotePopup" max-width="600" attach="#modals">
      <v-card>
        <v-toolbar color="primary" dark class="custom-toolbar bold-text">Vote Reminder</v-toolbar>
        <v-card-text>There are {{ numberOfProposalsToVoteOn }} active proposals you can vote on now</v-card-text>
        <v-card-actions class="justify-end mb-1 mr-2">
          <v-btn @click="redirectToDao" variant="elevated">Vote</v-btn>
          <v-btn @click="openVotePopup = false" color="anchor">Close</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
    <div class="border px-4 pb-4 rounded position-relative">
      <v-card color="primary" class="d-flex justify-center items-center mt-3 pa-3 text-center">
        <v-icon size="30" class="pr-3">mdi-account-supervisor-outline</v-icon>
        <v-card-title class="pa-0">Twin Details</v-card-title>
      </v-card>

      <v-card>
        <v-row>
          <v-col lg="8" md="12" sm="12" class="my-4">
            <v-list class="custom-list" density="compact">
              <v-row class="row-style">
                <v-col cols="3" class="px-0">
                  <v-list-item class="px-0"> ID :</v-list-item>
                </v-col>
                <v-col cols="9" class="px-0">
                  <v-list-item class="px-0">
                    <div style="display: flex; justify-content: space-between">
                      {{ profileManager.profile?.twinId.toString() }}
                      <input-tooltip
                        tooltip="Your unique identifier for your twin on the ThreeFold chain."
                        :align-center="true"
                        :class="'d-flex align-center'"
                        location="right center"
                      />
                    </div>
                  </v-list-item>
                </v-col>
              </v-row>
              <v-row class="row-style">
                <v-col cols="3" class="px-0">
                  <v-list-item class="px-0"> E-mail :</v-list-item>
                </v-col>
                <v-col cols="9" class="px-0">
                  <v-list-item class="px-0" v-if="!editEmail">
                    <div class="edit_pen" style="display: flex; justify-content: space-between">
                      {{ profileManager.profile?.email }}
                      <v-icon @click="editEmail = true">mdi-pencil</v-icon>
                    </div>
                  </v-list-item>

                  <v-list-item v-if="editEmail">
                    <v-form
                      @submit.prevent="saveEmail"
                      style="display: flex; justify-content: space-between"
                      v-model="isValid"
                    >
                      <input-validator
                        :value="email"
                        :rules="[
                          validators.required('Email is required.'),
                          validators.isEmail('Please provide a valid email address.'),
                        ]"
                        #="{ props }"
                      >
                        <v-text-field
                          class="mr-2"
                          placeholder="email@example.com"
                          v-model="email"
                          v-bind="props"
                          :loading="loading"
                          autofocus
                        />
                      </input-validator>
                      <v-btn
                        type="submit"
                        icon="mdi-content-save-all"
                        class="mt-2"
                        color="anchor"
                        variant="text"
                        :disabled="!isValid || savingEmail"
                      >
                      </v-btn>
                      <v-btn icon="mdi-close" class="mt-2" color="anchor" variant="text" @click="editEmail = false">
                      </v-btn>
                    </v-form>
                  </v-list-item>
                </v-col>
              </v-row>
              <v-row class="row-style">
                <v-col cols="3" class="px-0">
                  <v-list-item class="px-0"> Address : </v-list-item>
                </v-col>
                <v-col cols="9" class="px-0">
                  <v-list-item class="px-0">
                    <div style="display: flex; justify-content: space-between; align-items: center">
                      <div class="pr-2" style="overflow: hidden; word-wrap: normal">
                        <span class="mr-2">{{ profileManager.profile?.address }}</span>
                        <v-icon @click="copy(profileManager.profile?.address as string)"> mdi-content-copy </v-icon>
                      </div>

                      <input-tooltip
                        tooltip="Your public address on the ThreeFold chain."
                        :align-center="true"
                        :class="'d-flex align-center'"
                        location="right center"
                      />
                    </div>
                  </v-list-item>
                </v-col>
              </v-row>
              <v-row class="row-style">
                <v-col cols="3" class="px-0"> <v-list-item class="px-0"> Relay : </v-list-item></v-col>
                <v-col cols="9" class="px-0">
                  <v-list-item class="px-0">
                    <div style="display: flex; justify-content: space-between; align-items: center">
                      {{ profileManager.profile?.relay }}
                      <input-tooltip
                        tooltip="A relay is a component that facilitates the reliable and secure transfer of messages between different entities within the ThreeFold ecosystem."
                        :align-center="true"
                        :class="'d-flex align-center'"
                        location="end"
                      />
                    </div> </v-list-item
                ></v-col>
              </v-row>
              <v-row class="row-style">
                <v-col cols="3" class="px-0"> <v-list-item class="px-0"> KYC : </v-list-item></v-col>
                <v-col cols="9" class="px-0">
                  <v-list-item class="px-0">
                    <div style="display: flex; justify-content: space-between; align-items: center">
                      <div v-if="kyc.status == KycStatus.verified">
                        <v-chip prepend-icon="mdi-shield-check">Verified</v-chip>
                      </div>
                      <div v-else>
                        <v-btn
                          :disabled="insufficientBalance"
                          text="Verify now"
                          size="small"
                          color="warning"
                          @click="kycDialog = true"
                          :loading="kycDialogLoading"
                        >
                          <template #prepend>
                            <v-icon>mdi-shield-plus</v-icon>
                          </template>
                        </v-btn>
                        <p v-if="balance && insufficientBalance" class="mt-1 text-caption text-red">
                          You need to have at least 100 TFT
                        </p>
                      </div>
                      <input-tooltip
                        tooltip="A verification process to confirm your identity and ensure compliance with regulations."
                        :align-center="true"
                        :class="'d-flex align-center'"
                        location="end"
                      />
                    </div> </v-list-item
                ></v-col>
              </v-row>
            </v-list>
          </v-col>

          <v-divider vertical aria-colspan="1"></v-divider>
          <v-col lg="4" md="12" sm="12" class="my-4" v-if="profileManager.profile">
            <QRPlayStore
              :qr="'TFT:' + bridge + '?message=twin_' + profileManager.profile.twinId + '&sender=me&amount=100'"
            >
              <p>
                Scan the QR code using
                <a class="app-link" :href="manual.tf_connect_app" target="_blank">Threefold Connect</a> to fund your
                account.
              </p></QRPlayStore
            >
          </v-col>
        </v-row>
        <v-card-actions v-if="updateRelay" class="justify-end mb-1 mr-2">
          <v-btn variant="elevated" class="custom-button" @click="editTwin">Edit</v-btn>
        </v-card-actions>
      </v-card>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { KycStatus } from "@threefold/grid_client";
import { generatePublicKey } from "@threefold/rmb_direct_client";
import { computed, onMounted, ref } from "vue";

import { manual } from "@/utils/manual";

import router from "../router";
import { useGrid, useProfileManager } from "../stores";
import type { FarmInterface } from "../types";
import { createCustomToast, ToastType } from "../utils/custom_toast";
import { getFarms } from "../utils/get_farms";
import { type Balance, loadBalance, storeEmail } from "../utils/grid";
const profileManager = useProfileManager();
const kyc = useKYC();
const editingTwin = ref(false);
const relay = ref(profileManager.profile?.relay || "");
const updateRelay = ref(false);
const errorMsg = ref("");
const openVotePopup = ref(false);
const numberOfProposalsToVoteOn = ref(0);
const userFarms = ref<FarmInterface[]>();
const activeProposalsUserHasVotedOn = ref(0);
const bridge = (window as any).env.BRIDGE_TFT_ADDRESS;
const email = ref(profileManager.profile?.email || "");
const loading = ref<boolean>(false);
const editEmail = ref<boolean>(false);
const isValid = ref<boolean>(false);
const savingEmail = ref<boolean>(false);
const gridStore = useGrid();
const grid = gridStore.client as GridClient;
const kycDialog = ref(false);
const kycDialogLoading = ref(false);
const profileManagerController = useProfileManagerController();
const balance = profileManagerController.balance;
const insufficientBalance = computed(() => balance.value?.free == undefined || balance.value?.free < 100);

onMounted(async () => {
  const profile = profileManager.profile!;
  if (!grid) {
    createCustomToast("Fetch Grid Failed", ToastType.danger);

    return;
  }
  userFarms.value = await getFarms(grid, { ownedBy: profile.twinId }, {});
  if (!userFarms.value.length) {
    return;
  }
  const proposals = grid.dao.get();
  const userFarmId = userFarms.value.map(farm => farm.farmID);

  const activeProposals = (await proposals)?.active;
  const numberOfActiveProposals = activeProposals ? activeProposals.length : 0;

  if (!numberOfActiveProposals) {
    return;
  }
  activeProposals.forEach(proposal => {
    if (proposal.nayes.filter(naye => userFarmId.includes(naye.farmId)).length) {
      activeProposalsUserHasVotedOn.value++;
    } else if (proposal.ayes.filter(aye => userFarmId.includes(aye.farmId)).length) {
      activeProposalsUserHasVotedOn.value++;
    }
  });

  if (activeProposalsUserHasVotedOn.value == numberOfActiveProposals) {
    return;
  }
  numberOfProposalsToVoteOn.value = numberOfActiveProposals - activeProposalsUserHasVotedOn.value;
  openVotePopup.value = true;
});

function redirectToDao() {
  router.push({ path: "/tf-chain/dao" });
}

async function saveEmail() {
  try {
    const balance: Balance = await loadBalance(grid!);
    if (balance.free < 1) {
      editEmail.value = false;
      createCustomToast(
        "Transaction Error: Unable to Process Payment - Insufficient Account Balance.",
        ToastType.danger,
      );
    } else {
      loading.value = true;
      savingEmail.value = true;
      profileManager.updateEmail(email.value);
      await storeEmail(grid!, email.value);
      editEmail.value = false;
      loading.value = false;
      savingEmail.value = false;
    }
  } catch (e) {
    console.log(e);
  }
}
onMounted(validateEdit);
async function validateEdit() {
  try {
    const pk = await generatePublicKey(profileManager.profile!.mnemonic);
    if (profileManager.profile?.relay !== window.env.RELAY_DOMAIN.replace("wss://", "")) {
      updateRelay.value = true;
    }

    if (profileManager.profile?.pk !== pk) {
      UpdateRelay();
    }
  } catch (e) {
    console.log(e);
  }
}

function editTwin() {
  console.log("editing twin");
  editingTwin.value = true;
}

async function UpdateRelay() {
  try {
    const pk = await generatePublicKey(profileManager.profile!.mnemonic);
    await grid?.twins.update({ relay: relay.value });
    profileManager.updateRelay(relay.value);
    profileManager.updatePk(pk);
    updateRelay.value = false;
  } catch (e) {
    errorMsg.value = (e as any).message;
    console.log("could not update relay or pk, Error: ", e);
  }
}

function copy(id: string) {
  navigator.clipboard.writeText(id);
  createCustomToast("Address copied to clipboard", ToastType.success);
}
</script>
<script lang="ts">
import type { GridClient } from "@threefold/grid_client";

import KycVerifier from "@/components/KycVerifier.vue";
import { useProfileManagerController } from "@/components/profile_manager_controller.vue";
import { useKYC } from "@/stores/kyc";

import QRPlayStore from "../components/qr_play_store.vue";

export default {
  name: "TwinView",
  components: {
    QRPlayStore,
    KycVerifier,
  },
};
</script>

<style scoped>
.custom-container {
  width: 80%;
}

.custom-list {
  overflow: hidden;
  font-size: 1rem;
  padding: 10px;
}

.row-style {
  border-bottom: 0.1px solid #8a8a8a;
  margin-left: 6px;
  margin-right: 6px;
}

.custom-toolbar {
  font-size: 16px;
  font-weight: bold;
  padding-left: 10px;
}

.bold-text {
  font-weight: 500;
  padding-left: 1rem;
}

@media (max-width: 425px) {
  .v-col {
    flex-basis: auto !important;
  }
}

@media (max-width: 375px) {
  .custom-list {
    font-size: 13px !important;
  }
}

@media (max-width: 320px) {
  .custom-list {
    font-size: 13px !important;
  }

  .edit_pen {
    display: inline-block !important;
  }
}
</style>
