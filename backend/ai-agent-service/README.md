# AI Agent Service

* [ ]

As of the M1 merge, this service absorbed the old `ai-service` (port 8005),
which no longer exists. Four endpoints live here:

| Method | Path                        | What it does                                                   |
| ------ | --------------------------- | -------------------------------------------------------------- |
| POST   | `/api/v1/agent/counsel`   | Conversational agent (tool-backed: university search, roadmap) |
| POST   | `/api/v1/ai/sop-assist`   | SOP/essay writing suggestions and cliché rewrites             |
| POST   | `/api/v1/ai/smart-match`  | Tiers real DB programs into reach / target / safe              |
| POST   | `/api/v1/ai/essay-review` | Rubric feedback with verbatim evidence spans                   |

Every response embeds the same safety envelope: `schema_version`, optional
`citations`, `safety_notice`, and `degraded`. The envelope is flattened into the
top level of the JSON, so the frontend reads `response.schema_version`, not
`response.envelope.schema_version`.

## Prerequisites

- Go (this service was verified with the toolchain at `C:\Program Files\Go\bin`,
  which is **not on PATH** by default on this machine — see below)
- A Gemini API key, for anything other than degraded-mode testing
- Postgres + `university-service` on 8004, for `smart-match` only

## Configuration

Env vars are read from `backend/.env` (loaded via `godotenv` as `../.env`
relative to this directory), or from the real environment.

| Var                        | Default                   | Notes                                                   |
| -------------------------- | ------------------------- | ------------------------------------------------------- |
| `GEMINI_API_KEY`         | —                        | Absent → whole service runs degraded, never fabricates |
| `GEMINI_MODEL`           | `gemini-3.1-flash-lite` | Never hardcoded in a URL; override freely               |
| `AI_AGENT_SERVICE_PORT`  | `8006`                  |                                                         |
| `UNIVERSITY_SERVICE_URL` | `http://localhost:8004` | Used by the search tool                                 |

## Running

Go is installed but not on PATH on this machine. Prepend it first:

```powershell
$env:PATH = "C:\Program Files\Go\bin;$env:PATH"
cd backend\ai-agent-service
go run .
```

Expected startup lines — the second one tells you which mode you're in:

```
AI Agent Service running on port 8006
[AI] LLM provider ready                  # key found, real model calls
[AI] No LLM provider configured ...      # no key, degraded responses
```

To run the whole platform instead, use `backend\start.bat` (the AI service is
launched from there; the deleted `ai-service` has been removed from it).

## Two Windows gotchas before you test with curl

