import { createToast, type ToastContent, type ToastOptions, withProps } from "mosha-vue-toastify";
import type { Component } from "vue";

export enum ToastType {
  danger = "danger",
  default = "default",
  info = "info",
  success = "success",
  warning = "warning",
}

const darkModeColors = {
  danger: "#FF5252",
  default: "#313131",
  info: "#2196F3",
  success: "#1AA18F",
  warning: "#FFCC00",
};

const lightModeColors = {
  danger: "#FF5252",
  default: "#313131",
  info: "#2196F3",
  success: "#1AA18F",
  warning: "#FFCC00",
};

/**
 * Creates a custom toast notification.
 * @param {Component | string} customComponent - The Vue component or a string message for the toast.
 * @param {ToastType} type - The type of toast. (e.g. ToastType.warning).
 * @param {Record<string, unknown>} [componentProps] - (optional): Additional props to pass to the component.
 */
export function createCustomToast(
  customComponent: Component | string,
  type: ToastType,
  componentProps?: Record<string, unknown>,
) {
  const themeElement = document.getElementById("vuetify-theme-stylesheet");
  const theme = window.getComputedStyle(themeElement!).colorScheme;

  const colors = theme === "dark" ? darkModeColors : lightModeColors;

  const toastOptions: ToastOptions = {
    hideProgressBar: true,
    position: "top-right",
    timeout: 5000,
    showIcon: true,
    type,
    toastBackgroundColor: colors[type],
  };

  if (typeof customComponent === "string") {
    createToast(customComponent, toastOptions);
  } else {
    const component = withProps(customComponent as any, componentProps || {});
    const toast = createToast(component as ToastContent, toastOptions);
    componentProps!.toast = toast;
  }

  setTimeout(() => {
    // Change the colors of the icons/contents of all opened toast to be `tonal` as vuetify.
    const leftIcons = document.getElementsByClassName("mosha__icon");
    const closeIcons = document.getElementsByClassName("mosha__toast__close-icon");
    const contents = document.getElementsByClassName("mosha__toast__content");
    if (leftIcons && closeIcons && contents) {
      for (let index = 0; index < leftIcons.length; index++) {
        const svgIcon = leftIcons[index].children[0];
        svgIcon.classList.add(`mosha__icon__${theme}__${type}`);
        closeIcons[index].classList.add(`${theme}__${type}`);
      }

      for (let index = 0; index < contents.length; index++) {
        contents[index].classList.add(`${theme}__${type}`);
      }
    }
  }, 1);
}
