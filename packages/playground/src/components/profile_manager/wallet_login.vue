<template>
  <form id="wallet-login-tab__form" @submit.prevent="login()">
    <FormValidator id="wallet-login-tab__form-validator" v-model="isValidForm">
      <div class="pa-4" id="wallet-login-tab">
        <v-alert id="wallet-login-tab__info-alert" type="info" variant="tonal" class="mb-6">
          <p id="wallet-login-tab__info-text" :style="{ maxWidth: '880px' }">
            You will need to provide the password used while connecting your wallet.
          </p>
        </v-alert>
        <WalletPassword id="wallet-login-tab__password-input" mode="Login" v-model="password" :disabled="loading" />
        <v-alert id="wallet-login-tab__error-alert" type="error" variant="tonal" class="mt-2 mb-4" v-if="loginError">
          {{ loginError }}
        </v-alert>
        <div id="wallet-login-tab__button-group" class="d-flex justify-center mt-2">
          <VBtn id="wallet-login-tab__close-button" color="anchor" variant="outlined" @click="$emit('closeDialog')">
            Close
          </VBtn>
          <VBtn
            id="wallet-login-tab__login-button"
            class="ml-2"
            type="submit"
            color="secondary"
            :loading="loading"
            :disabled="!isValidForm"
          >
            Login
          </VBtn>
        </div>
      </div>
    </FormValidator>
  </form>
</template>
<script lang="ts" setup>
import { KeypairType } from "@threefold/grid_client";
import Cryptr from "cryptr";
import md5 from "md5";
import { onMounted, ref } from "vue";

import WalletPassword from "@/components/profile_manager/Wallet_password.vue";
import { useProfileManager } from "@/stores/profile_manager";
import { Credentials, getCredentials } from "@/utils/credentials";
import { getGrid, loadProfile } from "@/utils/grid";
import { normalizeError } from "@/utils/helpers";
import { handlePostLogin } from "@/utils/profile_manager";
const profileManager = useProfileManager();
const password = ref("");
const emit = defineEmits(["closeDialog", "update:loading"]);
const isValidForm = ref(false);
const loading = ref<boolean>(false);
const loginError = ref<string>("");

onMounted(async () => {
  if (getCredentials()) {
    const credentials: Credentials = getCredentials();
    const sessionPassword = sessionStorage.getItem("password");

    if (!sessionPassword) return;

    password.value = sessionPassword;

    if (credentials.passwordHash) {
      return await login();
    }
  }
});

async function login() {
  loading.value = true;
  emit("update:loading", true);
  await new Promise(resolve => setTimeout(resolve, 1000));
  loginError.value = "";
  try {
    const credentials: Credentials = getCredentials();
    if (credentials.mnemonicHash && credentials.passwordHash) {
      if (credentials.passwordHash === md5(password.value)) {
        const cryptr = new Cryptr(password.value, { pbkdf2Iterations: 10, saltLength: 10 });
        const mnemonic = cryptr.decrypt(credentials.mnemonicHash);
        const keypairType = credentials.keypairTypeHash
          ? cryptr.decrypt(credentials.keypairTypeHash)
          : KeypairType.sr25519;

        const grid = await getGrid({ mnemonic: mnemonic, keypairType: keypairType as KeypairType });
        await handlePostLogin(grid!, password.value);
        profileManager.set({ ...(await loadProfile(grid!)), mnemonic });
        emit("closeDialog");
      }
    } else {
      throw new Error("No credentials found.");
    }
  } catch (error) {
    const message = "Something went wrong while login.";
    console.error(message, error);
    loginError.value = normalizeError(error, message);
  } finally {
    loading.value = false;
    emit("update:loading", false);
  }
}
</script>
<script lang="ts">
export default {
  name: "WalletLogin",
  components: {
    WalletPassword,
  },
};
</script>
