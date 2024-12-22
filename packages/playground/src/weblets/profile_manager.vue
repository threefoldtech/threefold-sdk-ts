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
      <VCard v-bind="props" class="pa-3 d-inline-flex align-center">
        <VProgressCircular v-if="activating" class="mr-2" indeterminate color="primary" size="25" width="2" />
        <VIcon icon="mdi-account" size="x-large" class="mr-2" v-else />
        <div>
          <p v-if="!profileManager.profile">
            <strong>Connect your TFChain Wallet</strong>
          </p>
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
        :disabled="creatingAccount || activatingAccount || activating"
        ref="tabsRef"
        @tab:change="
          () => {
            clearError();
            clearFields();
          }
        "
        destroy
      >
        <VContainer>
          <form @submit.prevent="activeTab === 0 ? login() : storeAndLogin()">
            <FormValidator v-model="isValidForm">
              <v-alert type="warning" variant="tonal" class="mb-6" v-if="activeTab === 1">
                <p :style="{ maxWidth: '880px' }">
                  To connect your wallet, you will need to enter your Mnemonic or Hex Seed which will be encrypted using
                  the password. Mnemonic or Hex Seed will never be shared outside of this device.
                </p>
              </v-alert>

              <v-alert
                variant="tonal"
                type="info"
                class="mb-6"
                v-if="keypairType === KeypairType.ed25519 && activeTab == 1"
              >
                <p>
                  Please note that generation or activation of ed25519 Keys isn't supported, you can only import pre
                  existing ones.
                </p>
              </v-alert>

              <VTooltip
                v-if="activeTab === 1"
                text="Mnemonic or Hex Seed are your private key. They are used to represent you on the ThreeFold Grid. You can paste existing (Mnemonic or Hex Seed) or click the 'Create Account' button to create an account and generate mnemonic."
                location="bottom"
                max-width="700px"
              >
                <!-- Mnemonic Input -->
                <template #activator="{ props: tooltipProps }">
                  <PasswordInputWrapper #="{ props: passwordInputProps }">
                    <InputValidator
                      :value="mnemonic"
                      :rules="[
                        validators.required('Mnemonic or Hex Seed is required.'),
                        v => {
                          clearError();
                          if (
                            validateMnemonic(v) ||
                            ((v.length === 64 || v.length === 66) && isAddress(v.length === 66 ? v : `0x${v}`))
                          ) {
                            getEmail();
                            return;
                          }
                          email = '';
                          return {
                            message: 'Mnemonic or Hex Seed doesn\'t seem to be valid.',
                          };
                        },
                      ]"
                      valid-message="Mnemonic or Hex Seed is valid."
                      #="{ props: validationProps }"
                      ref="mnemonicInput"
                    >
                      <v-row>
                        <v-col cols="12" md="9">
                          <div v-bind="tooltipProps">
                            <VTextField
                              :append-icon="!enableReload && !activatingAccount && mnemonic !== '' ? 'mdi-reload' : ''"
                              label="Mnemonic or Hex Seed"
                              placeholder="Please insert your Mnemonic or Hex Seed"
                              v-model="mnemonic"
                              v-bind="{
                                ...passwordInputProps,
                                ...validationProps,
                              }"
                              :disabled="creatingAccount || activatingAccount || activating"
                              @click:append="reloadValidation"
                              readonly
                              ref="mnemonicRef"
                              @focus="handleFocus(mnemonicRef)"
                            >
                              <template v-slot:prepend-inner v-if="validationProps.hint || validationProps.error">
                                <v-icon :color="validationProps.error ? 'red' : 'green'">
                                  {{ validationProps.error ? "mdi-close" : "mdi-check" }}
                                </v-icon>
                              </template></VTextField
                            >
                          </div>
                        </v-col>
                        <v-col cols="12" md="3">
                          <v-tooltip
                            location="top"
                            text="Using different keypair types will lead to a completely different account."
                          >
                            <template #activator="{ props }">
                              <v-autocomplete
                                label="Keypair Type"
                                v-bind="props"
                                :items="[...keyType]"
                                item-title="name"
                                v-model="keypairType"
                                v-if="activeTab === 1"
                              />
                            </template>
                          </v-tooltip>
                        </v-col>
                      </v-row>

                      <div class="d-flex flex-column flex-md-row justify-end mb-10">
                        <VBtn
                          class="mt-2 ml-sm-0 ml-md-3"
                          color="secondary"
                          variant="outlined"
                          :disabled="
                            isValidForm || !!mnemonic || shouldActivateAccount || keypairType === KeypairType.ed25519
                          "
                          :loading="creatingAccount"
                          @click="openAcceptTerms = termsLoading = true"
                        >
                          create account
                        </VBtn>
                      </div>
                    </InputValidator>
                  </PasswordInputWrapper>
                </template>
              </VTooltip>

              <v-dialog v-model="openAcceptTerms" fullscreen width="100%" attach="#modals">
                <v-card v-if="!termsLoading">
                  <v-card-text class="pa-15" v-html="acceptTermsContent"></v-card-text>
                  <div class="terms-footer">
                    <v-btn
                      class="mr-2"
                      @click="openAcceptTerms = termsLoading = false"
                      v-show="!termsLoading"
                      :color="theme.name.value === AppThemeSelection.light ? 'black' : 'white'"
                      :text="capitalize('go back')"
                    />
                    <v-btn
                      @click="shouldActivateAccount ? activateAccount() : createNewAccount()"
                      v-show="!termsLoading"
                      :text="capitalize('accept terms and conditions')"
                    />
                  </div>
                </v-card>
                <v-card v-else :style="{ height: '100%' }">
                  <v-card-text class="d-flex justify-center align-center" :style="{ height: '100%' }">
                    <v-progress-circular indeterminate />
                  </v-card-text>
                </v-card>
              </v-dialog>

              <!-- Alerts -->
              <v-alert
                type="error"
                variant="tonal"
                class="mb-4"
                v-if="(createAccountError || activatingAccountError) && activeTab === 1"
              >
                {{ createAccountError || activatingAccountError }}
              </v-alert>

              <v-alert type="info" variant="tonal" class="mb-6" v-if="activeTab === 0">
                <p :style="{ maxWidth: '880px' }">
                  You will need to provide the password used while connecting your wallet.
                </p>
              </v-alert>

              <!-- Email -->
              <input-validator
                v-if="activeTab === 1"
                :value="email"
                :rules="[
                  validators.required('Email is required.'),
                  validators.isEmail('Please provide a valid email address.'),
                ]"
                #="{ props }"
              >
                <v-text-field
                  label="Email"
                  placeholder="email@example.com"
                  v-model="email"
                  v-bind="props"
                  :loading="loadEmail"
                  :disabled="creatingAccount || activatingAccount || activating || loadEmail"
                  readonly
                  ref="emailRef"
                  @focus="handleFocus(emailRef)"
                />
              </input-validator>

              <!-- Password Input -->
              <PasswordInputWrapper #="{ props: passwordInputProps }">
                <InputValidator
                  :value="password"
                  :rules="[
                    validators.required('Password is required.'),
                    validators.minLength('Password must be at least 6 characters.', 6),
                    validatePassword,
                  ]"
                  #="{ props: validationProps }"
                  ref="passwordInput"
                >
                  <v-tooltip
                    location="top right"
                    text="Used to encrypt your mnemonic on your local system, and is used to login from the same device."
                  >
                    <template #activator="{ props: tooltipProps }">
                      <div v-bind="tooltipProps">
                        <VTextField
                          label="Password"
                          v-model="password"
                          v-bind="{ ...passwordInputProps, ...validationProps }"
                          :disabled="creatingAccount || activatingAccount || activating"
                          autocomplete="off"
                        />
                      </div>
                    </template>
                  </v-tooltip>
                </InputValidator>
              </PasswordInputWrapper>

              <PasswordInputWrapper #="{ props: confirmPasswordInputProps }" v-if="activeTab === 1">
                <InputValidator
                  :value="confirmPassword"
                  :rules="[validators.required('A confirmation password is required.'), validateConfirmPassword]"
                  #="{ props: validationProps }"
                  ref="confirmPasswordInput"
                >
                  <VTextField
                    label="Confirm Password"
                    v-model="confirmPassword"
                    v-bind="{
                      ...confirmPasswordInputProps,
                      ...validationProps,
                    }"
                    :disabled="creatingAccount || activatingAccount || activating"
                    autocomplete="off"
                  />
                </InputValidator>
              </PasswordInputWrapper>

              <v-alert type="error" variant="tonal" class="mt-2 mb-4" v-if="loginError">
                {{ loginError }}
              </v-alert>
            </FormValidator>

            <div class="d-flex justify-center mt-2">
              <VBtn color="anchor" variant="outlined" @click="$emit('update:modelValue', false)"> Close </VBtn>
              <VBtn
                class="ml-2"
                type="submit"
                color="secondary"
                :loading="activating"
                :disabled="
                  !isValidForm ||
                  creatingAccount ||
                  activatingAccount ||
                  (activeTab === 1 && isValidConnectConfirmationPassword)
                "
              >
                {{ activeTab === 0 ? "Login" : "Connect" }}
              </VBtn>
            </div>
          </form>
        </VContainer>
      </DTabs>

      <template v-if="profileManager.profile">
        <v-row>
          <v-col cols="12" md="6" lg="6" xl="6">
            <PasswordInputWrapper #="{ props }">
              <VTextField
                :label="'Your Mnemonic'"
                readonly
                v-model="profileManager.profile.mnemonic"
                v-bind="props"
                :disabled="activating || creatingAccount || activatingAccount"
              />
            </PasswordInputWrapper>
            <CopyInputWrapper :data="profileManager.profile.hexSeed" #="{ props }">
              <input-tooltip
                tooltip="Please use your hex seed to import your wallet in the Threefold mobile application."
              >
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

          <v-col cols="12" md="6" lg="6" xl="6">
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
import { isAddress } from "@polkadot/util-crypto";
import { KeypairType } from "@threefold/grid_client";
import { validateMnemonic } from "bip39";
import Cryptr from "cryptr";
import { marked } from "marked";
import md5 from "md5";
import { computed, onMounted, type Ref, ref, watch } from "vue";
import { nextTick } from "vue";
import { useTheme } from "vuetify";

