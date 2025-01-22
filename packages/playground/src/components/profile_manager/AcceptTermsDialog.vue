<template>
  <v-dialog :model-value="props.modelValue" persistent fullscreen width="100%" attach="#modals" id="terms-dialog">
    <!-- Content card -->
    <v-card id="terms-dialog__card-content" v-if="!loading">
      <v-card-text class="pa-15" v-html="acceptTermsContent" id="terms-dialog__text-content"></v-card-text>
      <div class="terms-footer" id="terms-dialog__footer">
        <v-btn
          class="mr-2"
          id="terms-dialog__go-back-button"
          @click="emit('update:modelValue', false)"
          v-show="!loading"
          :color="theme.name.value === AppThemeSelection.light ? 'black' : 'white'"
          :text="capitalize('go back')"
        />
        <v-btn
          id="terms-dialog__accept-button"
          @click="emit('onAccept')"
          v-show="!loading"
          :text="capitalize('accept terms and conditions')"
        />
      </div>
    </v-card>
    <!-- Loading card -->
    <v-card id="terms-dialog__card-loading" v-else :style="{ height: '100%' }">
      <v-card-text
        class="d-flex justify-center align-center"
        :style="{ height: '100%' }"
        id="terms-dialog__loading-content"
      >
        <v-progress-circular indeterminate id="terms-dialog__progress-indicator" />
      </v-card-text>
    </v-card>
  </v-dialog>
</template>
<script lang="ts" setup>
import { marked } from "marked";
import { capitalize, onMounted, ref } from "vue";
import { useTheme } from "vuetify";

import { AppThemeSelection } from "@/utils/app_theme";

const loading = ref(true);
const acceptTermsContent = ref("");
const theme = useTheme();

const props = defineProps({
  modelValue: {
    required: true,
    default: false,
    type: Boolean,
  },
});
const emit = defineEmits(["update:modelValue", "onAccept", "onError"]);

onMounted(async () => {
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
    console.error(error);
    emit("onError", "Something went wrong while loading terms and conditions, please try again");
  } finally {
    loading.value = false;
  }
});

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
</script>
