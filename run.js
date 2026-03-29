/**
 * run.js -- Green Ops Autonomous Agent Entry Point
 *
 * Clawless architecture: no GitClaw SDK, direct Groq API interaction
 * via the OpenAI Node.js client library.
 */

import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { config } from "dotenv";
import OpenAI from "openai";
import { calculateSavings } from "./tools/carbon-calc.js";

// ---------------------------------------------------------------------------
// Environment
// ---------------------------------------------------------------------------
config();

const GROQ_API_KEY = process.env.GROQ_API_KEY;
if (!GROQ_API_KEY) {
  console.error("[FATAL] GROQ_API_KEY is not set. Export it or add it to .env");
  process.exit(1);
}

// ---------------------------------------------------------------------------
// OpenAI client pointed at the Groq inference endpoint
// ---------------------------------------------------------------------------
const client = new OpenAI({
  apiKey: GROQ_API_KEY,
  baseURL: "https://api.groq.com/openai/v1",
});

// ---------------------------------------------------------------------------
// Load persona files
// ---------------------------------------------------------------------------
function loadPersonaFiles() {
  const soulPath = resolve("SOUL.md");
  const rulesPath = resolve("RULES.md");

  const soul = readFileSync(soulPath, "utf-8");
  const rules = readFileSync(rulesPath, "utf-8");

  return [soul, rules].join("\n\n---\n\n");
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------
async function main() {
  // 1. Build the system prompt from local persona files
  let systemPrompt;
  try {
    systemPrompt = loadPersonaFiles();
  } catch (fileError) {
    console.error(
      "[ERROR] Failed to read persona files (SOUL.md / RULES.md):",
      fileError.message
    );
    process.exit(1);
  }

  // 2. Define the user-facing analysis prompt
  const userPrompt =
    "Analyze the current directory structure, identify 3 high-impact dependency " +
    "optimizations, and calculate the carbon delta for each.";

  // 3. Call the Groq API via the OpenAI-compatible client
  console.log("=".repeat(72));
  console.log("  GREEN OPS -- Architect's Report");
  console.log("=".repeat(72));
  console.log("[INFO] Sending analysis request to llama-3.3-70b-versatile ...\n");

  let response;
  try {
    response = await client.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      temperature: 0.1,
      max_tokens: 2048,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
    });
  } catch (apiError) {
    console.error("[ERROR] Groq API call failed:", apiError.message);
    process.exit(1);
  }

  const report = response.choices?.[0]?.message?.content;
  if (!report) {
    console.error("[ERROR] Received an empty response from the model.");
    process.exit(1);
  }

  console.log(report);

  // 4. Run a sample carbon-delta calculation to demonstrate the tool
  console.log("\n" + "-".repeat(72));
  console.log("  Carbon Delta Calculations (sample)");
  console.log("-".repeat(72));

  const sampleOptimizations = [
    { name: "axios -> native fetch",   sizeKB: 38.5,  buildTimeDelta: 1.2 },
    { name: "moment -> Intl.DateTimeFormat", sizeKB: 232, buildTimeDelta: 2.8 },
    { name: "lodash -> native Array/Object methods", sizeKB: 71.5, buildTimeDelta: 0.9 },
  ];

  for (const opt of sampleOptimizations) {
    const result = calculateSavings(opt);
    console.log(`\n  [${result.dependency}]`);
    console.log(`    Per-install savings : ${result.perInstallGramsCO2} g CO2e`);
    console.log(`    Monthly savings     : ${result.monthlyGramsCO2} g CO2e`);
    console.log(`    Yearly savings      : ${result.yearlyKgCO2} kg CO2e`);
  }

  console.log("\n" + "=".repeat(72));
  console.log("  Report complete.");
  console.log("=".repeat(72));
}

main();
