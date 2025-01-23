<template>
  <VDialog
    width="1024"
    class="mx-auto"
    :model-value="$props.modelValue"
    @update:model-value="handleProfileDialog($event)"
    attach="#modals"
    eager
  >
    <template #activator="{ props }">
      <VCard v-bind="props" class="pa-3 d-inline-flex align-center bg-transparent elevation-0">
        <div>
          <v-btn v-if="!profileManager.profile" variant="elevated"
            ><VProgressCircular v-if="activating" class="mr-2" indeterminate color="white" size="20" width="2" /><v-icon
              size="20"
              class="pr-2"
              >mdi-wallet-outline</v-icon
            >
            Connect your TFChain Wallet
          </v-btn>
          <p v-else-if="loadingBalance">
            <strong>Loading...</strong>
          </p>
          <template v-else-if="balance">
            <p>
              Balance:
              <strong :class="theme.name.value === AppThemeSelection.light ? 'text-primary' : 'text-info'">
                {{ normalizeBalance(balance.free + balance.reserved, true) }}
                TFT
              </strong>
            </p>
            <p>
              Locked:
              <strong :class="theme.name.value === AppThemeSelection.light ? 'text-primary' : 'text-info'">
                {{ normalizeBalance(balance.reserved, true) || 0 }} TFT
              </strong>
              <v-tooltip text="Locked balance documentation" location="bottom right">
                <template #activator="{ props }">
                  <v-btn
                    @click.stop
                    v-bind="props"
                    :color="theme.name.value === AppThemeSelection.light ? 'black' : 'white'"
                    icon="mdi-information-outline"
                    height="24px"
                    width="24px"
                    class="ml-2"
                    :href="manual.contract_locking"
                    target="_blank"
                  />
                </template>
              </v-tooltip>
            </p>
          </template>
        </div>
        <v-tooltip text="Logout" location="bottom" :disabled="!profileManager.profile">
          <template #activator="{ props }">
            <VBtn
              color="error"
              variant="tonal"
              @click.stop="logout"
              v-if="profileManager.profile"
              :disabled="loadingBalance"
              class="ml-2"
              v-bind="props"
              icon="mdi-logout"
            />
          </template>
        </v-tooltip>
      </VCard>
    </template>
    <v-card color="primary" class="d-flex justify-center items-center mt-3 pa-3 text-center">
      <v-card-title class="pa-0">TFChain Wallet</v-card-title>
    </v-card>
    <WebletLayout disable-alerts>
      <v-alert variant="tonal" class="mb-6">
        <p :style="{ maxWidth: '880px' }">
          Please visit
          <a class="app-link" :href="manual.tf_connect_wallet" target="_blank"> the manual </a>
          get started.
        </p>
      </v-alert>

      <DTabs
        v-if="!profileManager.profile"
        :tabs="getTabs()"
        v-model="activeTab"
        :disabled="loading"
        ref="tabsRef"
        destroy
      >
        <template #login> <Wallet_login @close-dialog="emit(`update:modelValue`, false)" /> </template>
        <template #register>
          <ConnectWallet @close-dialog="emit(`update:modelValue`, false)" @update:loading="loading = $event" />
        </template>
      </DTabs>

      <template v-if="profileManager.profile">
        <v-row>
          <v-col cols="12" md="6" lg="6" xl="6">
            <PasswordInputWrapper
              #="{ props }"
              v-if="profileManager.profile.mnemonic !== profileManager.profile.hexSeed"
            >
              <VTextField :label="'Your Mnemonic'" readonly v-model="profileManager.profile.mnemonic" v-bind="props" />
            </PasswordInputWrapper>
            <CopyInputWrapper :data="profileManager.profile.hexSeed" #="{ props }">
              <input-tooltip tooltip=" Please use this hex seed to import your wallet in Threefold Connect">
                <VTextField label="Your Hex Seed" readonly v-model="profileManager.profile.hexSeed" v-bind="props" />
              </input-tooltip>
            </CopyInputWrapper>

            <CopyInputWrapper :data="profileManager.profile.twinId.toString()" #="{ props }">
              <VTextField label="Twin ID" readonly v-model="profileManager.profile.twinId" v-bind="props" />
            </CopyInputWrapper>

            <CopyInputWrapper v-if="profileManager.profile.email" :data="profileManager.profile.email" #="{ props }">
              <VTextField label="Email" readonly v-model="profileManager.profile.email" v-bind="props" />
            </CopyInputWrapper>
            <CopyInputWrapper :data="profileManager.profile.address" #="{ props }">
              <VTextField label="Address" readonly v-model="profileManager.profile.address" v-bind="props" />
            </CopyInputWrapper>

            <CopyInputWrapper :data="freeBalance.toString()" #="{ props }">
              <VTextField label="Balance" readonly v-model="freeBalance" v-bind="props" />
            </CopyInputWrapper>
          </v-col>

          <v-col cols="12" md="6" lg="6" xl="6" class="d-flex justify-center align-center">
            <section class="qr d-flex flex-column align-center">
              <QRPlayStore
                :qr="'TFT:' + bridge + '?message=twin_' + profileManager.profile.twinId + '&sender=me&amount=100'"
              >
                <p>
                  Scan the QR code using
                  <a class="app-link" :href="manual.tf_connect_app" target="_blank">Threefold Connect</a> to fund your
                  account.
                </p>
              </QRPlayStore>
            </section>
          </v-col>
        </v-row>
      </template>
      <!-- <v-divider horizontal></v-divider> -->
      <div class="d-flex justify-end mt-4 mb-2">
        <VBtn v-if="profileManager.profile" color="anchor" @click="$emit('update:modelValue', false)"> Close </VBtn>
        <VBtn
          class="ml-2"
          color="error"
          @click="logout"
          variant="outlined"
          v-if="profileManager.profile"
          :disabled="loadingBalance"
        >
          Logout
        </VBtn>
      </div>
    </WebletLayout>
  </VDialog>