import router from "@/router";
import { AppThemeSelection } from "@/utils/app_theme";
import { createCustomToast, ToastType } from "@/utils/custom_toast";
import { manual } from "@/utils/manual";

import { useProfileManagerController } from "../components/profile_manager_controller.vue";
import { useOnline } from "../hooks";
import { useInputRef } from "../hooks/input_validator";
import { useProfileManager } from "../stores";
import type { Credentials } from "../utils/credentials";
import { getCredentials, setCredentials } from "../utils/credentials";
import { activateAccountAndCreateTwin, createAccount, getGrid, loadBalance, loadProfile } from "../utils/grid";
import { readEmail, storeEmail } from "../utils/grid";
import { normalizeBalance, normalizeError } from "../utils/helpers";
const items = ref([{ id: 1, name: "stellar" }]);
const depositWallet = ref("");
const selectedName = ref("");
const selectedItem = ref(items.value[0]);
const depositFee = ref(0);
const loadEmail = ref<boolean>(false);

const keyType = ["sr25519", "ed25519"];
const keypairType = ref(KeypairType.sr25519);
const enableReload = ref(true);
const theme = useTheme();
const qrCodeText = ref("");
const props = defineProps({
  modelValue: {
    required: false,
    default: () => true,
    type: Boolean,
  },
});

