# Product Requirements Document

## 1. Product Title

**PolicyLens AI**

### Working research title

**A Multi-Agent Human–AI Framework for Cross-National Policy Deliberation and Unintended Consequence Analysis**

---

# 2. Product Vision

PolicyLens AI is a human-AI decision-support platform that allows a policymaker, researcher, organization, or citizen to propose a policy and receive a structured, evidence-grounded analysis from multiple specialized AI agents.

The system does not attempt to decide whether a policy should be implemented.

Instead, it answers:

> **What could happen if this policy is implemented, who could be affected, what assumptions are being made, what evidence supports or contradicts the proposal, and what unintended consequences could emerge?**

The system compares historical evidence across countries and allows multiple AI agents with competing objectives to deliberate before presenting their findings to a human decision-maker.

---

# 3. Core Philosophy

## Traditional policy analysis

Human proposes policy

↓

Experts independently analyze it

↓

Decision-maker reads reports

↓

Decision is made

↓

Consequences are observed later

---

## PolicyLens AI

Human proposes policy

↓

AI understands policy

↓

AI retrieves international evidence

↓

Multiple specialized agents analyze independently

↓

Agents challenge one another

↓

Quantitative impact models simulate scenarios

↓

Potential unintended consequences are identified

↓

Evidence and uncertainty are exposed

↓

Human makes final decision

---

# 4. Problem Statement

Policy decisions are frequently evaluated through isolated economic, social, political, environmental, or administrative perspectives.

This creates several problems:

1. Policy analysis is siloed.
2. Second-order effects are difficult to identify.
3. Historical experiences from other countries are underused.
4. Decision-makers may suffer from confirmation bias.
5. Vulnerable populations may be underrepresented in analysis.
6. The same policy can have radically different effects across socioeconomic contexts.
7. AI systems typically provide recommendations without adequately exposing disagreement, uncertainty, assumptions, or alternative outcomes.

PolicyLens AI addresses this by creating a **multi-agent adversarial policy deliberation environment**.

---

# 5. Target Users

### Primary

- Policy researchers
- Government/public-policy students
- Think tanks
- Researchers
- NGOs
- Academic institutions

### Secondary

- Journalists
- Economists
- Business analysts
- International organizations
- Corporate strategy teams

### Future

- Government decision-support systems
- Public consultation platforms
- Regulatory impact assessment systems

---

# 6. MVP Scope

The first version should NOT attempt to analyze every policy in every country.

### Initial countries

Start with:

- United States
- United Kingdom
- Canada
- Australia

Then expand to:

- Germany
- France
- Japan
- India
- Singapore
- EU

The architecture should remain country-agnostic.

OECD.AI already provides a useful multinational policy foundation covering more than 80 jurisdictions and organizations.

---

# 7. Initial Policy Domains

For the first research prototype, prioritize domains with measurable historical outcomes.

### Recommended MVP domains

1. Minimum wage / labor policy
2. Carbon pricing / environmental policy
3. Immigration policy
4. Taxation
5. Healthcare policy
6. Education policy
7. AI regulation

However, quantitative unintended-consequence simulation should initially focus on **2–3 domains**, rather than pretending the system can reliably simulate everything.

---

# 8. Core User Flow

## Step 1 — Policy Input

User enters:

> "Increase the minimum wage by 15% in Country X starting in 2027."

The user can optionally specify:

- country
- implementation date
- affected population
- policy magnitude
- duration
- exemptions
- geographic scope
- target objective

---

# 9. Policy Structuring Agent

The first agent converts natural language into a structured policy representation.

Example:

```text
Policy:
Minimum wage increase

Country:
United Kingdom

Magnitude:
+15%

Implementation:
2027

Target:
Low-wage workers

Duration:
Permanent

Primary objective:
Increase worker income
```

The agent also identifies missing information.

For example:

> "The policy does not specify whether young workers are exempt."

The system asks the user to clarify or explicitly marks it as an assumption.

