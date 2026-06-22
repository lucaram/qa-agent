export function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

export function formatDashboardValue(value) {
  if (value === null || value === undefined) return "Not available";
  if (Array.isArray(value)) return value.length === 0 ? "None" : value.join(", ");
  if (typeof value === "boolean") return value ? "Yes" : "No";

  return String(value);
}