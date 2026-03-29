/**
 * api/agent.js -- Serverless handler (Vercel-compatible)
 *
 * Clawless: no GitClaw SDK. Hits the Groq API directly
 * via the OpenAI client library.
 */

import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import OpenAI from "openai";
import { calculateSavings } from "../tools/carbon-calc.js";

// ---------------------------------------------------------------------------
// Groq client (reads GROQ_API_KEY from process.env automatically at cold start)
// ---------------------------------------------------------------------------
const client = new OpenAI({
  apiKey: process.env.GROQ_API_KEY,
  baseURL: "https://api.groq.com/openai/v1",
});

// ---------------------------------------------------------------------------
// Load persona files once per cold start
// ---------------------------------------------------------------------------
let systemPrompt;
try {
  const soul = readFileSync(resolve("SOUL.md"), "utf-8");
  const rules = readFileSync(resolve("RULES.md"), "utf-8");
  systemPrompt = [soul, rules].join("\n\n---\n\n");
} catch (err) {
  systemPrompt = null;
  console.error("[WARN] Could not load persona files:", err.message);
}

// ---------------------------------------------------------------------------
// Handler
// ---------------------------------------------------------------------------
export default async function handler(req, res) {
  if (req.method !== "POST" && req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  if (!process.env.GROQ_API_KEY) {
    return res.status(500).json({
      success: false,
      error: "GROQ_API_KEY is not configured in the environment.",
    });
  }

  if (!systemPrompt) {
    return res.status(500).json({
      success: false,
      error: "Persona files (SOUL.md / RULES.md) could not be loaded.",
    });
  }

  try {
    const userPrompt =
      "Perform a rapid efficiency audit. Identify one major dependency " +
      "to prune and calculate CO2 savings.";

    const completion = await client.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      temperature: 0.1,
      max_tokens: 2048,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
    });

    const report = completion.choices?.[0]?.message?.content;
    if (!report) {
      return res.status(502).json({
        success: false,
        error: "Model returned an empty response.",
      });
    }

    // Attach a sample carbon-delta calculation alongside the report
    const sampleDelta = calculateSavings({
      name: "axios -> native fetch",
      sizeKB: 38.5,
      buildTimeDelta: 1.2,
    });

    return res.status(200).json({
      success: true,
      report,
      carbonDelta: sampleDelta,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: error.message,
    });
  }
}
