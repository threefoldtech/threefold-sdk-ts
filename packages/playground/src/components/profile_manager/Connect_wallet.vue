<template>
  <form @submit.prevent="storeAndLogin()">
    {{ isNonActiveMnemonic }}
    <FormValidator v-model="isValidForm">
      <v-alert type="warning" variant="tonal" class="mb-6">
        <p :style="{ maxWidth: '880px' }">
          To connect your wallet, you will need to enter your Mnemonic or Hex Seed which will be encrypted using the
          password. Mnemonic or Hex Seed will never be shared outside of this device.
        </p>
      </v-alert>
      <v-alert variant="tonal" type="info" class="mb-6" v-if="keypairType === KeypairType.ed25519">
        <p>
          Please note that generation or activation of ed25519 Keys isn't supported, you can only import pre existing
          ones.
        </p>
      </v-alert>

      <!-- Mnemonic or Hex -->
      <v-row>
        <v-col cols="12" md="9">
          <VTooltip
            text="Mnemonic or Hex Seed are your private key. They are used to represent you on the ThreeFold Grid. You can paste existing (Mnemonic or Hex Seed) or click the 'Create Account' button to create an account and generate mnemonic."
            location="bottom"
            max-width="700px"
          >
            <template #activator="{ props: tooltipProps }">
              <PasswordInputWrapper #="{ props: passwordInputProps }">
                <InputValidator
                  :value="mnemonic"
                  :rules="[
                validators.required('Mnemonic or Hex Seed is required.'),
                (input:string)=>validateMnemonicInput(input),
              ]"
                  valid-message="Mnemonic or Hex Seed is valid."
                  #="{ props: validationProps }"
                  ref="mnemonicInput"
                >
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
                      autocomplete="off"
                      :disabled="creatingAccount || activatingAccount || activating"
                      @click:append="reloadValidation"
                      ref="mnemonicRef"
                    >
                      <template v-slot:prepend-inner v-if="validationProps.hint || validationProps.error">
                        <v-icon :color="validationProps.error ? 'red' : 'green'">
                          {{ validationProps.error ? "mdi-close" : "mdi-check" }}
                        </v-icon>
                      </template></VTextField
                    >
                  </div>
                </InputValidator>
              </PasswordInputWrapper>
            </template>
          </VTooltip>
        </v-col>
        <v-col cols="12" md="3">
          <v-tooltip location="top" text="Using different keypair types will lead to a completely different account.">
            <template #activator="{ props }">
              <v-autocomplete
                label="Keypair Type"
                v-bind="props"
                :items="[...keyType]"
                item-title="name"
                v-model="keypairType"
              />
            </template>
          </v-tooltip>
        </v-col>
      </v-row>

      <!-- create Account -->
      <div class="d-flex flex-column flex-md-row justify-end mb-10">
        <VBtn
          class="mt-2 ml-sm-0 ml-md-3"
          color="secondary"
          variant="outlined"
          :disabled="isValidForm || !!mnemonic || keypairType === KeypairType.ed25519"
          :loading="creatingAccount"
        >
          <!-- shouldActivateAccount -->
          create account
        </VBtn>
      </div>

      <v-alert type="error" variant="tonal" class="mb-4" v-if="createAccountError || activatingAccountError">
        {{ createAccountError || activatingAccountError }}
      </v-alert>

      <!-- Email -->
      <input-validator
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
          :disabled="
            creatingAccount ||
            activatingAccount ||
            activating ||
            loadEmail ||
            mnemonicInput.status !== ValidatorStatus.Valid
          "
          ref="emailRef"
        />
      </input-validator>

      <!-- Passwords -->
      <Wallet_password v-model="password" mode="Create" />
      <PasswordInputWrapper #="{ props: confirmPasswordInputProps }">
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

      <v-alert type="error" variant="tonal" class="mb-4" v-if="storeAndLoginError">
        {{ storeAndLoginError }}
      </v-alert>
      <!-- Action Buttons -->
      <div class="d-flex justify-center mt-2">
        <VBtn color="anchor" variant="outlined" @click="emit('closeDialog')"> Close </VBtn>
        <VBtn
          class="ml-2"
          type="submit"
          color="secondary"
          :loading="activating"
          :disabled="!isValidForm || creatingAccount || activatingAccount"
        >
          Connect
        </VBtn>
      </div>
    </FormValidator>
  </form>
</template>
<script lang="ts" setup>
import { isAddress } from "@polkadot/util-crypto";
import { KeypairType } from "@threefold/grid_client";
import { TwinNotExistError } from "@threefold/types";
import { validateMnemonic } from "bip39";
import Cryptr from "cryptr";
import md5 from "md5";
import { ref } from "vue";

import { useInputRef } from "@/hooks/input_validator";
import { setCredentials } from "@/utils/credentials";
import { getGrid, readEmail, storeEmail } from "@/utils/grid";
import { normalizeError } from "@/utils/helpers";

import Wallet_password from "./Wallet_password.vue";
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
const activatingAccount = ref(false);
const activating = ref(false);

// flags
const enableReload = ref(false);
const isNonActiveMnemonic = ref(false);

// errors
const CreateOrActivateError = ref("");
const storeAndLoginError = ref("");

// terms and conditions
const openAcceptTerms = ref(false);
const termsLoading = ref(false);

const emit = defineEmits(["closeDialog"]);
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

function reloadValidation() {
  enableReload.value = true;
  mnemonicInput.value.validate();
}
const validateMnemonicInput = (input: string) => {
  isNonActiveMnemonic.value = false;
  if (
    validateMnemonic(input) ||
    ((input.length === 64 || input.length === 66) && isAddress(input.length === 66 ? input : `0x${input}`))
  ) {
    getEmail();
    return;
  }
  email.value = "";
  return {
    message: "Mnemonic or Hex Seed doesn't seem to be valid.",
  };
};

function validateConfirmPassword(value: string) {
  if (value !== password.value) {
    return { message: "Passwords should match." };
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
    // await activate(mnemonic.value, keypairType.value);
  } catch (e) {
    if (e instanceof TwinNotExistError) {
      openAcceptTerms.value = true;
      termsLoading.value = true;
      isNonActiveMnemonic.value = true;
    }
    console.log("error", e);
    enableReload.value = false;
    storeAndLoginError.value = normalizeError(e, "Something went wrong. please try again.");
  }
}
</script>
<script lang="ts">
export default {
  name: "ConnectWallet",
};
</script>