---

# 10. Agent Architecture

The system should contain the following agents.

## Agent 1 — Policy Decomposition Agent

Responsibilities:

- understand policy
- extract parameters
- identify affected groups
- identify intended objectives
- identify policy mechanisms
- identify assumptions

Output:

```text
Policy Vector
```

---

# Agent 2 — Economic Impact Agent

Analyzes:

- GDP
- inflation
- employment
- wages
- productivity
- government expenditure
- business costs
- investment

Uses quantitative economic datasets.

---

# Agent 3 — Social Equity Agent

Analyzes:

- income distribution
- poverty
- inequality
- vulnerable populations
- demographic groups
- regional differences
- access to services

Its key question:

> "Who gains and who loses?"

---

# Agent 4 — Business & Market Agent

Analyzes:

- SMEs
- large businesses
- labor costs
- consumer prices
- investment
- competition
- market concentration

---

# Agent 5 — Environmental Agent

Used when relevant.

Analyzes:

- emissions
- energy use
- resource consumption
- environmental externalities
- climate impact

---

# Agent 6 — International Comparison Agent

This is one of the most important agents.

It asks:

> "Has a similar policy been implemented elsewhere?"

It retrieves:

- historical policies
- implementation dates
- countries
- magnitude
- outcomes
- failures
- modifications
- unintended effects

For example:

```text
Proposed:
UK +15% minimum wage

Historical comparisons:
Australia
Canada
USA
Germany
```

It then compares outcomes.

---

# Agent 7 — Historical Precedent Agent

Different from international comparison.

Its purpose is:

> Find policies that are structurally similar even if they have different names.

For example:

```text
Policy A:
15% minimum wage increase

Policy B:
10% minimum wage increase

Policy C:
20% wage floor increase
```

It builds a **policy similarity representation** rather than relying only on keyword matching.

---

# Agent 8 — Stakeholder Agent

Builds a stakeholder map.

Example:

```text
Workers
Employers
SMEs
Large corporations
Government
Consumers
Taxpayers
Regional governments
Vulnerable populations
```

For each stakeholder:

```text
Expected benefit
Expected cost
Risk
Confidence
```

---

# Agent 9 — Adversarial / Red-Team Agent

This is essential.

Its job is NOT to agree.

It receives the proposed policy and the analyses of the other agents.

It asks:

- What assumptions could be wrong?
- Which evidence contradicts the conclusion?
- Which population has been ignored?
- What second-order effects are missing?
- Which historical comparison is misleading?
- What happens under a recession?
- What happens if implementation is delayed?
- What happens if compliance is lower than expected?

The Red-Team Agent is deliberately optimized for **disagreement and failure discovery**.

---

# Agent 10 — Unintended Consequence Agent

This agent specifically searches for:

> **negative or adverse outcomes that are not part of the policy's stated objective.**

Example:

Policy objective:

> Increase worker income.

Potential unintended consequences:

```text
↑ worker wages

BUT

↑ employer labor cost
→ ↑ prices
→ ↓ demand
→ ↓ hiring
→ disproportionate effect on small businesses
```

The agent maps these chains.

---

# Agent 11 — Evidence Verification Agent

Every major claim should be checked.

It determines:

```text
Claim
↓
Source
↓
Evidence
↓
Date
↓
Country
↓
Applicability
↓
Confidence
```

The system should distinguish:

### Direct evidence

Actual historical observation.

### Correlational evidence

Observed relationship but not necessarily causal.

### Model inference

Prediction generated by a model.

### LLM reasoning

Reasoning without direct quantitative evidence.

This distinction is critical for research credibility.

---

# Agent 12 — Debate Moderator Agent

This agent controls the multi-agent discussion.

It:

- assigns speaking rounds
- detects duplicated arguments
- requests evidence
- asks agents to challenge claims
- identifies unresolved disagreements
- terminates debate when sufficient convergence is reached

