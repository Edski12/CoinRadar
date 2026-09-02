import { renderNav } from "./nav.js";
import { initChatWidget } from "./chatWidget.js?v=20260902-1";

document.addEventListener("DOMContentLoaded", () => {
  renderNav();
  initChatWidget();
});
