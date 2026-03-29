# Green Ops

**High-reasoning AI agent for codebase decarbonization.**

Green Ops is an autonomous agent that audits your codebase for bloated dependencies, calculates the carbon cost of each, and recommends leaner native alternatives. It runs locally or as a GitHub Actions CI step, producing a structured Architect's Report on every push.

-----

## How It Works

```
SOUL.md + RULES.md  -->  System Prompt
                              |
                    Groq API (llama-3.3-70b)
                              |
                      Architect's Report
                              +
                    Carbon Delta Calculations
```

1. **Persona loading** -- `SOUL.md` and `RULES.md` are read at startup and merged into a single system prompt that defines the agent's behaviour and constraints.
2. **LLM analysis** -- The prompt is sent to Groq's `llama-3.3-70b-versatile` model via an OpenAI-compatible client. The model identifies high-impact dependency optimizations.
3. **Carbon calculation** -- Each optimization is run through `tools/carbon-calc.js`, which estimates per-install, monthly, and yearly CO2e savings using conversion factors from The Green Web Foundation.

---

## Project Structure

```
green-ops/
 ├── run.js                  # Agent entry point
 ├── SOUL.md                 # Agent persona & philosophy
 ├── RULES.md                # Behavioural guardrails
 ├── agent.yaml              # Model config & skill/tool registry
 ├── api/
 │   └── agent.js            # API layer
 ├── tools/
 │   └── carbon-calc.js      # CO2e savings calculator
 ├── skills/                 # Pluggable skill modules
 ├── knowledge/              # Knowledge base (YAML index)
 ├── memory/                 # Agent memory store
 └── .github/workflows/
     └── green-ops-audit.yml # CI workflow
```

---

## Quick Start

### Prerequisites

- **Node.js** >= 20
- A **Groq API key** ([console.groq.com](https://console.groq.com))

### Setup

```bash
# Clone the repo
git clone https://github.com/<your-username>/green-ops.git
cd green-ops

# Install dependencies
npm install

# Create a .env file with your API key
echo "GROQ_API_KEY=gsk_your_key_here" > .env
```

### Run

```bash
npm start
```

The agent will print an Architect's Report followed by sample carbon-delta calculations to stdout.

---

## CI / GitHub Actions

The included workflow (`.github/workflows/green-ops-audit.yml`) runs the agent on every push and PR to `main`. The report is posted to the **GitHub Actions Job Summary**.

To enable it, add your `GROQ_API_KEY` as a repository secret:

**Settings > Secrets and variables > Actions > New repository secret**

---

## Carbon Calculation Model

`tools/carbon-calc.js` uses two conservative conversion factors:

| Factor | Value | Source |
|---|---|---|
| Network transfer | 0.0002 g CO2e / KB | Green Web Foundation |
| CI build time | 0.012 g CO2e / second | Software Carbon Intensity literature |

**Example output:**

```
  [axios -> native fetch]
    Per-install savings : 0.02211 g CO2e
    Monthly savings     : 22.11 g CO2e
    Yearly savings      : 0.2653 kg CO2e
```

---

## Core Philosophy

- **Native over npm** -- If the platform provides it, use it. `fetch` over Axios, `Intl` over Moment, array methods over Lodash.
- **Every byte has a cost** -- Transfer weight maps to real-world energy. Smaller bundles = less carbon.
- **Show the delta** -- Every recommendation includes a measurable Before vs After metric.

---

## Dependencies

Only two runtime dependencies, both earned:

| Package | Purpose |
|---|---|
| `openai` | OpenAI-compatible client for Groq API |
| `dotenv` | Load `.env` into `process.env` |

---

## License

ISC
