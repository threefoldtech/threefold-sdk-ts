<template>
  <form id="wallet-form" @submit.prevent="storeAndLogin()">
    <FormValidator id="form-validator" v-model="isValidForm">
      <v-alert id="mnemonic-warning" type="warning" variant="tonal" class="mb-6">
        <p :style="{ maxWidth: '880px' }">
          To connect your wallet, you will need to enter your Mnemonic or Hex Seed which will be encrypted using the
          password. Mnemonic or Hex Seed will never be shared outside of this device.
        </p>
      </v-alert>
      <v-alert id="ed25519-warning" variant="tonal" type="info" class="mb-6" v-if="keypairType === KeypairType.ed25519">
        <p>
          Please note that generation or activation of ed25519 Keys isn't supported, you can only import pre-existing
          ones.
        </p>
      </v-alert>

      <!-- Mnemonic or Hex -->
      <v-row>
        <v-col cols="12" md="9">
          <VTooltip
            id="mnemonic-tooltip"
            text="Mnemonic or Hex Seed are your private key. They are used to represent you on the ThreeFold Grid. You can paste existing (Mnemonic or Hex Seed) or click the 'Create Account' button to create an account and generate mnemonic."
            location="bottom"
            max-width="700px"
          >
            <template #activator="{ props: tooltipProps }">
              <PasswordInputWrapper id="password-input-wrapper" #="{ props: passwordInputProps }">
                <InputValidator
                  id="mnemonic-input-validator"
                  :value="mnemonic"
                  :rules="[validators.required('Mnemonic or Hex Seed is required.')]"
                  :asyncRules="[validateMnemonicInput]"
                  valid-message="Mnemonic or Hex Seed is valid."
                  #="{ props: validationProps }"
                  ref="mnemonicInput"
                >
                  <div v-bind="tooltipProps">
                    <VTextField
                      id="mnemonic-text-field"
                      :append-icon="enableReload && mnemonic !== '' ? 'mdi-reload' : ''"
                      label="Mnemonic or Hex Seed"
                      placeholder="Please insert your Mnemonic or Hex Seed"
                      v-model="mnemonic"
                      v-bind="{
                        ...passwordInputProps,
                        ...validationProps,
                      }"
                      autocomplete="off"
                      :disabled="creatingAccount || connecting"
                      @click:append="reloadValidation"
                      ref="mnemonicRef"
                    >
                      <template v-slot:prepend-inner v-if="validationProps.hint || validationProps.error">
                        <v-icon id="mnemonic-validation-icon" :color="validationProps.error ? 'red' : 'green'">
                          {{ validationProps.error ? "mdi-close" : "mdi-check" }}
                        </v-icon>
                      </template>
                    </VTextField>
                  </div>
                </InputValidator>
              </PasswordInputWrapper>
            </template>
          </VTooltip>
        </v-col>
        <v-col cols="12" md="3">
          <v-tooltip
            id="keypair-tooltip"
            location="top"
            text="Using different keypair types will lead to a completely different account."
          >
            <template #activator="{ props }">
              <v-autocomplete
                id="keypair-select"
                label="Keypair Type"
                v-bind="props"
                :items="[...keyType]"
                item-title="name"
                v-model="keypairType"
                @update:modelValue="mnemonic !== '' ? reloadValidation() : null"
              />
            </template>
          </v-tooltip>
        </v-col>
      </v-row>

      <!-- create Account -->
      <div id="create-account-container" class="d-flex flex-column flex-md-row justify-end mb-5">
        <VBtn
          id="create-account-btn"
          class="mt-2 ml-sm-0 ml-md-3"
          color="secondary"
          variant="outlined"
          :disabled="isValidForm || !!mnemonic || keypairType === KeypairType.ed25519 || isNonActiveMnemonic"
          :loading="creatingAccount"
          @click="openAcceptTerms = true"
        >
          create account
        </VBtn>
      </div>

      <v-alert id="activation-error" type="error" variant="tonal" class="mb-4" v-if="createOrActivateError">
        {{ createOrActivateError }}
      </v-alert>

      <!-- Email -->
      <input-validator
        id="email-validator"
        :value="email"
        :rules="[
          validators.required('Email is required.'),
          validators.isEmail('Please provide a valid email address.'),
        ]"
        #="{ props }"
      >
        <v-text-field
          id="email-text-field"
          label="Email"
          placeholder="email@example.com"
          v-model="email"
          v-bind="props"
          :loading="loadEmail"
          :disabled="creatingAccount || connecting || loadEmail || mnemonicInput?.status !== ValidatorStatus.Valid"
          ref="emailRef"
          autocomplete="off"
        />
      </input-validator>

      <!-- Passwords -->
      <WalletPassword id="password-input" v-model="password" mode="Create" :disabled="creatingAccount || connecting" />
      <PasswordInputWrapper id="confirm-password-wrapper" #="{ props: confirmPasswordInputProps }">
        <InputValidator
          id="confirm-password-validator"
          :value="confirmPassword"
          :rules="[validators.required('A confirmation password is required.'), validateConfirmPassword]"
          #="{ props: validationProps }"
          ref="confirmPasswordInput"
        >
          <VTextField
            id="confirm-password-text-field"
            label="Confirm Password"
            v-model="confirmPassword"
            v-bind="{
              ...confirmPasswordInputProps,
              ...validationProps,
            }"
            :disabled="creatingAccount || connecting"
            autocomplete="off"
          />
        </InputValidator>
      </PasswordInputWrapper>

      <v-alert id="login-error" type="error" variant="tonal" class="mb-4" v-if="storeAndLoginError">
        {{ storeAndLoginError }}
      </v-alert>
      <!-- Action Buttons -->
      <div id="action-buttons-container" class="d-flex justify-center mt-2">
        <VBtn id="close-btn" color="anchor" variant="outlined" @click="emit('closeDialog')"> Close </VBtn>
        <VBtn
          id="connect-btn"
          class="ml-2"
          type="submit"
          color="secondary"
          :loading="connecting"
          :disabled="!isValidForm || creatingAccount"
        >
          Connect
        </VBtn>
      </div>
    </FormValidator>
  </form>
  <AcceptTermsDialog
    id="terms-dialog"
    v-model="openAcceptTerms"
    @onError="handleTCErrors"
    @onAccept="handleAcceptTerms"
  />
