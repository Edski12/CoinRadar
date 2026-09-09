import { renderNav } from "./nav.js?v=20260909-2";
import { initChatWidget } from "./chatWidget.js?v=20260902-1";

document.addEventListener("DOMContentLoaded", () => {
  renderNav();
  initChatWidget();
});
