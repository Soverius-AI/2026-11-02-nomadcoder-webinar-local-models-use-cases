# 05 · AG-UI with Mastra, CopilotKit and Jev

The AI DevCraft incident-management example, reused with its original **OpenRouter** setup. The Angular application, facility service and Mastra Studio run locally. Main-agent and SQL-generation prompts go to OpenRouter (`google/gemma-4-31b-it` by default); SQL review goes to the hosted `typesafe/jev-1.13` decisions endpoint. This example demonstrates application integration, not offline inference.

## Run

Working directory: `examples/05-ag-ui`. Use Node.js 24 or newer and pnpm 11.19.0 (declared in package.json).

```sh
pnpm install --frozen-lockfile
```

Copy `.env.example` to `.env` and set `OPENROUTER_API_KEY`. No keys have been copied from AI DevCraft. The same key is used for generation and Jev. Keep the other settings at their defaults for the frontend proxy to work.

```sh
pnpm dev
```

Open the application at http://localhost:4300 and Mastra Studio at http://localhost:4211. The facility service uses http://127.0.0.1:3101. This keeps the original demo ports; examples 01 and 02 still use 4200.

The SQLite databases are created inside this example, separate from the original AI DevCraft checkout. Stop with Ctrl+C. To reset this copy's facility data, stop the demo and run `pnpm reset:demo`; then start it again. Mastra traces are retained separately in `apps/agent-service/data`.

## Demo

1. Open the application and Mastra Studio side by side.
2. Ask **Show the highest air temperature for each shift manager.**
3. Follow the progress card: SQL generation → deterministic SQL check → Jev review → validation and execution. Show the result in the application's reading table.
4. In Studio, open the historian workflow and the recorded run/trace. Inspect each step's inputs and outputs, particularly the proposed SQL and the three Jev decisions. If demonstrating the workflow directly in Studio, use its input schema; the application run remains the end-to-end AG-UI demonstration.
5. Ask **Switch to the reading log and filter to the Cooling room.** Show how frontend tools update the existing UI.
6. Optional: **Raise an alarm for the Packaging hall air temperature because I want the operator to investigate.** Reject the first proposal; repeat and approve it, then show the audit record.

These are model-driven demonstrations: rehearse the prompts with the configured model. A provider error or declined review must remain visible; it is not a successful SQL execution.

## Code to explain

- `apps/angular-host/src/app/domains/facility/feat-dashboard/agent/connect-facility-agent.ts`: connect UI state and frontend tools.
- `apps/facility-service/src/copilot-runtime.ts`: CopilotKit runtime and Mastra AG-UI bridge.
- `apps/agent-service/src/mastra/agents/main/agent.ts`: main agent and its tools.
- `apps/agent-service/src/mastra/workflows/historian-query/workflow.ts`: visible four-step workflow.
- `apps/agent-service/src/mastra/workflows/historian-query/agents/jev-sql-reviewer.ts`: hosted Jev decisions; all three checks must pass.
- `apps/agent-service/src/mastra/index.ts`: Studio workflow registration and persisted observability.

AG-UI carries the conversation and tool interactions; Mastra owns workflow execution. Deterministic SQL restrictions and human approval are separate checks, not guarantees supplied by the model.

## Verify

```sh
pnpm build
pnpm --filter @packt-workshop/agent-service test
node --test apps/facility-service/test/demo.test.mjs apps/facility-service/test/historian-policy.test.mjs
```

Builds and automated tests do not verify live OpenRouter access. See [source provenance](SOURCE.md).
