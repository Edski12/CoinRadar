const apiBaseInput = document.getElementById("apiBaseUrl");
const saveButton = document.getElementById("saveSettingsBtn");
const statusText = document.getElementById("settingsStatus");

apiBaseInput.value =
  window.COINRADAR_API_BASE_URL ||
  localStorage.getItem("coinRadarApiBaseUrl") ||
  "http://localhost:3000";

saveButton.addEventListener("click", () => {
  localStorage.setItem("coinRadarApiBaseUrl", apiBaseInput.value.trim());
  statusText.textContent =
    "Saved. Add window.COINRADAR_API_BASE_URL before shared scripts in production, or reload to use this local setting.";
});
