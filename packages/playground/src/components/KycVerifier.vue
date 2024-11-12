<template>
  <v-dialog opacity="0" :model-value="moduleValue">
    <v-dialog
      v-if="!loading && agreed && token"
      fullscreen
      :model-value="kycDialog"
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
    <v-dialog
      v-model="agreementDialog"
      @update:model-value="($event: boolean) => !$event ? handleUpdateDialog($event) : undefined"
      max-width="700"
    >
      <v-card>
        <v-card-title class="bg-primary d-flex align-center">
          <v-icon icon="mdi-security" />
          <div class="pl-2">Terms & Conditions</div>
        </v-card-title>

        <v-card-text class="pb-0">
          We use iDenfy to verify your identity.
          <br />
          Please ensure you review iDenfy’s <span class="font-weight-bold">Security and Compliance</span>, which
          includes their <span class="font-weight-bold">Terms & Conditions, Privacy Policy</span>, and other relevant
          documents.
          <v-checkbox hide-details v-model="agreedCheckbox">
            <template v-slot:label>
              <div>
                I have read and agreed to

                <a href="https://www.idenfy.com/security/" target="_blank" @click.stop> iDenfy Terms & Conditions</a>.
              </div>
            </template>
          </v-checkbox>
        </v-card-text>
        <v-card-actions class="justify-end my-1 mr-2">
          <v-btn color="anchor" @click="handleAgreementDialog(false)">Cancel</v-btn>
          <v-btn :disabled="!agreedCheckbox" @click="handleAgreementDialog(true)">Continue</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-dialog>
</template>
<script lang="ts">
import { KycErrors } from "@threefold/types";
import { onMounted, onUnmounted, ref } from "vue";

import { useKYC } from "@/stores/kyc";
import { createCustomToast, ToastType } from "@/utils/custom_toast";

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
  emits: ["update:moduleValue", "update:loading"],
  setup(props, { emit }) {
    const kyc = useKYC();
    const token = ref("");
    const kycDialog = ref(false);
    const agreementDialog = ref(true);
    const agreed = ref(false);
    const agreedCheckbox = ref(false);
    const handleUpdateDialog = (event: boolean) => {
      emit("update:moduleValue", event);
    };
    const handleAgreementDialog = (agreed: boolean) => {
      console.log("agreed", agreed);
      if (!agreed) handleUpdateDialog(false);
      else {
        agreementDialog.value = false;
        getToken();
      }
    };
    const handleUpdateLoading = (event: boolean) => {
      emit("update:loading", event);
    };
    const getToken = async () => {
      try {
        handleUpdateLoading(true);
        agreed.value = true;
        if (!kyc.client) throw new Error("KYC client is not initialized");
        await new Promise(r => setTimeout(r, 3000)); // wait for the dialog to be closed
        token.value = await kyc.client.getToken();
        window.addEventListener("message", handleReceiveMessage, false);
        kycDialog.value = true;
      } catch (e) {
        handleUpdateDialog(false);
        if (e instanceof KycErrors.AlreadyVerified) {
          kyc.updateStatus();
          createCustomToast("Already verified", ToastType.info);
          return;
        }
        createCustomToast((e as KycErrors.TFGridKycError).message, ToastType.danger);
        console.error(e);
      } finally {
        handleUpdateLoading(false);
      }
    };

    const handleReceiveMessage = async (event: MessageEvent) => {
      if (event.data?.status == undefined || event.data?.manualStatus == "waiting") return;
      window.removeEventListener("message", handleReceiveMessage, false);
      await new Promise(r => setTimeout(r, 5000)); // wait for the verification to be completed
      handleUpdateDialog(false); // close the dialog
      if (!event.data.status) console.error("Can't check the verification status", event.data);
      const status = (event.data.status as string).toLowerCase();
      if (status === "approved") {
        createCustomToast("Verification completed, Changes may take a few minutes to reflect", ToastType.success);
        kyc.updateStatus();
      } else if (status === "failed") createCustomToast("Verification failed, Please try again", ToastType.danger);
      else if (status === "unverified") createCustomToast("Verification canceled", ToastType.info);
    };
    onMounted(() => (agreementDialog.value = true));
    onUnmounted(() => window.removeEventListener("message", handleReceiveMessage, false));
    return {
      kycDialog,
      getToken,
      handleUpdateDialog,
      handleAgreementDialog,
      token,
      agreementDialog,
      agreed,
      agreedCheckbox,
    };
  },
};
</script>
