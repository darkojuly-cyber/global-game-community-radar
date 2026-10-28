export function startupErrorMessage(error) {
  if (error instanceof Error) return error.message || error.name;
  if (typeof error === "string" && error.trim()) return error;
  if (error == null)
    return "Database process exited without an error description. Check .local/postgres-startup.log.";
  try {
    return JSON.stringify(error) || String(error);
  } catch {
    return String(error);
  }
}
