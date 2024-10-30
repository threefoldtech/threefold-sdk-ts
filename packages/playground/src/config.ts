import {
  ActivationMonitor,
  GraphQLMonitor,
  GridProxyMonitor,
  RMBMonitor,
  ServiceUrlManager,
  StatsMonitor,
  TFChainMonitor,
} from "@threefold/monitoring";
import { marked } from "marked";
import { type App, type Component, defineAsyncComponent } from "vue";

import * as validators from "./utils/validators";

const GLOBAL_COMPONENTS: { [key: string]: Component } = {
  PasswordInputWrapper: defineAsyncComponent(() => import("./components/password_input_wrapper.vue")),
  WebletLayout: defineAsyncComponent(() => import("./components/weblet_layout.vue")),
  CopyInputWrapper: defineAsyncComponent(() => import("./components/copy_input_wrapper.vue")),
  DTabs: defineAsyncComponent(() => import("./components/dynamic_tabs.vue")),
  InputValidator: defineAsyncComponent(() => import("./components/input_validator.vue")),
  FormValidator: defineAsyncComponent(() => import("./components/form_validator.vue")),
  ViewLayout: defineAsyncComponent(() => import("./components/view_layout.vue")),
  InputTooltip: defineAsyncComponent(() => import("./components/input_tooltip.vue")),
  Filters: defineAsyncComponent(() => import("./components/filter.vue")),
  TfSelectionDetails: defineAsyncComponent(() => import("./components/node_selector/TfSelectionDetails.vue")),
  TfSelectRegion: defineAsyncComponent(() => import("./components/node_selector/select_location_internals/TfSelectRegion.vue")), // prettier-ignore
  TfSelectCountry: defineAsyncComponent(() => import("./components/node_selector/select_location_internals/TfSelectCountry.vue")), // prettier-ignore
};

export function defineGlobals(app: App<Element>): void {
  defineGlobalComponents(app);
  defineGlobalProps(app);

  marked.use({
    renderer: {
      heading(text, level) {
        const margin = Math.max(7 - level, 3);
        return `<h${level} class="text-h${level} mb-${margin}">${text}</h${level}>`;
      },
      list(body) {
        return `<ul style="list-style: none;padding: 10px;">${body}</ul>`;
      },
      blockquote(quote) {
        return `
          <blockquote class="md-blockquote">
            <p>${quote}</p>
          </blockquote>
        `;
      },
      link(href, title, text) {
        const t = title ? `title="${title}"` : "";
        const h = `href="${href}"`;
        return `<a class="app-link" target="_blank" ${t} ${h}>${text}</a>`;
      },
    },
  });
}

function defineGlobalComponents(app: App<Element>) {
  for (const key in GLOBAL_COMPONENTS) {
    app.component(key, GLOBAL_COMPONENTS[key]);
  }
}

function defineGlobalProps(app: App<Element>) {
  app.config.globalProperties.validators = validators;
  app.config.globalProperties.MANUAL_URL = window.env.MANUAL_URL;
}

/**
 * Configures global environment variables based on available service URLs.
 *
 * This asynchronous function initializes a `ServiceUrlManager` with a set of predefined services and their URLs.
 * It then retrieves the available service stacks and updates the global `window.env` object with the URLs for each service.
 * If any service URLs are not available, an error is displayed and the function returns `false`.
 * If all service URLs are successfully retrieved and set, the function returns `true`.
 *
 * @returns A promise that resolves to `true` if all service URLs are successfully set, or `false` if any service URL is missing.
 */
export async function setGlobalEnv() {
  const { GRIDPROXY_STACKS, GRAPHQL_STACKS, STATS_STACKS, RELAY_STACKS, SUBSTRATE_STACKS, ACTIVATION_SERVICE_STACKS } =
    window.env;
  const urlManger = new ServiceUrlManager({
    services: [
      { URLs: GRIDPROXY_STACKS, service: new GridProxyMonitor() },
      { URLs: GRAPHQL_STACKS, service: new GraphQLMonitor() },
      { URLs: STATS_STACKS, service: new StatsMonitor() },
      { URLs: SUBSTRATE_STACKS, service: new TFChainMonitor() },
      { URLs: ACTIVATION_SERVICE_STACKS, service: new ActivationMonitor() },
      { URLs: RELAY_STACKS, service: new RMBMonitor() },
    ],
    silent: true,
  });
  const result = await urlManger.getAvailableServicesStack();

  if (Object.values(result).includes(null)) {
    window.$$showMonitorError(result);
    return false;
  }
  const { GridProxy, Stats, TFChain, GraphQl, Activation, RMB } = result;

  window.env.GRIDPROXY_URL = GridProxy!;
  window.env.STATS_URL = Stats!;
  window.env.GRAPHQL_URL = GraphQl!;
  window.env.SUBSTRATE_URL = TFChain!;
  window.env.ACTIVATION_SERVICE_URL = Activation!;
  window.env.RELAY_DOMAIN = RMB!;
  return true;
}
