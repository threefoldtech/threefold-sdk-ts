/** @type { HTMLDivElement } */
const appLoaderContainer = document.querySelector(".app-loader-dialog");

/** @type { HTMLDivElement } */
const loader = document.querySelector(".app-loader");

/** @type { HTMLSpanElement } */
const msgElement = document.querySelector(".app-loader-msg");

/** @type { HTMLButtonElement} */
const refreshBtn = document.querySelector(".app-loader-refresh");

/** @type { HTMLDivElement } */
const monitor = document.querySelector(".app-monitor-container");

/** @type { HTMLUListElement} */
const monitorList = document.querySelector(".app-monitor-status");

const slowConnectionTime = 60 * 1000;
const noConnectionTime = 120 * 1000;
const appLoaderContainerTime = 0.3 * 1000;
const welcomeMsgTime = (1 + appLoaderContainerTime / 1000) * 1000;

let t1 = setTimeout(function () {
  t1 = null;
  if (msgElement && msgElement.textContent) {
    msgElement.textContent = "Your connection seems to be slow, Please wait...";
  }
}, slowConnectionTime);

let t2 = setTimeout(function () {
  t2 = null;
  refreshBtn && refreshBtn.classList.add("active");
  if (msgElement) {
    msgElement.textContent = "Your connection seems to be broken, Please try again";
  }
}, noConnectionTime);

refreshBtn &&
  refreshBtn.addEventListener(
    "click",
    function () {
      window.onbeforeunload = null;
      window.location.reload();
    },
    { once: true },
  );

window.$$appLoader = () => {
  return new Promise(res => {
    refreshBtn && refreshBtn.classList.remove("active");
    t1 && clearTimeout(t1);
    t2 && clearTimeout(t2);

    loader && loader.classList.remove("active");
    if (msgElement) {
      msgElement.textContent = "Dashboard loaded. Welcome!";
    }

    setTimeout(() => {
      if (appLoaderContainer) {
        appLoaderContainer.classList.remove("active");
        setTimeout(() => {
          appLoaderContainer.remove();
          res();
        }, appLoaderContainerTime);
      }
    }, welcomeMsgTime);
  });
};
window.$$showMonitorError = urls => {
  if (msgElement) msgElement.classList.remove("active");

  if (monitor) monitor.classList.add("active");

  const monitorMsgElement = document.querySelector(".app-monitor-msg");
  if (monitorMsgElement) {
    monitorMsgElement.classList.add("active");
    monitorMsgElement.textContent = "Can't reach some services on provided stacks, Please try again";
  }

  if (monitorList) {
    monitorList.innerHTML = Object.entries(urls).map(createElement).join(" ");
  }
  refreshBtn && refreshBtn.classList.add("active");
};

function createElement([serviceName, serviceStatus]) {
  return `<li><div style="display:flex"><p class="service-name">${serviceName}</p> <p class="service-status service-${
    serviceStatus !== null ? "reachable" : "unreachable"
  }">${serviceStatus !== null ? "&#10003;" : "&#10007;"}</p></div></li>`;
}

/** @type { () => void } */
let _unlockMonitorLock;
window.$$monitorLock = new Promise(res => (_unlockMonitorLock = res));
window.$$releaseMonitorLock = () => _unlockMonitorLock();