It should NOT simply ask every agent to produce a long response.

---

# Agent 13 — Decision Synthesis Agent

Final output:

```text
Policy Assessment

Expected benefits
Expected costs
High-confidence effects
Low-confidence effects
Major risks
Unintended consequences
Stakeholders affected
International evidence
Agent disagreements
Scenario results
Alternative policies
```

The final result should explicitly state:

> **The system does not recommend implementation automatically.**

---

# 11. Data Architecture

The system should have five major data layers.

## Layer 1 — Policy Data

Contains:

- policy name
- country
- jurisdiction
- policy category
- implementation date
- policy parameters
- policy text
- legal status
- intended objectives

### Primary source

**OECD.AI Policy Navigator**

It currently contains 2,495 policy initiatives across more than 80 jurisdictions/organizations.

---

# Layer 2 — Country Indicators

Contains:

### Economy

- GDP
- GDP growth
- inflation
- unemployment
- productivity
- government expenditure

### Society

- poverty
- inequality
- population
- education
- health
- employment

### Environment

- emissions
- energy
- renewable energy

### Demographics

- age
- gender
- population structure

---

## Primary source

**World Bank World Development Indicators**

The World Bank API exposes nearly 16,000 indicator time series and can retrieve data programmatically without an API key.

This gives us cross-country longitudinal data.

---

# Layer 3 — National Government Data

## USA

Use:

**Data.gov**

Its catalog exposes a public API for searching government datasets.

---

## UK

Use:

**data.gov.uk / National Data Library**

It provides public-sector datasets across areas including:

- business
- economy
- government
- environment
- population
- health
- immigration
- transport

and provides APIs for dataset discovery/access.

ONS also provides an open API for programmatic access to UK statistics.

---

# Layer 4 — Historical Policy Outcomes

This is the most important dataset we will construct ourselves.

For every historical policy:

```text
Policy
Country
Start date
Policy magnitude
Target population
Pre-policy indicators
Post-policy indicators
Control variables
Observed outcomes
```

Example:

```text
Policy:
Minimum wage increase

Country:
UK

Magnitude:
+10%

Year:
2022

Before:
Employment = X
Inflation = Y
Median wage = Z

After:
Employment = A
Inflation = B
Median wage = C
```

This becomes the basis for quantitative simulation.

---

# Layer 5 — Evidence / Documents

Store:

- policy documents
- government reports
- research papers
- impact assessments
- parliamentary documents
- international reports
- historical evaluations

These go into a vector database.

---

# 12. Do We Need Custom Models?

## No custom LLM.

Use an existing foundation model for:

- reasoning
- extraction
- agent communication
- summarization
- debate

---

## But we SHOULD build custom predictive models.

This is where the actual ML research contribution can become strong.

### Model 1 — Policy Impact Predictor

Input:

```text
Policy parameters
+
country
+
baseline socioeconomic indicators
+
historical policy examples
```

Output:

```text
Predicted change in outcome variables
```

---

# Model 2 — Counterfactual / Scenario Model

This is more important.

The model estimates:

> What would likely have happened if the policy had NOT been implemented?

versus:

> What might happen if the policy IS implemented?

This gives:

```text
Baseline scenario
vs.
Policy scenario
```

---

# Model 3 — Stakeholder Impact Model

Predict:

```text
Policy
+
demographic group
+
economic conditions
```

→ expected impact.

Example:

```text
Low-income workers: +8
SMEs: -4
Large firms: -1
Government: +2
Consumers: -2
```

---

# Model 4 — Risk / Uncertainty Model

Rather than saying:

> "GDP will decrease by 1.3%."

the model should say:

```text
Expected:
-1.3%

Likely range:
-2.0% to -0.4%

Confidence:
Medium

Primary uncertainty:
Consumer demand response
```

This is much more scientifically defensible.

---

# 13. The Most Important Part:
# How Do We Actually Simulate Unintended Consequences?

We should **not** simply ask an LLM:

