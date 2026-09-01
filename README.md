# PolicyLens AI

Human AI policy deliberation prototype. **It does not recommend implementing a policy.**

First slice: minimum wage · United States, United Kingdom, Canada, Australia.

The demo app is a **single Next.js project** in `apps/web`. Analysis, chat debate, and Monte Carlo all run as Next.js API routes. No Python server is required to host or demo.

## Deploy on Vercel (for the demo)

1. Push this repo to GitHub (already: `https://github.com/Delta17920/researchh`).
2. Go to [vercel.com/new](https://vercel.com/new) and sign in with GitHub.
3. **Import** `Delta17920/researchh`.
4. Set **Root Directory** to `apps/web` (click *Edit* next to Root Directory).  
   Framework should show **Next.js**. Leave build as default (`npm run build`).
5. Click **Deploy**. Wait ~1–2 minutes.
6. Open the `*.vercel.app` URL. Use **Analyze → Run analysis**.

No environment variables are needed.

If Root Directory is left as `.` the build will fail, because Next.js lives in `apps/web`.

## Run locally (one terminal)

```powershell
cd apps/web
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

Optional Python API (`apps/api`) still exists for research work. The Vercel demo does not use it.

## Data

Public datasets are bundled in `apps/web/data/catalog.json` (World Bank, ILOSTAT, FRED). Refresh from scratch with:

```powershell
python scripts/fetch_data.py
copy data\processed\catalog.json apps\web\data\catalog.json
```
