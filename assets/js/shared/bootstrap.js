import { renderNav } from "./nav.js";
import { initChatWidget } from "./chatWidget.js";

document.addEventListener("DOMContentLoaded", () => {
  renderNav();
  initChatWidget();
});
