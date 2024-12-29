<template>
  <v-footer class="py-3 mainfooter mt-5">
    <v-container>
      <v-row justify="center" no-gutters>
        <v-col class="px-4" cols="12" md="4">
          <v-img
            :src="`${
              theme.name.value === AppThemeSelection.light
                ? baseUrl + 'images/logoTF_dark.png'
                : baseUrl + 'images/logoTF_light.png'
            }`"
            width="140px"
            @click="navigateToHome"
            class="clickable-logo"
          />
          <p class="mt-3 text-subtitle-2">
            A peer-to-peer open-source Internet platform that connects users directly with local Internet capacity.
          </p>
          <div>
            <a
              href="https://github.com/threefoldtech/tfgrid-sdk-ts"
              target="_blank"
              :style="{ color: 'rgb(var(--v-footer-color-link)) !important' }"
              ><v-btn color="anchor" icon="mdi-github" variant="text"></v-btn
            ></a>
            <a
              href="mailto:info@threefold.io"
              target="_blank"
              :style="{ color: 'rgb(var(--v-footer-color)) !important' }"
              ><v-btn color="anchor" icon="mdi-email-outline" variant="text"></v-btn
            ></a>
          </div>
        </v-col>
        <v-col class="mb-2" cols="12" sm="3" md="2">
          <p class="text-subtitle-1 footer_header" color="secondary">Take Action</p>
          <div>
            <a color="error" :href="manual.buy_sell_tft" class="app-link text-subtitle-2" target="_blank"
              >Buy the Token</a
            >
          </div>
          <div>
            <a :href="manual.farmers" class="app-link text-subtitle-2" target="_blank">Start Farming</a>
          </div>
          <div>
            <a :href="manual.governance" class="app-link text-subtitle-2" target="_blank">Governance</a>
          </div>
        </v-col>
        <v-col class="mx-3 mb-3" cols="12" sm="3" md="2">
          <p color="primary" class="text-subtitle-1 footer_header">About Us</p>
          <div>
            <a
              href="https://threefold.io/"
              color="anchor"
              variant="text"
              class="app-link text-subtitle-2"
              target="_blank"
              >ThreeFold</a
            >
          </div>
          <div>
            <a href="https://www.threefold.io/blog/" class="app-link text-subtitle-2" target="_blank">Blog</a>
          </div>
          <div>
            <a href="https://www.threefold.io/newsroom/" class="app-link text-subtitle-2" target="_blank">News Room</a>
          </div>
        </v-col>

        <v-col class="mx-3" cols="12" sm="3" md="2">
          <p class="text-subtitle-1 footer_header" color="secondary">Contact</p>
          <div>
            <a href="https://t.me/threefold" class="app-link text-subtitle-2" target="_blank">Main Chat</a>
          </div>
          <div>
            <a href="https://t.me/threefoldfarmers" class="app-link text-subtitle-2" target="_blank">Farming Chat</a>
          </div>
          <div>
            <a href="https://t.me/threefoldtesting" class="app-link text-subtitle-2" target="_blank">Grid User Chat</a>
          </div>
          <div>
            <a href="https://forum.threefold.io/" class="app-link text-subtitle-2" target="_blank">Forum</a>
          </div>
        </v-col>
      </v-row>
      <v-divider class="my-3 w-25 mx-auto" />

      <div class="mb-12 d-flex justify-center text-subtitle-2">
        <p>
          &#169; {{ new Date().getFullYear() }} ThreeFoldTech
          <span v-if="version !== noAppVersionMessage">
            <span class="mx-2">|</span>Version
            <span class="footer_header">
              {{ version }}
            </span></span
          >
        </p>
      </div>
    </v-container>
  </v-footer>
</template>

<script lang="ts" setup>
import { inject } from "vue";
import { useRouter } from "vue-router";
import { useTheme } from "vuetify";

import { DashboardRoutes } from "@/router/routes";
import { AppThemeSelection } from "@/utils/app_theme";
import { manual } from "@/utils/manual";

const theme = useTheme();
const version = process.env.VERSION;
const baseUrl = import.meta.env.BASE_URL;
const $router = useRouter();
const noAppVersionMessage = inject("noAppVersion");
function navigateToHome() {
  return $router.push(DashboardRoutes.Other.HomePage);
}
</script>
<script lang="ts">
export default {
  name: "mainFooter",
  data: () => ({
    icons: ["mdi-github", "mdi-email-outline"],
  }),
};
</script>
<style>
.clickable-logo:hover {
  cursor: pointer;
}
.v-footer {
  position: relative;
}

.mainfooter a {
  color: rgb(var(--v-footer-color-link)) !important;
}
.mainfooter a:hover {
  color: rgb(153, 153, 153) !important;
}

.footer_header {
  color: rgb(var(--v-footer-color-header)) !important;
  font-weight: 500;
}

@media only screen and (max-width: 992px) {
  .v-footer {
    text-align: center !important;
  }
  .v-img {
    margin: auto;
  }
}
</style>
