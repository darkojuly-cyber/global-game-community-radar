// Explicit local .env fields take precedence over unrelated Windows-wide keys.
// This helper never logs or returns credential values to the browser.
/** @param {Record<string,string>} values
 * @param {Record<string,string|undefined>} environment */
export function applyLocalAiConfig(values, environment = process.env) {
  for (const name of ["OPENAI_API_KEY", "OPENAI_MODEL"])
    if (Object.hasOwn(values, name))
      environment[name] = String(values[name]).trim();
}
