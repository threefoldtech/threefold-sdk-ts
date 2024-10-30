<template>
  <view-layout>
    <v-card color="primary" class="d-flex justify-center items-center mt-3 pa-3 text-center">
      <v-icon size="30" class="pr-3">mdi-cog</v-icon>
      <v-card-title class="pa-0">Settings</v-card-title>
    </v-card>
    <v-card class="my-5"
      ><v-card-title>Theme</v-card-title> <v-card-text>Pick an application theme!</v-card-text>

      <v-select class="pa-3 capitalize" :items="themes" v-model="selectedTheme" />

      <v-card-actions class="justify-end mb-3 mx-3">
        <v-btn :disabled="isCurrentTheme()" @click="UpdateTheme" class="justify-end ml-auto"
          >Update</v-btn
        ></v-card-actions
      >
    </v-card>
    <v-card class="my-5"
      ><v-card-title>Password</v-card-title> <v-card-text>Change your password</v-card-text>
      <form-validator ref="passFormRef" v-model="isValidPassword">
        <PasswordInputWrapper #="{ props: passwordInputProps }">
          <InputValidator
            default-value=""
            v-model:value="currentPassword"
            :rules="[
              validators.required('Password is required.'),
              validators.minLength('Password must be at least 6 characters.', 6),
              validators.validateCurrentPassword('Incorrect Password.'),
            ]"
            #="{ props: validationProps }"
          >
            <VTextField
              label="Current Password"
              v-model="currentPassword"
              v-bind="{ ...passwordInputProps, ...validationProps }"
              autocomplete="off"
              class="pa-3"
              hide-details="auto"
            />
          </InputValidator>
        </PasswordInputWrapper>

        <PasswordInputWrapper #="{ props: passwordInputProps }">
          <InputValidator
            default-value=""
            v-model:value="newPassword"
            :rules="[
              validators.required('Password is required.'),
              validators.minLength('Password must be at least 6 characters.', 6),
              validators.validateNewPassword(
                'New password cannot be the same as current password. Please enter a different password.',
                currentPassword,
              ),
            ]"
            #="{ props: validationProps }"
          >
            <VTextField
              label="New Password"
              v-model="newPassword"
              v-bind="{ ...passwordInputProps, ...validationProps }"
              autocomplete="off"
              class="pa-3"
              hide-details="auto"
            />
          </InputValidator>
        </PasswordInputWrapper>
        <PasswordInputWrapper #="{ props: confirmPasswordInputProps }">
          <InputValidator
            default-value=""
            v-model:value="confirmPassword"
            :rules="[
              validators.required('A confirmation password is required.'),
              validators.validateConfirmPassword('Passwords should match.', newPassword),
            ]"
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
              autocomplete="off"
              class="pa-3"
              hide-details="auto"
            />
          </InputValidator>
        </PasswordInputWrapper>
      </form-validator>
      <v-card-actions class="justify-end mb-3 mx-3">
        <v-btn :disabled="!isValidPassword" @click="UpdatePassword" class="justify-end ml-auto"
          >Update</v-btn
        ></v-card-actions
      >
    </v-card>
    <v-card class="my-5"
      ><v-card-title>Timeout</v-card-title>

      <form-validator v-model="isValidTimeout">
        <v-card-text>
          Adjust Query Timeout
          <v-tooltip location="end">
            <template #activator="{ props: tooltipProps }">
              <v-icon v-bind="tooltipProps"> mdi-information-outline </v-icon>
            </template>
            <span>Set desired queries timeout in seconds</span>
          </v-tooltip>
        </v-card-text>

        <input-validator
          :value="selectedQueryTimeout"
          :rules="[
            validators.required('Query timeout is required.'),
            validators.isInt('Timeout must be a valid integer.'),
            validators.min(`Query timeout should be at least 3 second.`, 3),
            validators.max('Query timeout maximum limit exceeded', 3 * 60),
          ]"
          #="{ props }"
          ref="timeoutQueryInput"
        >
          <v-text-field
            label="Enter Query timeout (sec)"
            class="pa-3"
            v-bind="props"
            type="number"
            v-model="selectedQueryTimeout"
            hide-details="auto"
          ></v-text-field>
        </input-validator>

        <v-card-text>
          Adjust Deployment Timeout
          <v-tooltip location="end">
            <template #activator="{ props: tooltipProps }">
              <v-icon v-bind="tooltipProps"> mdi-information-outline </v-icon>
            </template>
            <span>Set desired deployment timeout in seconds</span>
          </v-tooltip>
        </v-card-text>
        <input-validator
          :value="selectedDeploymentTimeout"
          :rules="[
            validators.required('Deployment timeout is required.'),
            validators.isInt('Timeout must be a valid integer.'),
            validators.min(`Deployment timeout should be at least 3 second.`, 3),
            validators.max('Deployment timeout maximum limit exceeded', 30 * 60),
          ]"
          #="{ props }"
          ref="timeoutDeploymentInput"
        >
          <v-text-field
            label="Enter Deployment timeout (sec)"
            class="pa-3"
            v-bind="props"
            type="number"
            v-model="selectedDeploymentTimeout"
            hide-details="auto"
          ></v-text-field>
        </input-validator>
        <v-card-actions class="justify-end mb-3 mx-3">
          <v-btn :disabled="!isValidTimeout || isCurrentTimeout()" @click="UpdateTimeout" class="justify-end ml-auto"
            >Update</v-btn
          ></v-card-actions
        >
      </form-validator>
    </v-card>
  </view-layout>