</template>
<script lang="ts" setup>
import { isAddress } from "@polkadot/util-crypto";
import { GridClient, KeypairType } from "@threefold/grid_client";
import { TwinNotExistError } from "@threefold/types";
import { validateMnemonic } from "bip39";
import Cryptr from "cryptr";
import md5 from "md5";
import { ref, watch } from "vue";

import { ValidatorStatus } from "@/hooks/form_validator";
import { useInputRef } from "@/hooks/input_validator";
import { useProfileManager } from "@/stores";
import { setCredentials } from "@/utils/credentials";
import { activateAccountAndCreateTwin, createAccount, getGrid, loadProfile, readEmail, storeEmail } from "@/utils/grid";
import { normalizeError } from "@/utils/helpers";
const profileManager = useProfileManager();
const mnemonic = ref("");
const email = ref("");
const password = ref("");
const confirmPassword = ref("");
const isValidForm = ref(false);
const keypairType = ref(KeypairType.sr25519);
const keyType = ["sr25519", "ed25519"];

const mnemonicInput = useInputRef();
// loading
const loadEmail = ref(false);
const creatingAccount = ref(false);
const connecting = ref(false);

// flags
const enableReload = ref(false);
const isNonActiveMnemonic = ref(false);

// errors
const createOrActivateError = ref("");
const storeAndLoginError = ref("");

// terms and conditions
const openAcceptTerms = ref(false);
const handleTCErrors = (error: string) => {
  openAcceptTerms.value = false;
  createOrActivateError.value = error;
};

const handleAcceptTerms = () => {
  openAcceptTerms.value = false;
  isNonActiveMnemonic.value ? activateAccount() : createNewAccount();
};

const emit = defineEmits(["closeDialog", "update:loading"]);

