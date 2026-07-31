## PathSync AI

PathSync is a Vietnamese-first study-abroad planning workspace. It helps a student make a shortlist, turn each choice into a concrete application plan, collect documents, and use AI only as a drafting/counselling aid—not as an authority on admissions decisions.

### What is ready to experience

The frontend now has an explicit sample workspace, so the core journey remains usable even when the API stack is not running:

1. `cd frontend`
2. `npm install`
3. `npm run dev`
4. Open **Đăng nhập** and select **Khám phá workspace mẫu**.

The sample workspace is deliberately labelled. Its programme and scholarship entries are illustrative, so users must verify a university's official site before acting on dates, fees, requirements, or funding.

### Product journey

`Profile → explore / shortlist → application plan → documents → essay and mentor tools`

Each application is a plan with a deadline and tasks. “Fit” is a planning signal, not a prediction of admission.

### Architecture

- `frontend/`: React + Vite application. `src/services/api.js` is the only API boundary; `src/services/demoStore.js` provides the clearly scoped local sample workspace.
- `backend/`: historical Go services and gateway. They currently need to be run as a coordinated development stack and are not a production deployment model yet.

### Backend development

The existing gateway expects services on ports 8001–8006 and exposes them at `http://localhost:8000/api/v1`. Start it from `backend` with `go run .` after supplying the required environment variables (notably `JWT_SECRET`; AI features additionally need `GEMINI_API_KEY`).

Do not deploy the included SQLite databases or the legacy `backend/cmd/server` endpoint publicly: they are MVP development artefacts and do not provide the access-control and operational guarantees a real student-data product requires.