const mnemonicRef = ref();
const emailRef = ref();

const emit = defineEmits<{ (event: "update:modelValue", value: boolean): void }>();
const bridge = (window as any).env.BRIDGE_TFT_ADDRESS;

const online = useOnline();
const handleFocus = (elementRef: HTMLInputElement) => {
  elementRef.removeAttribute("readonly");
};
watch(
  () => [online.value, props.modelValue],
  ([online, m], [wasOnline]) => {
    if (!wasOnline && online) {
      handleModelValue(true);
    }

    handleModelValue(online && m);
  },
);
function handleModelValue(m: boolean) {
  if (m) {
    nextTick().then(mounted);
  } else {
    nextTick().then(() => {
      if (isStoredCredentials()) {
        activeTab.value = 0;
      } else {
        activeTab.value = 1;
      }
      clearFields();
    });
  }
}
watch(
  () => keypairType.value,
  async (value, oldValue) => {
    if (value !== oldValue) {
      mnemonicInput.value?.validate();
    }
  },
  { deep: false },
);
const tabsRef = ref();

function handleTabs() {
  const tabs = tabsRef.value?.$el;
  if (!tabs) return;
  if (!isStoredCredentials()) return;

  const activeClass = "v-slide-group-item--active";
  const tabsButtons = tabs.nextSibling.querySelectorAll("button");
  const ButtonsList: HTMLElement[] = Array.from(tabsButtons);
  const activeButtonIndex = ButtonsList.findIndex(sibling => sibling.classList.contains(activeClass));
  activeTab.value = activeButtonIndex;
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
  if (isStoredCredentials()) {
    activeTab.value = 0;
    const credentials: Credentials = getCredentials();
    const sessionPassword = sessionStorage.getItem("password");

    if (!sessionPassword) return;

    password.value = sessionPassword;

    if (credentials.passwordHash) {
      return await login();
    }
  } else {
    activeTab.value = 1;
    return;
  }
}

