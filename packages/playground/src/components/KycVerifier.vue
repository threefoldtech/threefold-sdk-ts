<template>
  <v-dialog
    v-if="!loading && token"
    fullscreen
    :model-value="moduleValue"
    @update:model-value="handleUpdateDialog($event)"
    width="100%"
    class="w-100 h-100 d-flex justify-center align-center"
  >
    <iframe
      id="iframe"
      allowfullscreen
      style="width: 100%; height: 100%; border: none"
      :src="`https://ui.idenfy.com/?authToken=${token}`"
      allow="camera"
    />
  </v-dialog>
</template>
<script lang="ts">
import { KycErrors } from "@threefold/types";
import { onMounted, ref } from "vue";

import { useKYC } from "@/stores/kyc";
import { createCustomToast, ToastType } from "@/utils/custom_toast";
import { handleKYCError } from "@/utils/helpers";

export default {
  name: "KycVerifier",
  props: {
    moduleValue: {
      type: Boolean,
      required: true,
    },
    loading: {
      type: Boolean,
      required: true,
    },
  },
  emits: ["update:moduleValue", "loaded"],
  setup(props, { emit }) {
    const kyc = useKYC();
    const token = ref("");

    const handleUpdateDialog = (event: boolean) => {
      emit("update:moduleValue", event);
    };

    const getToken = async () => {
      try {
        if (!kyc.client) throw new Error("KYC client is not initialized");
        token.value = await kyc.client.getToken();
      } catch (e) {
        handleUpdateDialog(false);
        if (e instanceof KycErrors.KycAlreadyVerifiedError) {
          kyc.updateStatus();
          createCustomToast("Already verified", ToastType.info);
          return;
        }
        const message = "Failed to get authentication token";
        handleKYCError(message, e as Error);
        createCustomToast(handleKYCError(message, e as Error), ToastType.danger);
        console.error(message, e);
      } finally {
        emit("loaded");
      }
    };

    const handleReceiveMessage = (event: MessageEvent) => {
      window.removeEventListener("message", handleReceiveMessage, false);
      handleUpdateDialog(false); // close the dialog
      if (!event.data.status) console.error("Can't check the verification status", event.data);
      const status = (event.data.status as string).toLowerCase();
      if (status === "approved") {
        createCustomToast("Verification completed, Changes may take a few minutes to reflect", ToastType.success);
        kyc.updateStatus();
      } else if (status === "failed") createCustomToast("Verification failed, Please try again", ToastType.danger);
      else if (status === "unverified") createCustomToast("Verification canceled", ToastType.info);
    };
    window.addEventListener("message", handleReceiveMessage, false);
    onMounted(getToken);
    return {
      handleUpdateDialog,
      token,
    };
  },
};
</script>