</template>
<script lang="ts" setup>
import { computed, onMounted, ref, watch } from "vue";
import { nextTick } from "vue";
import { useTheme } from "vuetify";

import router from "@/router";
import { AppThemeSelection } from "@/utils/app_theme";
import { createCustomToast, ToastType } from "@/utils/custom_toast";
import { manual } from "@/utils/manual";

import { useProfileManagerController } from "../components/profile_manager_controller.vue";
import { useOnline } from "../hooks";
import { useProfileManager } from "../stores";
import { isStoredCredentials } from "../utils/credentials";
import { getGrid, loadBalance } from "../utils/grid";
import { normalizeBalance } from "../utils/helpers";
const loading = ref(false);
const items = ref([{ id: 1, name: "stellar" }]);
const depositWallet = ref("");
const selectedName = ref("");
const selectedItem = ref(items.value[0]);
const depositFee = ref(0);

const theme = useTheme();
const qrCodeText = ref("");
const props = defineProps({
  modelValue: {
    required: false,
    default: () => true,
    type: Boolean,
  },
});

const emit = defineEmits<{ (event: "update:modelValue", value: boolean): void }>();
const bridge = (window as any).env.BRIDGE_TFT_ADDRESS;

const online = useOnline();
const activeTab = ref(0);
watch(
  () => [online.value, props.modelValue],
  ([online, modelValue], [wasOnline, _]) => {
    if (!wasOnline && online) {
      handleModelValue(true);
    }

    handleModelValue(online && modelValue);
  },
);
function handleModelValue(m: boolean) {
  if (m) {
    nextTick().then(mounted);
  }
}

async function mounted() {
  selectedName.value = items.value.filter(item => item.id === selectedItem.value.id)[0].name;
  depositWallet.value = window.env.BRIDGE_TFT_ADDRESS;
  qrCodeText.value = `TFT:${depositWallet.value}?message=twin_${profileManager.profile?.twinId}&sender=me`;
  try {
    const grid = await getGrid(profileManager.profile!);
    if (grid) {
      const DepositFee = await grid.bridge.getDepositFee();
      depositFee.value = DepositFee;
      return;
    }
  } catch (e) {
    console.log(e);
  }
}