> "What unintended consequences could this policy have?"

That would be weak research.

Instead, build a **causal + scenario simulation layer**.

---

# 14. Policy Simulation Model

Represent the policy as:

```text
Policy
↓
Direct mechanism
↓
Intermediate variables
↓
Secondary effects
↓
Final outcomes
```

Example:

### Policy

Increase minimum wage by 15%.

### Direct effect

Worker wages ↑

### Intermediate effects

Labor cost ↑

↓

Business margins ↓

↓

Prices / hiring / investment change

↓

Employment and inflation change

---

# 15. Policy Impact Graph

Represent the relationships as a graph:

```text
                 Minimum Wage +15%
                        |
              +---------+---------+
              ↓                   ↓
        Worker Income ↑      Labor Cost ↑
              |                   |
              ↓             +-----+-----+
        Consumption ↑       ↓           ↓
                          Prices ↑    Hiring ↓
                             |           |
                             ↓           ↓
                         Inflation ↑  Employment ↓
```

This becomes the **Policy Causal Graph**.

The agents can propose candidate pathways.

The quantitative model determines whether those pathways have empirical support.

---

# 16. Counterfactual Simulation

For each policy, create:

### Scenario A — Baseline

What happens if the policy is not implemented?

### Scenario B — Proposed policy

What happens if the policy is implemented exactly as proposed?

### Scenario C — Conservative implementation

Policy impact is 50% of expected.

### Scenario D — Aggressive implementation

Policy impact is 150% of expected.

### Scenario E — Adverse macroeconomic condition

Simulate under recession/high inflation/etc.

---

# 17. Example

Suppose:

```text
Minimum wage:
+15%
```

The model could produce:

| Metric | Baseline | Policy | Difference |
|---|---:|---:|---:|
| Worker income | 100 | 112 | +12% |
| Employment | 100 | 98.5 | -1.5% |
| Consumer prices | 100 | 102 | +2% |
| SME profit | 100 | 96 | -4% |
| Government revenue | 100 | 101 | +1% |
| Poverty | 100 | 96 | -4% |

The policy's intended objective:

> Increase worker income.

Potential unintended consequences:

> SME profitability decreases.

> Consumer prices increase.

> Employment decreases under certain conditions.

---

# 18. What Counts as an Unintended Consequence?

We need a formal definition.

A candidate outcome is classified as an unintended consequence when:

### Condition 1

It is not an explicit policy objective.

AND

### Condition 2

The policy changes the outcome materially relative to the baseline.

AND

### Condition 3

The effect has sufficient evidence/model confidence.

AND preferably:

### Condition 4

The effect disproportionately affects a stakeholder or vulnerable population.

Therefore:

```text
Unintended Consequence Score
=
Magnitude
×
Probability
×
Affected Population
×
Confidence
×
Persistence
```

---

# 19. Core Metrics

Every simulated consequence should receive a score across several dimensions.

## 1. Impact Magnitude

How large is the predicted change?

Scale:

```text
0–100
```

---

## 2. Probability

How likely is the consequence?

```text
0–100%
```

---

## 3. Population Exposure

How many people/entities are affected?

```text
0–100
```

---

## 4. Distributional Impact

Does the effect disproportionately affect:

- low-income groups?
- minorities?
- elderly?
- young people?
- SMEs?
- rural populations?

```text
0–100
```

---

## 5. Time to Impact

```text
Immediate
Short-term
Medium-term
Long-term
```

---

## 6. Persistence

Does the effect disappear quickly?

```text
Temporary
Persistent
Structural
```

---

## 7. Reversibility

If the policy is removed, can the damage be reversed?

```text
High reversibility
Medium
Low
```

---

## 8. Evidence Confidence

```text
Very High
High
Medium
Low
Very Low
```

---

## 9. Cross-Country Consistency

Did similar effects occur in other countries?

```text
0–100
```

This is especially important for our multinational research.

---

