# PolicyLens AI

Human-AI policy deliberation prototype. **It does not recommend implementing a policy.**

First slice: minimum wage · United States, United Kingdom, Canada, Australia.

## What is already working

1. Public datasets downloaded into `data/`
   - World Bank World Development Indicators (no API key)
   - ILOSTAT monthly minimum wage, PPP and local currency
   - FRED US federal hourly minimum wage
2. Policy events detected as year-on-year ILO increases of 8% or more, joined to World Bank outcomes
3. FastAPI: structure → 3-agent debate → Monte Carlo
4. Next.js workspace: Analyze, Debate, Simulation

## Run (two terminals)

```powershell
cd C:\Users\sbang\OneDrive\Desktop\researchh
python -m pip install -r apps/api/requirements.txt
python -m uvicorn app.main:app --app-dir apps/api --reload --port 8000
```

```powershell
cd C:\Users\sbang\OneDrive\Desktop\researchh\apps\web
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) and click **Analyze a policy**.

Refresh data later:

```powershell
python scripts/fetch_data.py
```

## API

- `GET /health`
- `GET /catalog`
- `GET /events`
- `POST /structure` `{ "text": "..." }`
- `POST /analyze` `{ "text": "...", "coverage_pct": 100, "compliance_pct": 85, "macro": "normal" }`
- `POST /simulate` `{ "country": "GBR", "magnitude_pct": 15, ... }`

## Not in this slice

Custom LLM training, all 13 agents, carbon pricing, or an “implement this” button.