const loginTab = { title: "Login", value: "login" };
const registerTab = { title: "Register", value: "register" };
function getTabs() {
  if (isStoredCredentials()) {
    return [loginTab, registerTab];
  }
  return [registerTab];
}

const profileManager = useProfileManager();

const profileManagerController = useProfileManagerController();

const balance = profileManagerController.balance;
const freeBalance = computed(() => balance.value?.free ?? 0);
const kyc = useKYC();
let interval: any;
watch(
  () => profileManager.profile,
  profile => {
    if (profile) {
      __loadBalance(profile);
      if (interval) clearInterval(interval);
      interval = setInterval(__loadBalance.bind(undefined, profile), 1000 * 60 * 2);
      kyc.init(profile, window.env.KYC_URL);
    } else {
      kyc.clear();
      if (interval) clearInterval(interval);
      balance.value = undefined;
    }
  },
  { immediate: true, deep: true },
);

function logout() {
  sessionStorage.removeItem("password");
  profileManager.clear();
  kyc.clear();
  if (router.currentRoute.value.path.includes("/overview")) {
    router.push("/");
  }
}

onMounted(async () => {
  await mounted();
});

async function handleProfileDialog(value: boolean) {
  emit("update:modelValue", value);
  if (profileManager?.profile && value) __loadBalance(profileManager.profile);
}

let BalanceWarningRaised = false;
const loadingBalance = ref(false);
async function __loadBalance(profile?: Profile, tries = 1) {
  profile = profile || profileManager.profile!;
  if (!profile) return;

  try {
    loadingBalance.value = true;
    const grid = await getGrid(profile);
    balance.value = await loadBalance(grid!);
    if (!BalanceWarningRaised && balance.value?.free) {
      if (balance.value?.free < 0.01) {
        createCustomToast("Your balance is too low, Please fund your account.", ToastType.warning);
        BalanceWarningRaised = true;
      }
    }
    loadingBalance.value = false;
  } catch {
    if (tries > 10) {
      loadingBalance.value = false;
      return;
    }

    setTimeout(() => __loadBalance(profile, tries + 1), Math.floor(Math.exp(tries) * 1_000));
  }
}
profileManagerController.set({ loadBalance: __loadBalance });
</script>

<script lang="ts">
import Wallet_login from "@/components/profile_manager/wallet_login.vue";
import QRPlayStore from "@/components/qr_play_store.vue";
import { useKYC } from "@/stores/kyc";

import ConnectWallet from "../components/profile_manager/Connect_wallet.vue";
import type { Profile } from "../stores/profile_manager";
export default {
  name: "ProfileManager",
  components: {
    QRPlayStore,
    ConnectWallet,
  },
};
</script>
<style>
.v-field__input {
  font-size: small;
}

.qr {
  border-left: 1px solid #3a3b3c;
}

@media only screen and (max-width: 1400px) {
  .app-btn {
    width: 8rem !important;
  }
}

@media only screen and (max-width: 960px) {
  .qr {
    border-left: none;
  }
}

@media only screen and (max-width: 600px) {
  html,
  .v-btn {
    font-size: 0.875rem !important;
  }
}
.info-legal-image {
  width: 100%;
  box-shadow: 0px 0px 5px 0px #ffffff75;
  border-radius: 5px;
  margin-bottom: 30px;
}
.terms-footer {
  padding: 30px;
  display: flex;
  justify-content: center;
  background: #2f4f4f2e;
  margin-left: 15px;
  margin-right: 15px;
  border-radius: 4px;
  margin-bottom: 15px;
  border: 1px solid #00000029;
}

.terms-footer button {
  padding: 13px !important;
  height: auto !important;
  border-radius: 6px;
}
</style>