# 20. Unintended Consequence Risk Score

We can eventually define:

```text
UCRS =
w1(Magnitude)
+
w2(Probability)
+
w3(Exposure)
+
w4(Distributional Impact)
+
w5(Persistence)
+
w6(Irreversibility)
+
w7(Cross-Country Evidence)
```

The weights should NOT simply be arbitrarily chosen.

We should conduct sensitivity analysis and potentially learn/calibrate them using historical policy outcomes and expert/user evaluation.

---

# 21. Scenario Matrix

The dashboard should show:

```text
                    Economic
                       ↑
                       |
        Positive       |       High Growth
        Social         |
                       |
-----------------------+----------------------→
                       |
        Risk           |       Market Risk
                       |
                       ↓
                    Social
```

Users can change assumptions and immediately see how risk changes.

---

# 22. Monte Carlo Simulation

Instead of one prediction:

```text
GDP = -1.2%
```

we sample uncertain parameters thousands of times.

For example:

```text
Consumer response:
0.4–0.8

Business response:
0.2–0.7

Employment elasticity:
-0.1 to -0.4
```

Run:

```text
10,000 simulations
```

Then output:

```text
Expected impact
5th percentile
25th percentile
Median
75th percentile
95th percentile
```

This gives the system a probability distribution rather than false precision.

---

# 23. Cross-Country Transfer

This is where the project becomes much more interesting academically.

Suppose:

```text
Policy implemented in USA
```

We retrieve comparable implementations in:

```text
UK
Canada
Australia
Germany
```

Then ask:

> "Does the historical effect transfer to the target country?"

The model considers:

```text
GDP structure
Population
Labor market
Inflation
Policy magnitude
Government capacity
Existing regulations
Demographics
Income distribution
```

Therefore:

> **Same policy ≠ same outcome.**

This should become one of the central research hypotheses.

---

# 24. Multi-Agent Debate Protocol

The agents should not debate endlessly.

Use structured rounds.

## Round 1 — Independent analysis

Each agent analyzes independently.

## Round 2 — Evidence challenge

Agents inspect other agents' claims.

## Round 3 — Counterargument

Each agent identifies at least one weakness in another analysis.

## Round 4 — Quantitative validation

Claims are checked against datasets/models.

## Round 5 — Red-team

Adversarial agent attacks the emerging consensus.

## Round 6 — Resolution

Agents classify each claim:

```text
Supported
Partially supported
Contradicted
Insufficient evidence
```

## Round 7 — Human synthesis

The human sees the disagreement and makes the final decision.

---

# 25. Website Architecture

## Frontend

Recommended:

**Next.js + TypeScript + Tailwind**

Pages:

### `/`

Landing page

### `/analyze`

Policy analysis workspace

### `/debate`

Live multi-agent debate

### `/simulation`

Scenario simulator

### `/countries`

Country comparison

### `/policies`

Historical policy explorer

### `/evidence`

Evidence explorer

### `/results`

Final policy assessment

---

# 26. Main Dashboard

The central UI should show:

```text
┌────────────────────────────────────────────┐
│ POLICY                                      │
│ Increase minimum wage by 15%               │
│ UK • 2027                                   │
└────────────────────────────────────────────┘

Overall Risk        62/100

Expected Benefit    74/100
Unintended Risk     58/100
Evidence Confidence 71/100

-----------------------------------------------

ECONOMIC       SOCIAL       BUSINESS
   68            82            51

-----------------------------------------------

TOP RISKS

1. Employment reduction
2. SME cost pressure
3. Consumer price increase

-----------------------------------------------

AGENT DEBATE

Economic       ████████████
Social         ███████████████
Business       █████████
Red Team       ████████████████
```

---

# 27. Live Debate Interface

Show:

```text
Economic Agent
↓
Social Agent
↓
Business Agent
↓
Red Team
↓
Moderator
```

Each statement should have:

- claim
- supporting evidence
- source
- confidence
- challenged/not challenged