function isStoredCredentials() {
  return localStorage.getItem(WALLET_KEY) ? true : false;
}

function getTabs() {
  handleTabs();
  let tabs = [];
  if (isStoredCredentials()) {
    tabs = [
      { title: "Login", value: "login" },
      { title: "Connect your Wallet", value: "register" },
    ];
  } else {
    tabs = [{ title: "Connect your Wallet", value: "register" }];
  }
  return tabs;
}
const termsLoading = ref(false);
const profileManager = useProfileManager();
const openAcceptTerms = ref(false);
const acceptTermsContent = ref("");
const mnemonic = ref("");
const isValidForm = ref(false);

const mnemonicInput = useInputRef();

const isNonActiveMnemonic = ref(false);
const shouldActivateAccount = computed(() => {
  if (!mnemonic.value) return false;
  return isNonActiveMnemonic.value;
});

const isValidConnectConfirmationPassword = computed(() =>
  !validateConfirmPassword(confirmPassword.value) ? false : true,
);
const profileManagerController = useProfileManagerController();

const balance = profileManagerController.balance;
const freeBalance = computed(() => balance.value?.free ?? 0);

const email = ref("");

const activeTab = ref(0);
const password = ref("");
const confirmPassword = ref("");
const passwordInput = ref() as Ref<{ validate(value: string): Promise<boolean> }>;
const confirmPasswordInput = useInputRef();

const version = 1;
const WALLET_KEY = "wallet.v" + version;
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

watch(
  password,
  () => {
    confirmPassword.value && confirmPasswordInput.value?.validate();
  },
  { immediate: true },
);

function logout() {
  sessionStorage.removeItem("password");
  profileManager.clear();
  kyc.clear();
  if (router.currentRoute.value.path.includes("/overview")) {
    router.push("/");
  }
}

