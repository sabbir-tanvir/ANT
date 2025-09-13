// Runtime environment config (editable after build on server)
// Update BASE_URL and SITE_ID directly on the deployed server (e.g., cPanel) without rebuilding.
window._env_ = Object.assign({
  BASE_URL: "https://admin.ant2025.com", // default fallback
}, window._env_ || {});