The user should be able to click a claim and see the underlying evidence.

---

# 28. Simulation Interface

User controls:

```text
Policy magnitude       [15%]
Implementation date    [2027]
Duration               [Permanent]
Coverage               [100%]
Compliance              [80%]
Economic condition     [Normal]
```

Then:

**RUN SIMULATION**

Output:

```text
10,000 scenarios simulated

Median impact
Confidence interval
Worst 5%
Best 5%
```

---

# 29. Model Stack

## Foundation model

Used for:

- reasoning
- extraction
- agent communication
- debate
- summarization

No need to train from scratch.

---

## Embedding model

Used for:

- policy similarity
- document retrieval
- historical precedent matching

---

## Classification models

Potential custom models:

### Policy classifier

Policy → domain/category

### Stakeholder classifier

Policy → affected populations

### Evidence classifier

Claim → evidence quality

---

## Predictive models

Potential custom models:

### Policy Impact Model

Policy + country + baseline → outcome changes

### Counterfactual Model

Baseline → estimated no-policy outcome

### Risk Model

Outcome distribution → consequence probability

---

## Causal inference models

Depending on the selected policy domain:

- Difference-in-Differences
- Synthetic Control
- Interrupted Time Series
- Causal Forests
- Bayesian Structural Time Series
- Panel regression

We should **not use all of them**.

The exact method should depend on the policy dataset.

---

# 30. Data Pipeline

```text
Government APIs
       ↓
OECD Policy Data
       ↓
World Bank
       ↓
National Statistics
       ↓
Research Papers
       ↓
Policy Documents
       ↓
Data Cleaning
       ↓
Country Normalization
       ↓
Policy Normalization
       ↓
Feature Store
       ↓
PostgreSQL
       +
Vector Database
       ↓
AI Agents
       ↓
Simulation Models
       ↓
Dashboard
```

---

# 31. Database

Recommended:

### PostgreSQL

Tables:

```text
countries
policies
policy_parameters
policy_outcomes
economic_indicators
social_indicators
stakeholders
evidence_documents
claims
agent_arguments
simulations
simulation_results
consequences
```

Use:

### pgvector

for:

- policy embeddings
- document embeddings
- historical precedent retrieval

---

# 32. Evaluation Framework

This is essential for the eventual research paper.

We should evaluate four things separately.

## A. Agent reasoning

Measure:

- factual accuracy
- evidence grounding
- argument quality
- contradiction detection

---

## B. Quantitative prediction

Measure:

- MAE
- RMSE
- MAPE
- R²

where appropriate.

---

## C. Counterfactual quality

Compare:

```text
Predicted outcome
vs.
historically observed outcome
```

on historical policies.

---

## D. Human decision improvement

This could become the strongest experiment.

Take human participants.

### Group A

Makes policy assessment without AI.

### Group B

Uses conventional LLM assistance.

### Group C

Uses PolicyLens multi-agent system.

Compare:

- decision accuracy
- identification of risks
- identification of unintended consequences
- evidence usage
- confidence calibration
- diversity of alternatives considered

If Group C performs significantly better, we have evidence that:

> **Structured multi-agent human-AI deliberation improves decision quality.**

That is much stronger than merely demonstrating a website.

---

# 33. Research Hypotheses

### H1

Multi-agent deliberation identifies more policy risks than single-agent LLM analysis.

### H2

Cross-national historical evidence improves policy-impact estimation compared with country-only evidence.

### H3

Adversarial agents improve identification of unintended consequences.

### H4

Quantitative counterfactual simulation reduces unsupported LLM claims.

### H5

Human decision-makers using the proposed framework identify more unintended consequences than humans using conventional AI assistance.

---

# 34. MVP Development Order

Do NOT build all agents simultaneously.

## Phase 1

Build:

```text
Policy Input
↓
Policy Decomposition
↓
RAG
↓
3 agents
↓
Debate
↓
Result dashboard
```