const activating = ref(false);
const loginError = ref<string | null>(null);
const createAccountError = ref<string | null>(null);
const activatingAccountError = ref<string | null>(null);
function clearError() {
  isNonActiveMnemonic.value = false;
  loginError.value = null;
  createAccountError.value = null;
  activatingAccountError.value = null;
}

function clearFields() {
  password.value = "";
  confirmPassword.value = "";
  mnemonic.value = "";
  email.value = "";
}

function reloadValidation() {
  enableReload.value = true;
  mnemonicInput.value.validate();
}

async function activate(mnemonic: string, keypairType: KeypairType) {
  clearError();
  activating.value = true;
  sessionStorage.setItem("password", password.value);
  try {
    const grid = await getGrid({ mnemonic, keypairType });
    const profile = await loadProfile(grid!);
    if (email.value) {
      profile.email = email.value;
    }
    profileManager.set({ ...profile, mnemonic });
    emit("update:modelValue", false);
    // Migrate the ssh-key
    const sshKeysManagement = new SSHKeysManagement();
    if (!sshKeysManagement.migrated()) {
      const newKeys = sshKeysManagement.migrate();
      await sshKeysManagement.update(newKeys);
    }
  } catch (e) {
    loginError.value = normalizeError(e, "Something went wrong while login.");
  } finally {
    activating.value = false;
  }
}

onMounted(async () => {
  await mounted();
});

async function handleProfileDialog(value: boolean) {
  emit("update:modelValue", value);
  if (profileManager?.profile && value) __loadBalance(profileManager.profile);
}
const creatingAccount = ref(false);
async function createNewAccount() {
  openAcceptTerms.value = false;
  termsLoading.value = false;
  enableReload.value = false;
  mnemonicInput.value.reset();
  clearError();
  creatingAccount.value = true;
  try {
    const account = await createAccount();
    mnemonic.value = account.mnemonic;
  } catch (e) {
    enableReload.value = true;
    createAccountError.value = normalizeError(e, "Something went wrong while creating new account.");
  } finally {
    creatingAccount.value = false;
  }
}

const activatingAccount = ref(false);

