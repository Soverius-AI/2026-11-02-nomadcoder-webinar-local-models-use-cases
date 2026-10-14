# Rehearsal · 14 October 2026

- Pinned dependency installation and all workspace builds passed (Angular, Mastra, facility service, contracts).
- Agent-service tests: 41 passed. Facility/demo/policy tests: 13 passed.
- Live application prompt: “Show the highest air temperature for each shift manager.”
- The original OpenRouter/Jev workflow completed successfully and displayed three historian readings.
- Mastra Studio showed the successful four-step run `964d0696-9a32-4bcd-bd5f-710953e59102`, including generation, preflight, review and execution (9.69 seconds in this run).
- Rehearsal used the original checkout's environment file directly in the Mastra process. No credentials were copied here. To run independently, create this example's `.env` from `.env.example`.
- Frontend-tool and operator-approval prompts are documented but were not manually replayed in this rehearsal; their existing automated backend checks pass.