Agents:

1. Economic
2. Social
3. Red-Team

---

## Phase 2

Add:

4. International Comparison
5. Stakeholder
6. Evidence Verification
7. Moderator

---

## Phase 3

Build quantitative models.

Start with **one policy domain**.

For example:

> Minimum wage policy.

Build:

```text
Historical policy dataset
↓
Counterfactual model
↓
Impact prediction
↓
Unintended consequence detection
```

---

## Phase 4

Add second domain.

For example:

> Carbon pricing.

Now test whether the architecture generalizes.

---

## Phase 5

Add more countries.

---

# 35. What We Should NOT Do

### Don't

Train a huge LLM.

### Don't

Claim that LLM reasoning is a causal simulation.

### Don't

Generate fake numerical predictions.

### Don't

Treat every correlation as causation.

### Don't

Allow agents to cite evidence without verification.

### Don't

Give the system authority to say:

> "Implement this policy."

Instead:

> **"Here are the expected effects, risks, uncertainties, competing arguments, and evidence. The final decision remains human."**

This is critical for the **human-AI collaboration** framing.

---

# 36. Final Product Concept

The finished system should feel less like:

> **ChatGPT for policy**

and more like:

> **A virtual policy deliberation room containing economists, social scientists, businesses, environmental analysts, international-policy experts and an adversarial red-team — all grounded in real international data and forced to challenge each other's reasoning before a human makes the final decision.**

That is the product.

And the research contribution can then become:

> **Does structured multi-agent human-AI deliberation, combined with cross-national evidence and quantitative counterfactual simulation, improve the identification of unintended consequences and the quality of human policy decisions?**

That is a substantially stronger research question than simply asking whether an LLM can analyze a policy.

---

# 37. Recommended Initial Technology Stack

### Frontend

Next.js  
TypeScript  
Tailwind  
Recharts / D3

### Backend

Python  
FastAPI

### Agent orchestration

LangGraph

### LLM

An API-based frontier/open-weight model initially

### ML

PyTorch  
scikit-learn  
XGBoost / LightGBM where appropriate

### Database

PostgreSQL  
pgvector

### Data

OECD.AI  
World Bank WDI  
US Data.gov  
UK Data.gov.uk / ONS  
Additional national statistical sources

### Infrastructure

Docker  
Cloud deployment

---

# 38. The Most Important Architectural Principle

The system has **three different intelligence layers**:

### Layer 1 — Generative intelligence

"What could happen?"

LLM agents.

### Layer 2 — Empirical intelligence

"What does historical data actually show?"

Statistical/ML models.

### Layer 3 — Counterfactual intelligence

"What might have happened if the policy were different?"

Causal inference + scenario simulation.

The system becomes credible only when these three layers **cross-check each other**.

```text
              HUMAN POLICY
                   ↓
          POLICY DECOMPOSITION
                   ↓
        ┌──────────┼──────────┐
        ↓          ↓          ↓
       LLM       DATA       CAUSAL
      AGENTS    EVIDENCE    MODELS
        ↓          ↓          ↓
        └──────────┼──────────┘
                   ↓
             AGENT DEBATE
                   ↓
              RED TEAM
                   ↓
        UNINTENDED CONSEQUENCES
                   ↓
          SCENARIO SIMULATION
                   ↓
       EVIDENCE + UNCERTAINTY
                   ↓
            HUMAN DECISION
```

## Bottom line

**Yes, this is buildable.** More importantly, we now have a path where the **website is not just a frontend demo**: it can become the experimental platform for the paper.

The biggest technical challenge is **not the multi-agent system**. That's relatively straightforward.

The hard and valuable part is building a defensible **historical policy → outcome → counterfactual → unintended-consequence dataset and evaluation methodology**. That's also where your actual research novelty can live.

For the first implementation, I would therefore **freeze the architecture but deliberately restrict the quantitative engine to one policy domain and 4 countries**. Once that works, we generalize it.