These affect the terminal only. If you're testing through the browser, skip to
[Testing from the browser](#testing-from-the-browser-instead-of-curl).

**1. `curl` is not curl.** In Windows PowerShell 5.1, `curl` is an alias for
`Invoke-WebRequest` and the flags below will fail. Use `curl.exe` explicitly, or
run these from Git Bash. Every example here is written for **Git Bash /
`curl.exe`**.

**2. Vietnamese text inside an inline `-d` argument gets mangled.** This one is
verified and it silently changes behaviour: passing `"Lập lộ trình nộp hồ sơ"` as
an inline `-d` string from Git Bash to `curl.exe` corrupts the diacritics on the
way through the Windows command line. The model still usually understands the
mojibake and answers in fluent Vietnamese, so the response *looks* right — but
`detectIntent` no longer matches the keyword `lộ trình`, so the request quietly
routes to the conversation path instead of the roadmap path. You get a plausible
essay-coaching reply and no `proposed_actions`.

Put non-ASCII request bodies in a file instead:

```bash
curl.exe -s -X POST http://localhost:8006/api/v1/agent/counsel \
  -H 'Content-Type: application/json' \
  --data-binary @testdata/roadmap_vi.json
```

ASCII-only bodies are unaffected, and the keyword list has English triggers for
every intent, so English examples are safe inline.

## Testing each feature

Requests go straight to 8006 below. Through the gateway, swap the host for
`localhost:8000` — the paths are identical, and the gateway now proxies
`/api/v1/ai/*` here rather than to the retired 8005.

### 1. `/ai/essay-review`

```bash
curl.exe -s -X POST http://localhost:8006/api/v1/ai/essay-review \
  -H 'Content-Type: application/json' \
  -d '{
    "prompt": "Why do you want to study Computer Science?",
    "content": "Growing up in Hanoi, I spent afternoons repairing my neighbours old radios. That curiosity became a habit of taking things apart until I understood them."
  }'
```

Expect a `rubric` array with four dimensions — `theme`, `specificity`,
`structure`, `clarity` — each carrying a `level` (`emerging` / `developing` /
`strong`), an `evidence_span`, and `advice`.

Two things worth checking, because they are the product's actual guarantees:

- **`evidence_span` must be a verbatim quote** from the essay you submitted. If
  it paraphrases, the grounding constraint in the prompt has regressed.
- **`advice` must describe a change, never perform it.** Replacement sentences
  in that field mean the model started writing the student's essay.

### 2. `/ai/sop-assist`

`action` is one of `improve`, `continue`, `intro`, `conclusion`.

```bash
curl.exe -s -X POST http://localhost:8006/api/v1/ai/sop-assist \
  -H 'Content-Type: application/json' \
  -d '{
    "action": "improve",
    "prompt": "Why do you want to study Computer Science?",
    "existing_content": "I have always been passionate about technology since a very young age. Computers are the future and I want to be part of that future."
  }'
```

Expect a `suggestion` string plus an `improvements` array. Feeding it deliberate
clichés (as above) is the quickest way to see it work — it should flag both
sentences and offer concrete rewrites.

Do **not** test this endpoint with `{}`. An empty prompt and empty draft make the
model reply with prose asking for input, which fails JSON parsing and drops the
handler into its raw-text fallback. That looks like a bug and isn't one.

### 3. `/ai/smart-match`

```bash
curl.exe -s -X POST http://localhost:8006/api/v1/ai/smart-match \
  -H 'Content-Type: application/json' \
  -d '{
    "gpa": 3.4,
    "ielts": 7.0,
    "toefl": 95,
    "work_exp": 2,
    "fields": ["Computer Science"],
    "target_countries": ["Canada"],
    "budget": 30000
  }'
```

**This endpoint needs Postgres and `university-service` on 8004.** It ranks only
programs that come back from the database — it will never invent a university.
With no data source reachable you get the honest empty answer:

```json
{"schema_version":"2026-08","degraded":true,"reach":[],"target":[],"safe":[]}
```

That response is correct behaviour, not a failure. But it also means the LLM
ranking path never executed, so it is **not** a passing test of this feature. To
exercise it for real you need seeded university and program rows; tiering reads
`min_gpa` and `min_ielts` off each program.

When it does have data, expect `reach` / `target` / `safe` arrays plus a
`citations` array built from the source URLs on those DB rows.

### 4. `/agent/counsel`

The conversational endpoint. It routes on keyword intent detection, so the
question you ask decides which path runs — and the three paths behave very
differently. Vietnamese and English both work.

**Intent: `university_search`** (triggers on `trường`, `university`, `program`,
`ngành`, `học phí`, `tuition`, `scholarship`, `học bổng`, `admission`)

```bash
curl.exe -s -X POST http://localhost:8006/api/v1/agent/counsel \
  -H 'Content-Type: application/json' \
  -d '{
    "session_id": "test-1",
    "messages": [{"role": "user", "content": "Find a university with a Computer Science program in Canada"}],
    "profile": {"gpa": 3.4, "budget": 30000}
  }'
```

Hits the university tool, so it needs 8004 like `smart-match` does. Without it,
you get a degraded reply that explicitly refuses to guess at admissions data.

**Intent: `roadmap`** (triggers on `lộ trình`, `roadmap`, `kế hoạch`,
`deadline`, `khi nào`, `timeline`)

```bash
# ASCII trigger — safe inline
curl.exe -s -X POST http://localhost:8006/api/v1/agent/counsel \
  -H 'Content-Type: application/json' \
  -d '{
    "session_id": "test-2",
    "messages": [{"role": "user", "content": "Build me a roadmap for Fall 2027 applications"}],
    "profile": {"gpa": 3.4}
  }'

# Vietnamese trigger — must come from a file, see gotcha 2 above
curl.exe -s -X POST http://localhost:8006/api/v1/agent/counsel \
  -H 'Content-Type: application/json' \
  --data-binary @testdata/roadmap_vi.json
```

Both route to `roadmap` and return the same shape. `testdata/roadmap_vi.json`
holds the Vietnamese payload `Lập lộ trình nộp hồ sơ cho kỳ Fall 2027`; sending
that same string inline instead is what produces the silent misroute.

Returns `proposed_actions`. These are deliberately **non-mutating** — the client
must show them and get confirmation before calling the owning service. Each one
carries `requires_confirmation: true`.

**Intent: `conversation`** (anything else — this is the only path that calls the
model directly)

```bash
curl.exe -s -X POST http://localhost:8006/api/v1/agent/counsel \
  -H 'Content-Type: application/json' \
  -d '{
    "session_id": "test-3",
    "messages": [{"role": "user", "content": "I am worried about my interview, how should I prepare?"}],
    "profile": {}
  }'
```

**Empty history** returns the welcome response without calling any model:

```bash
curl.exe -s -X POST http://localhost:8006/api/v1/agent/counsel \
  -H 'Content-Type: application/json' -d '{"messages": []}'
```

**Input handling — verified, and weaker than the struct tags suggest.** Only two
things actually return 400: more than 30 messages, or any message whose
`content` is empty/whitespace. Both are checked in code by `validateConversation`.

The `binding` tags on `agent.Message` are **not** enforced — gin does not
validate them on elements of a nested slice. Two consequences you will hit while
testing:

- An unrecognised `role` (e.g. `"system"`) returns **200**, not 400. The message
  is simply never seen as a user turn, so `latestUserMessage` finds nothing and
  you get the welcome response — the same output as an empty history.
- The `max=6000` cap on `content` is not applied. A 6100-char message returns
  **200** and is sent to the model.

Neither is new in the merge; both predate it. Worth knowing because a malformed
client looks healthy from the outside.

## Example questions by intent

Useful when you want to check that routing still works after touching
`detectIntent`:

| Question                                                  | Expected intent       |
| --------------------------------------------------------- | --------------------- |
| `Học phí ngành Data Science ở Úc là bao nhiêu?`  | `university_search` |
| `MIT scholarship programs`                              | `university_search` |
| `Khi nào mình nên bắt đầu xin thư giới thiệu?` | `roadmap`           |
| `timeline for Fall 2027 applications`                   | `roadmap`           |
| `Làm sao viết SOP hay?`                               | `conversation`      |
| `I'm nervous about my interview`                        | `conversation`      |

Send the Vietnamese rows from a file, not inline — see gotcha 2. Inline, they
route to `conversation` regardless of intent, which makes routing look broken
when it isn't. The English rows are safe inline. Cheapest check of all is
`go test ./...`, which asserts this table against `detectIntent` directly with no
shell in the way.

## Verifying degraded mode

The most important non-obvious behaviour: with no key, nothing is fabricated.
Unset the key and restart:

```powershell
$env:GEMINI_API_KEY = ""
go run .
```

Then every endpoint returns `"degraded": true` alongside a `safety_notice`, and
specifically:

- `essay-review` returns `score: 0` with **no rubric and no strengths** — it does
  not invent a grade
- `sop-assist` returns a static checklist, not model-generated advice
- `smart-match` falls back to arithmetic GPA tiering over real DB rows
- `agent/counsel` says it cannot reach its data rather than guessing

Note that `degraded` is `omitempty`, so a healthy response omits the field
entirely rather than sending `false`.

## Testing from the browser instead of curl

### Start order

Each step depends on the one above it, so do them in sequence and wait for each
to report ready.

**1. Postgres.** Needed for login and for `smart-match`. If it isn't running,
start it (service name `postgresql-x64-<version>` on Windows):

```powershell
Get-Service *postgres* | Select-Object Name, Status
```

**2. Backend services.** One window per service, from `backend\`:

```powershell
cd backend
.\start.bat
```

Six windows open: gateway 8000, auth 8001, application 8002, document 8003,
university 8004, AI agent 8006. Keep the AI Agent window visible — the
`llm.call` lines land there and it's how you confirm a click reached the model.

**3. Frontend.** New terminal:

```powershell
cd frontend
npm install    # first run only
npm run dev
```

Vite serves on `http://localhost:5173`. It calls `http://localhost:8000/api/v1`
by default (`api.js:4`), so no frontend `.env` is needed — `.env.docker` is for
containers and vite does not load it in dev.

Read the port off the startup banner rather than assuming 5173. If an older dev
server is still running, vite silently takes the next free port and prints
`Port 5173 is in use, trying another one...`, then serves on 5174. Both stay
alive, and the stale one keeps serving old code — which looks like your edits
stopped applying.

### Log in with a real account, not the demo button

This is the part that will waste your afternoon otherwise. The login page has a
**"Khám phá workspace mẫu (không cần tài khoản)"** / *"Explore a sample
workspace"* button. Do **not** use it for testing AI features.

That button sets `auth_token` to `pathsync-demo-token`, and `customFetch`
(`api.js:19-27`) short-circuits **every** request to `demoResponse()` before it
reaches the network. In demo mode the AI replies you see are hardcoded
Vietnamese strings in `demoStore.js:76-78` — a fixed `score: 72` for essay
review and one canned SOP suggestion. Nothing reaches 8006, nothing reaches
Gemini, and the UI looks completely healthy.

Register a real account instead, then log in with it. To leave a demo session,
clear `auth_token` from localStorage (DevTools → Application → Local Storage) or
log out.

### Which page exercises which endpoint

| Page (route)                       | Action in the UI                    | Endpoint                                  |
| ---------------------------------- | ----------------------------------- | ----------------------------------------- |
| Persona Lab (`/persona-lab`)     | Send a chat message                 | `/agent/counsel`                        |
| Essay Copilot (`/essay-copilot`) | Paste an essay, click send          | `/ai/essay-review`                      |
| Smart Match (`/smart-match`)     | Fill the 2-step form, click Analyze | `/ai/smart-match`                       |
| Applications (`/applications`)   | Open an application → SOP editor   | `/ai/sop-assist` + `/ai/essay-review` |

Persona Lab also fires `/agent/counsel` once on mount with an empty message
list, which returns the welcome response without calling the model. Seeing that
appear is a good sign the wiring is live before you type anything.

### What to click, per feature

**Persona Lab** — the intent table above applies here verbatim, and this is the
easiest way to see routing work. Type an English roadmap question
(`Build me a roadmap for Fall 2027`) and you get `proposed_actions` rendered as
confirm buttons. Type an interview-nerves question and you get plain
conversation. Typing in the browser has **no encoding problem** — gotcha 2 is
purely a Windows command-line artifact, so Vietnamese works fine here.

**Essay Copilot** — paste a short real paragraph, not lorem ipsum. You should
get the four-dimension rubric back, and every `evidence_span` should be a
sentence you can find in what you pasted.

**Smart Match** — the form maps to the same payload the curl example sends
(`api.js:274-285`). Needs seeded program rows; with an empty database you get
the honest empty result and three empty tiers.

**Applications → SOP editor** — sends `action: "suggest"`, which is not one of
the four documented actions. The prompt lists the valid four alongside it, so
the model still returns usable JSON, but it is a UI/handler mismatch worth
tidying if you touch that page.

### Confirming a click actually hit the model

Two places to look, and you want both to agree:

1. **DevTools → Network.** Filter on `api/v1`. You should see a real request to
   `localhost:8000/api/v1/...`. If the tab is empty when you click, you're in a
   demo session.
2. **The AI Agent Service window.** Every real model call prints one line:

   ```
   llm.call capability=essay model=gemini-3.1-flash-lite prompt_tokens=305 completion_tokens=600 latency_ms=2879
   ```

   No line means no model call — either degraded mode, a cache of a previous
   render, or the demo short-circuit.

Also check the response body in Network for `"degraded": true`. It's absent on
healthy responses, so if you see it, the service answered without the model and
the reply you're reading is static text.

### Works without Postgres

Handy when you only want to smoke-test the AI layer:

- **Fine without any database:** Essay Copilot, the SOP editor's suggestion
  button, and Persona Lab's conversation and roadmap paths.
- **Needs Postgres + university-service on 8004:** Smart Match, and Persona
  Lab's university-search intent. Both return the honest empty answer rather
  than inventing schools, so a blank result there is the service working
  correctly, not a failure.

Login itself needs Postgres, so "no database" in practice means you can still
reach these pages only if you already hold a valid token.

## Build, vet, test

```powershell
$env:PATH = "C:\Program Files\Go\bin;$env:PATH"
cd backend\ai-agent-service
go build ./...
go vet ./...
go test ./...
```

`go test ./...` covers `TestDetectIntent` (the intent routing table above) and
envelope flattening — the latter guards the frontend contract, since a
regression there would nest `schema_version` and silently break every caller.

## Cost and latency

Every model call logs one line. This is the only place per-call spend is visible:

```
llm.call capability=essay model=gemini-3.1-flash-lite prompt_tokens=305 completion_tokens=600 latency_ms=2879
```

`capability` is one of `counsel`, `extract`, `essay`, `match`, `sop`. Calls carry
a 20s timeout and retry twice on 5xx or timeout with 500ms backoff.

## Known gap

`llm/gemini.go` implements Gemini JSON mode, but it only activates when a caller
passes `JSONSchema` — and none of the three classic handlers currently do. They
ask for JSON in prompt text instead. It works with the current model, but a model
swap or a response wrapped in a `` ```json `` fence would drop every handler
into its raw-text fallback.
