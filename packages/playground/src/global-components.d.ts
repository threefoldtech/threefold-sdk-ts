import type { NetworkEnv } from "@threefold/grid_client";

import CopyInputWrapper from "./components/copy_input_wrapper.vue";
import DTabs from "./components/dynamic_tabs.vue";
import Filters from "./components/filter.vue";
import FormValidator from "./components/form_validator.vue";
import InputTooltip from "./components/input_tooltip.vue";
import InputValidator from "./components/input_validator.vue";
import TfSelectCountry from "./components/node_selector/select_location_internals/TfSelectCountry.vue";
import TfSelectRegion from "./components/node_selector/select_location_internals/TfSelectRegion.vue";
import TfSelectionDetails from "./components/node_selector/TfSelectionDetails.vue";
import PasswordInputWrapper from "./components/password_input_wrapper.vue";
import ViewLayout from "./components/view_layout.vue";
import WebletLayout from "./components/weblet_layout.vue";
import type * as validators from "./utils/validators";
declare module "@vue/runtime-core" {
  export interface GlobalComponents {
    PasswordInputWrapper: typeof PasswordInputWrapper;
    WebletLayout: typeof WebletLayout;
    CopyInputWrapper: typeof CopyInputWrapper;
    DTabs: typeof DTabs;
    InputValidator: typeof InputValidator;
    FormValidator: typeof FormValidator;
    ViewLayout: typeof ViewLayout;
    InputTooltip: typeof InputTooltip;
    Filters: typeof Filters;
    TfSelectionDetails: typeof TfSelectionDetails;
    TfSelectRegion: typeof TfSelectRegion;
    TfSelectCountry: typeof TfSelectCountry;
  }

  interface ComponentCustomProperties {
    validators: typeof validators;
    MANUAL_URL: typeof MANUAL_URL;
  }
}

declare global {
  interface Window {
    $$appLoader: () => Promise<void>;
    $$showMonitorError: (urls: { [key: string]: string | null }) => void;
    $$monitorLock: Promise<void>;
    $$releaseMonitorLock(): void;
    env: {
      GRAPHQL_STACKS: string[];
      GRIDPROXY_STACKS: string[];
      SUBSTRATE_STACKS: string[];
      ACTIVATION_SERVICE_STACKS: string[];
      RELAY_STACKS: string[];
      STATS_STACKS: string[];
      NETWORK: NetworkEnv;
      GRAPHQL_URL: string;
      GRIDPROXY_URL: string;
      SUBSTRATE_URL: string;
      ACTIVATION_SERVICE_URL: string;
      RELAY_DOMAIN: string;
      BRIDGE_TFT_ADDRESS: string;
      STELLAR_NETWORK: string;
      STELLAR_HORIZON_URL: string;
      TFT_ASSET_ISSUER: string;
      MINTING_URL: string;
      STATS_URL: string;
      TIMEOUT: number;
      PAGE_SIZE: number;
      MANUAL_URL: string;
      SENTRY_DSN: string;
      ENABLE_TELEMETRY: boolean;
    };
  }
}