watch([connecting, creatingAccount], () => {
  emit("update:loading", connecting.value || creatingAccount.value);
});
async function getEmail(grid: GridClient) {
  loadEmail.value = true;
  try {
    email.value = await readEmail(grid);
  } catch (e) {
    console.error("error", e);
  } finally {
    loadEmail.value = false;
  }
}

const clearErrors = () => {
  createOrActivateError.value = "";
  storeAndLoginError.value = "";
};

function reloadValidation() {
  enableReload.value = false;
  mnemonicInput.value.validate();
}
const validateMnemonicInput = async (input: string) => {
  clearErrors();
  enableReload.value = false;
  isNonActiveMnemonic.value = false;
  if (
    validateMnemonic(input) ||
    ((input.length === 64 || input.length === 66) && isAddress(input.length === 66 ? input : `0x${input}`))
  ) {
    try {
      const grid = await getGrid({ mnemonic: mnemonic.value, keypairType: keypairType.value });
      getEmail(grid!);
    } catch (e) {
      if (e instanceof TwinNotExistError) {
        isNonActiveMnemonic.value = true;
      } else {
        console.error("ValidateMnemonicInput error", e);
        enableReload.value = true;
        return { message: normalizeError(e, "Something went wrong. please try again.") };
      }
    }
    return;
  }
  return {
    message: "Mnemonic or Hex Seed doesn't seem to be valid.",
  };
};

function validateConfirmPassword(value: string) {
  if (value !== password.value) {
    return { message: "Passwords should match." };
  }
}

async function createNewAccount() {
  clearErrors();
  mnemonicInput.value.reset();
  creatingAccount.value = true;
  try {
    const account = await createAccount();
    mnemonic.value = account.mnemonic;
  } catch (e) {
    createOrActivateError.value = normalizeError(e, "Something went wrong while creating new account.");
  } finally {
    creatingAccount.value = false;
  }
}

async function activateAccount() {
  clearErrors();
  creatingAccount.value = true;
  connecting.value = true;
  try {
    const mnemonicOrSeedValue = validateMnemonic(mnemonic.value)
      ? mnemonic.value
      : mnemonic.value.length === 66
      ? mnemonic.value
      : `0x${mnemonic.value}`;
    await activateAccountAndCreateTwin(mnemonicOrSeedValue);
    await storeAndLogin();
  } catch (e) {
    connecting.value = false;
    createOrActivateError.value = normalizeError(e, "Something went wrong while activating your account.");
  } finally {
    creatingAccount.value = false;
  }
}

async function storeAndLogin() {
  clearErrors();
  connecting.value = true;
  const cryptr = new Cryptr(password.value, { pbkdf2Iterations: 10, saltLength: 10 });
  const mnemonicHash = cryptr.encrypt(mnemonic.value);
  const keypairTypeHash = cryptr.encrypt(keypairType.value);
  try {
    const grid = await getGrid({ mnemonic: mnemonic.value, keypairType: keypairType.value });
    storeEmail(grid!, email.value);
    setCredentials(md5(password.value), mnemonicHash, keypairTypeHash, md5(email.value));
    await handlePostLogin(grid!, password.value, email.value);
    const profile = await loadProfile(grid!);
    if (email.value && profile.email !== email.value) {
      profile.email = email.value;
    }
    profileManager.set({ ...profile, mnemonic: mnemonic.value });
  } catch (e) {
    if (e instanceof TwinNotExistError) {
      isNonActiveMnemonic.value = true;
      if (keypairType.value === KeypairType.ed25519) {
        createOrActivateError.value = "Activation ed25519 Keys isn't supported, you can only import pre-existing ones.";
        return;
      }

      openAcceptTerms.value = true;
      return;
    }
    console.error("error", e);
    enableReload.value = false;
    storeAndLoginError.value = normalizeError(e, "Something went wrong. please try again.");
  } finally {
    connecting.value = false;
  }
}
</script>
<script lang="ts">
import { handlePostLogin } from "@/utils/profile_manager";

import AcceptTermsDialog from "./AcceptTermsDialog.vue";
import WalletPassword from "./Wallet_password.vue";

export default {
  name: "ConnectWallet",
  components: {
    WalletPassword,
    AcceptTermsDialog,
  },
};
</script>
