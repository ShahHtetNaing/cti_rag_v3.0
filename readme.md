# CTI RAG Assistant v3.0

A Cyber Threat Intelligence (CTI) Retrieval-Augmented Generation assistant designed to help security analysts research cyber threats, vulnerabilities, incidents, and phishing-related information using retrieved, cited evidence — never unsupported model memory.

**Live website:** [https://cti-rag-v3-0.vercel.app/](https://cti-rag-v3-0.vercel.app/)
(publicly accessible while the author's backend runtime is running — no keys or login needed for visitors)

---

## Quick Start for Markers / Re-runners

There are two ways to try the assistant:

1. **Use the deployed website** — open the link above. It works as long as the
   author's Colab/Kaggle runtime is alive. No keys required.
2. **Re-run the notebook yourself** — you only need your own **free `HF_TOKEN`**
   ([huggingface.co → Settings → Access Tokens](https://huggingface.co/settings/tokens))
   added in the Colab **Secrets** panel or Kaggle **Add-ons → Secrets**. Run all
   cells, then use the **Upgraded UI Gradio (Ver-3)** interface — the final
   version of the in-notebook app. It also prints a temporary public
   `https://*.gradio.live` link — a real web UI backed by your own runtime,
   shareable for ~72 hours.

`CTI_ACCESS_KEY`, `NGROK_AUTHTOKEN`, and `THREATCLUSTER_API_KEY` are **not**
needed to re-run — they only serve the public API for the author's deployment.
The final API-serving cell detects missing secrets and skips itself with an
explanation instead of failing.

The notebook file itself contains **no credentials** — every secret is read at
runtime, auto-detecting the platform: environment variables → Colab Secrets →
Kaggle Secrets. The same file runs on either platform with no code changes.

---

## How to Run the Program

Follow these steps in order to start the CTI RAG Assistant.

### Step 1: Open the Notebook

1. Open this GitHub repository.
2. Navigate to the `notebook` folder.
3. Download the notebook:

   `notebook/CTI_RAG_Assistant.ipynb`

4. Open [Google Colab](https://colab.research.google.com/).
5. Select **File → Upload notebook**.
6. Upload `CTI_RAG_Assistant.ipynb`.

*(Kaggle is also supported as a backup runtime: import the notebook, enable
Internet in Session options, and select a GPU accelerator. A phone-verified
account is required for Kaggle internet access.)*

### Step 2: Configure the Runtime

For faster processing, configure the Google Colab runtime before executing the notebook.

1. Open the notebook in Google Colab.
2. Select **Runtime → Change runtime type**.
3. Under **Hardware accelerator**, select **T4 GPU**, if available.
4. Enable or select **High-RAM** if the option is available in your Colab account and runtime settings.
5. Click **Save**.

**Recommended configuration:**

| Setting | Recommended option |
|---|---|
| Runtime environment | Google Colab (Kaggle supported as backup) |
| Hardware accelerator | T4 GPU |
| System RAM | High-RAM, if available |
| Notebook | `CTI_RAG_Assistant.ipynb` |

**Important:** T4 GPU and High-RAM availability depends on your platform plan, usage limits, and available resources. A GPU does not automatically accelerate every operation; retrieval, embedding, and language generation may use different resources.

### Step 3: Configure Secrets and API Keys

Before running the notebook, configure the required secrets.

**On Colab:** open the **Secrets** panel (key icon).
**On Kaggle:** open **Add-ons → Secrets**.

| Secret | Purpose | Required? |
|---|---|---|
| `HF_TOKEN` | Hugging Face access for downloading the Gemma model and datasets | **Yes** — free token from your own HF account |
| `NGROK_AUTHTOKEN` | Starts the public tunnel so the deployed website can reach the notebook backend | Only to serve the public API |
| `CTI_ACCESS_KEY` | Self-chosen password securing the Cloud Run → notebook backend connection | Only to serve the public API |
| `THREATCLUSTER_API_KEY` | Optional access to the live ThreatCluster API | Optional |

Enable notebook access to the secrets where required.

Never publish API keys, access tokens, or private credentials in GitHub or frontend source code.

### Step 4: Run the Notebook

1. Confirm that the runtime is connected.
2. Execute the notebook cells in their intended order.
3. Allow the notebook to install dependencies, load datasets, initialize the retrieval system, and load the language model.
4. Wait until the backend initialization process finishes.
5. Check the final output for the backend service URL and startup confirmation.

**Note:** the first query after a restart is slower (GPU warm-up). Send one query, wait for the answer, then continue testing. Avoid firing multiple questions back-to-back — the GPU processes one generation at a time.

Keep the runtime session running while using the website. If it disconnects or stops, the backend becomes unavailable.

### Step 5: Use the Interface

The notebook contains **two Gradio interfaces**:

| Cell | Interface | Purpose |
|---|---|---|
| "Gradio (Ver-2)" | Original simple UI | First version — kept for reference |
| **"Upgraded UI Gradio (Ver-3)"** | **Final interface** | **Use this one** — same behavior as the Vercel website |

The **Ver-3 interface** has three tabs mirroring the deployed website:

- **CTI Research** — ask questions; one-click sample questions run instantly;
  a dedicated **follow-up question box** (with example chips like "Mitigation
  for that?") uses the previous answer as context.
- **Email Triage** — paste a suspicious email to classify it (phishing /
  legitimate) with extracted indicators cited as `[IOC#]` evidence.
- **RAG vs Base Model** — runs the same question through the full RAG pipeline
  **and** through Gemma-2-2B with *no retrieval*, side-by-side, with a
  comparison table (response time, citation count, grounding, abstention
  behaviour). Use this to demonstrate why retrieval-grounded answers beat raw
  model memory.

Running the Ver-3 cell prints a `gradio.live` share link and a local URL. It
closes the older UI automatically if it is still open.

### Step 6: Open the Deployed Website (optional)

For the full production experience, open:

**[https://cti-rag-v3-0.vercel.app/](https://cti-rag-v3-0.vercel.app/)**

The expected successful connection message is:

- **Backend online**
- **Secure backend connection**
- This website connects through its secure Vercel API proxy. Backend URLs and access keys are configured on the server and are not entered or stored in your browser.
- **Connected through Vercel · google/gemma-2-2b-it · 94894 vector chunks indexed.**

### Step 7: Sample Questions

**Basic CTI question**

> What is phishing?

**CVE investigation** *(any CVE — live NVD fallback covers CVEs missing from the snapshot)*

> Explain CVE-2021-26855 and describe the security risks associated with it.

**Threat research**

> Explain what a wiper attack is in simple terms, provide a real case study example, and give step-by-step defensive mitigations.

**Healthcare ransomware research**

> Give two documented healthcare ransomware cases and explain their impact and documented response.

**Dataset statistics** *(deterministic — answers in under a second)*

> In 2026, which sectors were targeted most in ransomware leak-site claims? Show the percentage breakdown.

> What types of cyberattacks were most common in 2026?

**Follow-up** *(after any answer)*

> Mitigation for that?

Citation labels used in answers: `[S#]` retrieved evidence · `[C#]` case-study
records · `[V#]`/`[R#]` structured CVE/ransomware records · `[N#]` live NVD
records · `[L#]` live ThreatCluster records · `[AGG#]` computed dataset
statistics · `[IOC#]` extracted email indicators.

If the selected datasets do not contain sufficient evidence, the assistant
says so rather than inventing facts.

### Step 8: Troubleshooting

| Problem | Recommended action |
|---|---|
| Backend offline | Check whether the notebook session is still running and the backend service started successfully |
| HTTP 504 / connection timed out | The query exceeded the proxy's 55 s limit — usually the first (warm-up) query or a queued request. Wait ~30 s and retry; ask one question at a time |
| Secure connection failed | Check the Vercel API proxy and Cloud Run gateway configuration |
| Authentication error | Verify the configured gateway and backend access keys |
| Notebook runs slowly | Check the runtime type, GPU availability, RAM usage, and model initialization |
| No relevant CTI results | Check dataset loading, indexing, and retrieval configuration |
| Website cannot reach backend | Check the Cloud Run service and the notebook backend URL |
| Last cell skipped (missing secrets) | Expected for re-runners — add `NGROK_AUTHTOKEN` + `CTI_ACCESS_KEY` only if you want to serve the public API |
| Old Gradio UI still running | The Ver-3 cell closes the previous demo automatically — just re-run it |

If you restart the runtime, re-execute the notebook. Because the backend uses an ngrok **static** domain, the Cloud Run `COLAB_BACKEND_URL` does not need updating — and it works identically whether the backend runs on Colab or Kaggle. Only one runtime can hold the tunnel at a time.

---

## Knowledge Coverage

The assistant answers strictly from the following sources:

| Source | What it provides |
|---|---|
| Historical CTI reports (archive) | Long-form threat reports and analyses |
| ThreatCluster incident summaries | Documented real-world incidents |
| CVE exploitation signals (snapshot) | CVSS scores, CISA KEV status, exploit signals |
| Ransomware leak-site claims | Victim sector, country, claiming group — powers the statistics feature |
| Curated CTI Q&A | Analyst-vetted question/answer pairs |
| PhishDestroy domain blocklist | Known phishing domains for email triage |
| NIST NVD API (live) | Authoritative record for any CVE missing from the snapshot — fetched on demand, no key needed |
| ThreatCluster API (live, optional) | Real-time incident enrichment when enabled and configured |

## System Architecture

```text
Analyst / Security Researcher
          |
          +------------------------------+
          |                              |
          v                              v
Vercel React Frontend          Gradio Ver-3 UI (in-notebook)
(chat UI, citation badges,     (same pipeline — research,
 bar-chart visualisation)       follow-ups, email triage,
          |                     RAG-vs-base compare)
          v
Vercel API Routes      (server-side proxy, 55 s timeout)
          |
          v
Cloud Run FastAPI Gateway
          |
          v
Notebook FastAPI Backend — Colab or Kaggle   (ngrok static domain)
          |
          v
CTI RAG Processing Pipeline
          |
          +------------------+-------------------+------------------+
          |                  |                   |                  |
          v                  v                   v                  v
    Hybrid Retrieval   Structured CTI     Aggregate Stats     NVD Live Lookup
    ChromaDB + BM25    CVE / Incident     Engine (deterministic)  (on-demand)
          |                  |                   |                  |
          +------------------+---------+---------+------------------+
                                     |
                                     v
                              Evidence Context
                                     |
                                     v
                             Gemma 2 2B IT
                                     |
                                     v
                      Evidence-based Answer + Chart JSON