async function activateAccount() {
  openAcceptTerms.value = false;
  termsLoading.value = false;
  enableReload.value = false;
  clearError();
  activatingAccount.value = true;
  activating.value = true;
  try {
    const mnemonicOrSeedValue = validateMnemonic(mnemonic.value)
      ? mnemonic.value
      : mnemonic.value.length === 66
      ? mnemonic.value
      : `0x${mnemonic.value}`;
    await activateAccountAndCreateTwin(mnemonicOrSeedValue);
    await storeAndLogin();
  } catch (e) {
    enableReload.value = true;
    activatingAccountError.value = normalizeError(e, "Something went wrong while activating your account.");
  } finally {
    activatingAccount.value = false;
    activating.value = false;
  }
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

async function login() {
  const credentials: Credentials = getCredentials();
  if (credentials.mnemonicHash && credentials.passwordHash) {
    if (credentials.passwordHash === md5(password.value)) {
      const cryptr = new Cryptr(password.value, { pbkdf2Iterations: 10, saltLength: 10 });
      const mnemonic = cryptr.decrypt(credentials.mnemonicHash);
      const keypairType = credentials.keypairTypeHash
        ? cryptr.decrypt(credentials.keypairTypeHash)
        : KeypairType.sr25519;

      await activate(mnemonic, keypairType as KeypairType);
      const grid = await getGrid({ mnemonic: mnemonic, keypairType: keypairType as KeypairType });

      const email = await readEmail(grid!);
      if (!email) {
        createCustomToast("Email is Missing! Please enter your Email.", ToastType.warning);
        router.push({ path: "/tf-chain/your-profile" });
      }
    }
  }
}

async function storeAndLogin() {
  const cryptr = new Cryptr(password.value, { pbkdf2Iterations: 10, saltLength: 10 });
  const mnemonicHash = cryptr.encrypt(mnemonic.value);
  const keypairTypeHash = cryptr.encrypt(keypairType.value);
  try {
    const grid = await getGrid({ mnemonic: mnemonic.value, keypairType: keypairType.value });
    storeEmail(grid!, email.value);
    setCredentials(md5(password.value), mnemonicHash, keypairTypeHash, md5(email.value));
    await activate(mnemonic.value, keypairType.value);
  } catch (e) {
    if (e instanceof TwinNotExistError) {
      openAcceptTerms.value = true;
      termsLoading.value = true;
      isNonActiveMnemonic.value = true;
    }
    enableReload.value = false;
    return {
      message: normalizeError(e, "Something went wrong. please try again."),
    };
  }
}

function validatePassword(value: string) {
  if (activeTab.value === 0) {
    if (!localStorage.getItem(WALLET_KEY)) {
      return { message: "We couldn't find a matching wallet for this password. Please connect your wallet first." };
    }
    if (getCredentials().passwordHash !== md5(password.value)) {
      return { message: "We couldn't find a matching wallet for this password. Please connect your wallet first." };
    }
  }
}

function validateConfirmPassword(value: string) {
  if (value !== password.value) {
    return { message: "Passwords should match." };
  }
}

function parseAcceptTermsImage(tempDiv: HTMLDivElement, url: string) {
  const imageElements = tempDiv.querySelectorAll("img");
  imageElements.forEach(imgElement => {
    imgElement.setAttribute("src", url + "legal__legal_header_.jpg");
    // Update the style of the image.
    imgElement.setAttribute("class", "info-legal-image");
  });
}

function parseAcceptTermsLink(tempDiv: HTMLDivElement) {
  const url = "https://library.threefold.me/info/legal#";
  const linkElements = tempDiv.querySelectorAll("a");
  linkElements.forEach(linkElement => {
    const currentDomainMatch = linkElement.href.match(/^(https?:\/\/[^\\/]+)/);
    if (
      (currentDomainMatch && linkElement.href.includes("localhost")) ||
      (currentDomainMatch && linkElement.href.includes("dashboard")) // To update only internal links
    ) {
      const currentDomain = currentDomainMatch[1];
      linkElement.href = linkElement.href.replace(currentDomain, url);
    }
  });
}
watch(openAcceptTerms, async () => {
  if (openAcceptTerms.value) {
    try {
      const url = "https://library.threefold.me/info/legal/";
      const response = await fetch(url + "readme.md");
      const mdContent = await response.text();
      const parsedContent = marked.parse(mdContent);

      const tempDiv = document.createElement("div");
      tempDiv.innerHTML = parsedContent;

      parseAcceptTermsImage(tempDiv, url);
      parseAcceptTermsLink(tempDiv);

      const updatedHtmlContent = tempDiv.innerHTML;
      acceptTermsContent.value = updatedHtmlContent;
    } catch (error) {
      console.error("Error fetching or parsing Markdown content:", error);
    } finally {
      termsLoading.value = false;
    }
  }
});

async function getEmail() {
  loadEmail.value = true;
  try {
    const grid = await getGrid({ mnemonic: mnemonic.value, keypairType: keypairType.value });
    if (grid) {
      email.value = await readEmail(grid);
    }
  } catch (e) {
    if (e instanceof TwinNotExistError) {
      isNonActiveMnemonic.value = true;
    } else {
      return {
        message: normalizeError(e, "Something went wrong. please try again."),
      };
    }
  } finally {
    loadEmail.value = false;
  }
}
</script>

<script lang="ts">
import { TwinNotExistError } from "@threefold/types";
import { capitalize } from "vue";

import QRPlayStore from "@/components/qr_play_store.vue";
import { useKYC } from "@/stores/kyc";
import SSHKeysManagement from "@/utils/ssh";

import type { Profile } from "../stores/profile_manager";
export default {
  name: "ProfileManager",
  components: {
    QRPlayStore,
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
