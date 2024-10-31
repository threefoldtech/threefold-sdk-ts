import "mosha-vue-toastify/dist/style.css";
import "./global.scss";

import * as Sentry from "@sentry/vue";
import { createPinia } from "pinia";
import { createApp } from "vue";

import vuetify from "@/plugins/vuetify";

import { defineGlobals } from "./config";
import Monitor from "./Monitor.vue";
import router from "./router";
import { normalizeError } from "./utils/helpers";
const app = createApp(Monitor);

app.config.errorHandler = error => {
  console.error(
    "[Uncaught Error]\n" +
      `- Message: ${normalizeError(error, "Something went wrong in dashboard app but we couldn't fetch it.")}\n` +
      `- Stack: ${error && typeof error === "object" ? Reflect.get(error, "stack") : null}\n` +
      `- Constructor: ${error && typeof error === "object" ? error.constructor.name : null}`,
  );
};

if (window.env.ENABLE_TELEMETRY) {
  Sentry.init({
    app,
    dsn: window.env.SENTRY_DSN,
    integrations: [Sentry.browserTracingIntegration(), Sentry.replayIntegration()],
    release: process.env.VERSION,
    // Performance Monitoring
    tracesSampleRate: 1.0, //  Capture 100% of the transactions
    // Set 'tracePropagationTargets' to control for which URLs distributed tracing should be enabled
    tracePropagationTargets: ["localhost", /^https:\/\/yourserver\.io\/api/],
    // Session Replay
    replaysSessionSampleRate: 0.1, // This sets the sample rate at 10%. You may want to change it to 100% while in development and then sample at a lower rate in production.
    replaysOnErrorSampleRate: 1.0, // If you're not already sampling the entire session, change the sample rate to 100% when sampling sessions where errors occur.
  });
}

app.use(createPinia());
app.use(router);
app.use(vuetify);
defineGlobals(app);
app.provide("noAppVersion", "No version to show");

app.mount("#app");
