<template>
  <PasswordInputWrapper id="wallet-password__input-wrapper" #="{ props: passwordInputProps }">
    <InputValidator
      id="wallet-password__input-validator"
      :value="modelValue"
      :rules="[
        validators.required('Password is required.'),
        validators.minLength('Password must be at least 6 characters.', 6),
        props.mode === 'Login' ? validatePassword : null,
      ]"
      #="{ props: validationProps }"
      ref="passwordInput"
    >
      <v-tooltip
        id="wallet-password__tooltip"
        location="top right"
        text="Used to encrypt your mnemonic on your local system, and is used to login from the same device."
      >
        <template #activator="{ props: tooltipProps }">
          <div id="wallet-password__tooltip-activator" v-bind="tooltipProps">
            <VTextField
              id="wallet-password__text-field"
              label="Password"
              :modelValue="modelValue"
              @update:modelValue="$emit('update:modelValue', $event)"
              v-bind="{ ...passwordInputProps, ...validationProps }"
              autocomplete="off"
            />
          </div>
        </template>
      </v-tooltip>
    </InputValidator>
  </PasswordInputWrapper>
</template>

<script lang="ts" setup>
import md5 from "md5";

import { getCredentials } from "@/utils/credentials";
defineEmits(["update:modelValue"]);
const props = defineProps({
  modelValue: {
    required: true,
    type: String,
  },
  mode: {
    required: true,
    type: String as () => "Login" | "Create",
    default: "Create",
  },
});

function validatePassword(value: string) {
  if (!localStorage.getItem(window.env.WALLET_KEY)) {
    return {
      message: "We couldn't find a matching wallet for this password. Please connect your wallet first.",
    };
  }
  if (getCredentials().passwordHash !== md5(props.modelValue)) {
    return {
      message: "We couldn't find a matching wallet for this password. Please connect your wallet first.",
    };
  }
}
</script>

<script lang="ts">
export default {
  name: "WalletPassword",
};
</script>
