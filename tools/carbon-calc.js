/**
 * carbon-calc.js
 * Calculates estimated carbon savings from dependency optimizations.
 *
 * The model: each unnecessary dependency adds transfer weight (KB),
 * which maps to network energy, CI build energy, and CDN storage energy.
 * We use conservative conversion factors sourced from The Green Web Foundation
 * and peer-reviewed literature on software carbon intensity.
 */

// grams CO2e per KB transferred (network + edge compute)
const GRAMS_CO2_PER_KB = 0.0002;

// grams CO2e per second of CI build time
const GRAMS_CO2_PER_BUILD_SECOND = 0.012;

/**
 * calculateSavings
 *
 * @param {Object} params
 * @param {string} params.name           - Name of the dependency being removed or replaced.
 * @param {number} params.sizeKB         - Minified + gzipped size of the dependency in KB.
 * @param {number} params.buildTimeDelta - Estimated build-time reduction in seconds.
 * @param {number} [params.installsPerMonth=1000] - Approximate monthly installs / CI runs.
 * @returns {Object} Savings report with carbon delta in grams and kilograms.
 */
export function calculateSavings({
  name,
  sizeKB,
  buildTimeDelta,
  installsPerMonth = 1000,
}) {
  if (!name || typeof sizeKB !== "number" || typeof buildTimeDelta !== "number") {
    throw new Error(
      "calculateSavings requires: name (string), sizeKB (number), buildTimeDelta (number)"
    );
  }

  const transferSavingsPerInstall = sizeKB * GRAMS_CO2_PER_KB;
  const buildSavingsPerInstall = buildTimeDelta * GRAMS_CO2_PER_BUILD_SECOND;
  const totalPerInstall = transferSavingsPerInstall + buildSavingsPerInstall;
  const monthlyGrams = totalPerInstall * installsPerMonth;
  const yearlyGrams = monthlyGrams * 12;

  return {
    dependency: name,
    perInstallGramsCO2: parseFloat(totalPerInstall.toFixed(6)),
    monthlyGramsCO2: parseFloat(monthlyGrams.toFixed(4)),
    yearlyKgCO2: parseFloat((yearlyGrams / 1000).toFixed(4)),
    breakdown: {
      transferGramsPerInstall: parseFloat(transferSavingsPerInstall.toFixed(6)),
      buildGramsPerInstall: parseFloat(buildSavingsPerInstall.toFixed(6)),
    },
  };
}
