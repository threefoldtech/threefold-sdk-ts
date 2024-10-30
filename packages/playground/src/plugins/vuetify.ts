import "@mdi/font/css/materialdesignicons.css";
import "vuetify/styles";

import { createVuetify } from "vuetify";
import * as components from "vuetify/components";
import * as directives from "vuetify/directives";

const defaults = {
  VAlert: {
    variant: "tonal",
  },
  VProgressCircular: {
    size: 50,
    width: 7,
    color: "primary",
  },
  VBtn: {
    variant: "outlined",
    color: "primary",
    VIcon: {
      variant: "tonal",
    },
    VProgressCircular: {
      size: undefined,
      width: undefined,
      color: undefined,
    },
  },
  VCardActions: {
    VBtn: {
      variant: "outlined",
      color: "primary",
    },
  },
  VChip: {
    variant: "tonal",
    color: "primary",
    size: "small",
  },
  VDialog: {
    width: "min(900px, calc(100% - 50px)) ",
    attach: "#modals",
  },
};

const vuetify = createVuetify({
  defaults,
  components,
  directives,
  theme: {
    defaultTheme: "dark",
    themes: {
      dark: {
        dark: true,
        colors: {
          primary: "#1aa18f",
          secondary: "#74DDC3",
          title: "#1AA18F",
          disclaimer: "#4D776D",
          info: "#7de3c8",
          warning: "#FFCC00",
          link: "#5695ff",
          anchor: "#d4d4d4",
          disable: "#d4d4d4",
        },
        variables: {
          "footer-color-link": "#fff",
          "footer-color-header": "#74DDC3",
          "speed-chip": "#424242",
        },
      },
      light: {
        dark: false,
        colors: {
          background: "#f6f6f6",
          primary: "#1AA18F",
          info: "#1AA18F",
          secondary: "#14A1B8",
          anchor: "#000000",
          disable: "#d4d4d4",
        },
        variables: {
          "footer-color-link": "#333",
          "footer-color-header": "#1aa18f",
          "speed-chip": "#EEEEEE",
        },
      },
    },
  },
});

export default vuetify;