</template>
<script lang="ts">
import type { GridClient } from "@threefold/grid_client";
import { nextTick, onMounted, ref, watch } from "vue";
import { useTheme } from "vuetify";

import { useFormRef } from "@/hooks/form_validator";
import { useInputRef } from "@/hooks/input_validator";
import { AppThemeSelection } from "@/utils/app_theme";
import { createCustomToast, ToastType } from "@/utils/custom_toast";
import {
  LocalStorageSettingsKey,
  SessionStorageSettingsKey,
  ThemeSettingsInterface as ThemeInterface,
} from "@/utils/settings";

import { useGrid } from "../stores";
import { updateCredentials } from "../utils/credentials";

export default {
  name: "Settings",
  setup() {
    const theme = useTheme();

    const themes: string[] = [ThemeInterface.Dark, ThemeInterface.Light, ThemeInterface.System];

    const currentTheme = ref(localStorage.getItem(LocalStorageSettingsKey.THEME_KEY));
    const selectedTheme = ref(localStorage.getItem(LocalStorageSettingsKey.THEME_KEY));

    const currentPassword = ref("");
    const newPassword = ref("");
    const confirmPassword = ref("");
    const currentQueryTimeout = ref(window.env.TIMEOUT / 1000);
    const selectedQueryTimeout = ref(0);
    const gridStore = useGrid();
    const confirmPasswordInput = useInputRef();
    watch(newPassword, async () => {
      if (newPassword.value && confirmPassword.value.length != 0) {
        await nextTick();

        confirmPasswordInput.value?.validate();
      }
    });

    watch(
      theme.global.name,
      theme => {
        selectedTheme.value = currentTheme.value = theme.includes("mode") ? theme : `${theme} mode`;
        localStorage.setItem(LocalStorageSettingsKey.THEME_KEY, theme);
      },
      { immediate: true },
    );

    const deploymentTimeoutdefaultMinutes = gridStore?.client.clientOptions.deploymentTimeoutMinutes;
    const selectedDeploymentTimeout = ref(0);
    const currentDeploymentTimeout = ref(0);

    const isValidTimeout = ref(false);
    const isValidPassword = ref(false);

    onMounted(async () => {
      currentQueryTimeout.value = +localStorage.getItem(LocalStorageSettingsKey.TIMEOUT_QUERY_KEY)!;
      selectedQueryTimeout.value = currentQueryTimeout.value;
      if (localStorage.getItem(LocalStorageSettingsKey.TIMEOUT_DEPLOYMENT_KEY)) {
        currentDeploymentTimeout.value = +localStorage.getItem(LocalStorageSettingsKey.TIMEOUT_DEPLOYMENT_KEY)!;
      } else if (deploymentTimeoutdefaultMinutes) {
        currentDeploymentTimeout.value = deploymentTimeoutdefaultMinutes * 60;
        localStorage.setItem(LocalStorageSettingsKey.TIMEOUT_DEPLOYMENT_KEY, `${currentDeploymentTimeout.value}`);
      }
      selectedDeploymentTimeout.value = currentDeploymentTimeout.value;
    });

    function isCurrentTheme() {
      return selectedTheme.value == currentTheme.value;
    }
    function UpdateTheme() {
      switch (selectedTheme.value) {
        case ThemeInterface.Dark:
          currentTheme.value = ThemeInterface.Dark;
          theme.global.name.value = AppThemeSelection.dark;
          break;
        case ThemeInterface.Light:
          currentTheme.value = ThemeInterface.Light;
          theme.global.name.value = AppThemeSelection.light;
          break;

        case ThemeInterface.System:
          currentTheme.value = ThemeInterface.System;
          if (window.matchMedia("(prefers-color-scheme: dark)").matches) {
            theme.global.name.value = AppThemeSelection.dark;
            break;
          }

          theme.global.name.value = AppThemeSelection.light;
          break;
      }

      localStorage.setItem(LocalStorageSettingsKey.THEME_KEY, currentTheme.value!);
    }

    /** Updates user credentials with the hashes produced by the new password  */
    const passFormRef = useFormRef();
    async function UpdatePassword() {
      try {
        await updateCredentials(currentPassword.value, newPassword.value);
        sessionStorage.setItem(SessionStorageSettingsKey.PASSWORD_KEY, newPassword.value);
        passFormRef.value.reset();

        createCustomToast("Password Updated!", ToastType.success);
      } catch (err) {
        console.log(err);
        createCustomToast("Password Update Failed", ToastType.danger);
      }
    }
    function isCurrentTimeout() {
      return (
        currentQueryTimeout.value == selectedQueryTimeout.value &&
        currentDeploymentTimeout.value == selectedDeploymentTimeout.value
      );
    }
    async function UpdateTimeout() {
      try {
        const client = gridStore.client as GridClient;

        if (selectedQueryTimeout.value != currentQueryTimeout.value) {
          localStorage.setItem(LocalStorageSettingsKey.TIMEOUT_QUERY_KEY, `${selectedQueryTimeout.value}`);
          window.env.TIMEOUT = +localStorage.getItem(LocalStorageSettingsKey.TIMEOUT_QUERY_KEY)! * 1000;
          currentQueryTimeout.value = +localStorage.getItem(LocalStorageSettingsKey.TIMEOUT_QUERY_KEY)!;
          selectedQueryTimeout.value = currentQueryTimeout.value;
        }

        if (selectedDeploymentTimeout.value != currentDeploymentTimeout.value) {
          localStorage.setItem(LocalStorageSettingsKey.TIMEOUT_DEPLOYMENT_KEY, `${selectedDeploymentTimeout.value}`);
          currentDeploymentTimeout.value = +localStorage.getItem(LocalStorageSettingsKey.TIMEOUT_DEPLOYMENT_KEY)!;
          selectedDeploymentTimeout.value = currentDeploymentTimeout.value;
          if (client) {
            client.clientOptions.deploymentTimeoutMinutes =
              +localStorage.getItem(LocalStorageSettingsKey.TIMEOUT_DEPLOYMENT_KEY)! / 60;
            await client.connect();
          }
        }

        createCustomToast("Session Timeout Updated", ToastType.success);

        isValidTimeout.value = false;
      } catch (err) {
        createCustomToast("Could not update timeout", ToastType.danger);
        console.log(err);
      }
    }

    return {
      themes,
      selectedTheme,
      currentTheme,
      currentPassword,
      newPassword,
      confirmPassword,
      selectedQueryTimeout,
      selectedDeploymentTimeout,
      currentQueryTimeout,
      isValidTimeout,
      isValidPassword,
      UpdateTheme,
      passFormRef,
      UpdatePassword,
      UpdateTimeout,
      isCurrentTheme,
      isCurrentTimeout,
      confirmPasswordInput,
    };
  },
};
</script>
