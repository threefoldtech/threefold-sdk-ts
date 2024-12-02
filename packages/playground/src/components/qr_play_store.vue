<template>
  <div class="d-flex flex-column text-center align-center">
    <slot></slot>
    <div class="d-flex justify-center py-2">
      <QrcodeGenerator :data="props.qr" />
    </div>
    <div class="d-flex justify-center align-center my-4">
      <a
        v-for="app in apps"
        :key="app.alt"
        :style="{ cursor: 'pointer', width: '9rem' }"
        class="mx-2"
        :title="app.alt"
        v-html="app.src"
        :href="app.url"
        target="_blank"
      />
    </div>
  </div>
</template>
<script setup lang="ts">
const props = defineProps({
  qr: String,
  msg: String,
});

const apps = [
  {
    src: `<img width="140"  src="https://upload.wikimedia.org/wikipedia/commons/thumb/7/78/Google_Play_Store_badge_EN.svg/128px-Google_Play_Store_badge_EN.svg.png?20220907104002">`,
    alt: "Threefold Connect on Google Play Store",
    url: "https://play.google.com/store/apps/details?id=org.jimber.threebotlogin&hl=en&gl=US",
  },
  {
    src: `<img width="128"  src="https://upload.wikimedia.org/wikipedia/commons/thumb/9/91/Download_on_the_App_Store_RGB_blk.svg/128px-Download_on_the_App_Store_RGB_blk.svg.png?20180317110059"/>`,
    alt: "Threefold Connect on Apple App Store",
    url: "https://apps.apple.com/us/app/threefold-connect/id1459845885",
  },
];
</script>
<script lang="ts">
import { defineComponent } from "vue";

import QrcodeGenerator from "../components/qrcode_generator.vue";

export default defineComponent({
  name: "QRPlayStore",

  components: { QrcodeGenerator },
});
</script>
