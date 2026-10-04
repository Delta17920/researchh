# PolicyLens AI

PolicyLens is a Human-AI policy deliberation prototype designed for structured, adversarial analysis of policy proposals. **It does not recommend implementing a policy. It forces disagreement.**

Unlike general-purpose AI models that summarize or act agreeable, PolicyLens uses specialized agents (Economic, Social, Red Team) to critique policies using **live web research (Tavily)** and **Monte Carlo macroeconomic simulations**.

## Tech Stack
- **Frontend**: Next.js (React) located in `apps/web`
- **Backend**: FastAPI (Python) located in `apps/api`
- **Intelligence**: Groq / Llama 3 (for structured extraction and adversarial debate)
- **Search**: Tavily (for live web evidence gathering)

## Running Locally

To run the full stack locally, you need two terminals.

### 1. Start the Python Backend (`apps/api`)
```powershell
cd apps/api
# Create a virtual environment and install requirements
python -m venv venv
.\venv\Scripts\activate
pip install -r requirements.txt

# Start the FastAPI server
uvicorn app.main:app --reload --port 8000
```

### 2. Start the Next.js Frontend (`apps/web`)
```powershell
cd apps/web
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Environment Variables

For the system to work optimally (live agents and live web search), you need to provide API keys to the Python backend. Create an `.env` file in `apps/api` (or set them in your terminal):

- `GROQ_API_KEY`: Required for the LLM agents to dynamically debate and extract domains. (Get from [console.groq.com](https://console.groq.com/keys))
- `TAVILY_API_KEY`: Required for the Red Team agent to pull live internet search evidence. (Get from [tavily.com](https://tavily.com))

If keys are missing, the backend will gracefully fall back to scripted/cached responses where possible.

## Deployment

Because this is a split-stack architecture, you must deploy the frontend and backend separately:
1. **Backend (FastAPI)**: Deploy `apps/api` to a service like Render, Heroku, or Railway. Add your `GROQ_API_KEY` and `TAVILY_API_KEY` to the environment variables.
2. **Frontend (Next.js)**: Deploy `apps/web` to Vercel. Set the environment variable `NEXT_PUBLIC_API_URL` to point to your deployed Python backend URL (e.g., `https://my-policylens-api.onrender.com`).

## Data
Public datasets are bundled in `apps/api/data/catalog.json` (World Bank, ILOSTAT, FRED). To refresh from scratch:
```powershell
python scripts/fetch_data.py
copy data\processed\catalog.json apps\api\app\catalog.json
```
