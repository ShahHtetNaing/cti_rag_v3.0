# CTI RAG Assistant v2.0

A Cyber Threat Intelligence (CTI) Retrieval-Augmented Generation assistant designed to help security analysts research cyber threats, vulnerabilities, incidents, and phishing-related information using retrieved evidence.

**Live website:** [https://cti-rag-v3-0.vercel.app/](https://cti-rag-v3-0.vercel.app/)
(publicly accessible while the author's Colab backend is running — no keys or login needed for visitors)

---

## Quick Start for Markers / Re-runners

There are two ways to try the assistant:

1. **Use the deployed website** — open the link above. It works as long as the
   author's Colab runtime is alive. No keys required.
2. **Re-run the notebook yourself** — you only need your own **free
   `HF_TOKEN`** ([huggingface.co → Settings → Access Tokens](https://huggingface.co/settings/tokens))
   added in the Colab **Secrets** panel. Run all cells, then use the Gradio
   interface that launches inside the notebook. It also prints a temporary
   public `https://*.gradio.live` link — a real web UI backed by your own
   runtime, shareable for ~72 hours.

`CTI_ACCESS_KEY`, `NGROK_AUTHTOKEN`, and `THREATCLUSTER_API_KEY` are **not**
needed to re-run — they only serve the public API for the author's deployment.
The final API-serving cell detects missing secrets and skips itself with an
explanation instead of failing.

The notebook file itself contains **no credentials** — every secret is read at
runtime via `google.colab.userdata.get()`.

---

## How to Run the Program

Follow these steps in order to start the CTI RAG Assistant.

### Step 1: Open the Google Colab Notebook

1. Open this GitHub repository.
2. Navigate to the `notebook` folder.
3. Download the notebook:

   `notebook/CTI_RAG_Assistant.ipynb`

4. Open [Google Colab](https://colab.research.google.com/).
5. Select **File → Upload notebook**.
6. Upload `CTI_RAG_Assistant.ipynb`.

You can also open the notebook directly from Google Colab if you have connected your GitHub repository.

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
| Runtime environment | Google Colab |
| Hardware accelerator | T4 GPU |
| System RAM | High-RAM, if available |
| Notebook | `CTI_RAG_Assistant.ipynb` |

**Important:** T4 GPU and High-RAM availability depends on your Google Colab plan, usage limits, and available resources. A GPU does not automatically accelerate every operation; retrieval, embedding, and language generation may use different resources.

### Step 3: Configure Secrets and API Keys

Before running the notebook, configure the required secrets in Google Colab.

Open the **Secrets** panel (key icon) and add the credentials required by the notebook.

| Secret | Purpose | Required? |
|---|---|---|
| `HF_TOKEN` | Hugging Face access for downloading the Gemma model and datasets | **Yes** — free token from your own HF account |
| `NGROK_AUTHTOKEN` | Starts the public tunnel so the deployed website can reach Colab | Only to serve the public API |
| `CTI_ACCESS_KEY` | Self-chosen password securing the Cloud Run → Colab connection | Only to serve the public API |
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

Keep the Colab runtime running while using the website. If the runtime disconnects or stops, the backend may become unavailable.

### Step 5: Start the Secure Backend Connection

The deployed application uses a secure connection architecture:

**Analyst Browser → Vercel Frontend → Vercel API Proxy → Cloud Run Gateway → Google Colab Backend**

The backend and access keys are configured on the server. Users do not need to enter backend URLs or access keys in the browser.

The Cloud Run gateway uses the following server-side configuration:

| Environment variable | Purpose |
|---|---|
| `COLAB_BACKEND_URL` | Colab backend URL (the ngrok static domain) |
| `COLAB_ACCESS_KEY` | Authentication key forwarded to the Colab backend |
| `GATEWAY_API_KEY` | Authentication key used by the Vercel API proxy to access the gateway |

Ensure these variables are configured in the appropriate deployment environment before testing the application.

### Step 6: Open the CTI RAG Assistant Website

After the Colab notebook has completed initialization and the backend is running, open:

**[https://cti-rag-v3-0.vercel.app/](https://cti-rag-v3-0.vercel.app/)**

Wait for the connection status to appear.

The expected successful connection message is:

- **Backend online**
- **Secure backend connection**
- This website connects through its secure Vercel API proxy. Backend URLs and access keys are configured on the server and are not entered or stored in your browser.
- **Connected through Vercel · google/gemma-2-2b-it · 94894 vector chunks indexed.**

The application should also display the **Check connection** option.

When these indicators appear, the website is reporting that it has connected to the backend through the Vercel API proxy and is using the configured Gemma model and indexed vector collection.

### Step 7: Ask Questions to the CTI Research Assistant

Once the backend connection is successful, you can start asking questions about Cyber Threat Intelligence.

For example:

**Basic CTI question**

> What is phishing, and how can organizations prevent it?

**CVE investigation** *(any CVE — live NVD fallback covers CVEs missing from the snapshot)*

> Explain CVE-2021-26855 and describe the security risks associated with it.

**Threat research**

> What is a wiper attack? Explain it in simple terms, provide a documented real-world example, and recommend defensive measures.

**Healthcare ransomware research**

> Identify two documented ransomware incidents involving healthcare organizations. Explain their impacts and how the organizations responded.

**Incident analysis**

> What are the common techniques used by ransomware groups to gain initial access to an organization's network?

**Dataset statistics — returns a visual bar chart + percentage breakdown**

> In 2026, which sectors were targeted most by ransomware?

> What types of cyberattacks were most common in 2026?

> Which ransomware groups were most active?

**Email Triage**

Switch to the **Email Triage** tab and paste a suspicious email to classify it
(phishing / legitimate), with extracted indicators of compromise cited as
`[IOC#]` evidence.

**Follow-up questions**

The assistant remembers the previous turn — e.g. ask *"what is CVE-2021-26855?"*
then *"mitigation for that?"* and it deepens the same investigation.

The assistant uses retrieved CTI information to support its responses. Check the citations and source references provided with the answers: `[S#]` retrieval evidence, `[C#]` structured CVE/CVE records, `[N#]` live NVD records, `[AGG#]` computed dataset statistics, `[IOC#]` extracted email indicators.

If the selected datasets do not contain sufficient evidence, the assistant indicates that the information cannot be found in the available sources rather than inventing facts.

### Step 8: Troubleshooting

| Problem | Recommended action |
|---|---|
| Backend offline | Check whether the Colab runtime is still running and the backend service started successfully |
| HTTP 504 / connection timed out | The query exceeded the proxy's 55 s limit — usually the first (warm-up) query or a queued request. Wait ~30 s and retry; ask one question at a time |
| Secure connection failed | Check the Vercel API proxy and Cloud Run gateway configuration |
| Authentication error | Verify the configured gateway and Colab access keys |
| Notebook runs slowly | Check the runtime type, GPU availability, RAM usage, and model initialization |
| No relevant CTI results | Check dataset loading, indexing, and retrieval configuration |
| Website cannot reach backend | Check the Cloud Run service and the Colab backend URL |
| Last cell skipped (missing secrets) | Expected for re-runners — add `NGROK_AUTHTOKEN` + `CTI_ACCESS_KEY` only if you want to serve the public API |

If you restart the Colab runtime, re-execute the notebook. Because the backend uses an ngrok **static** domain, the Cloud Run `COLAB_BACKEND_URL` does not need updating after a restart.

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
          v
Vercel React Frontend  (chat UI, citation badges, bar-chart visualisation)
          |
          v
Vercel API Routes      (server-side proxy, 55 s timeout)
          |
          v
Cloud Run FastAPI Gateway
          |
          v
Google Colab FastAPI Backend   (ngrok static domain)
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
```

## Repository Structure

```text
CTI-RAG-Assistant/
│
├── api/
│   └── cti/
│       ├── health.js
│       └── query.js
│
├── cloud-run-gateway/
│   ├── .gcloudignore
│   ├── Dockerfile
│   ├── main.py
│   └── requirements.txt
│
├── evaluation/
│
├── frontend/
│   ├── public/
│   ├── src/
│   ├── index.html
│   ├── package.json
│   ├── tsconfig.json
│   ├── tsconfig.node.json
│   └── vite.config.ts
│
├── notebook/
│   └── CTI_RAG_Assistant.ipynb
│
├── requirements.txt.txt
└── vercel.json
```

## Main Technologies

| Component | Technology |
|---|---|
| Frontend | React, TypeScript, Vite |
| Frontend hosting | Vercel |
| API gateway | FastAPI, Google Cloud Run |
| RAG backend | Python, FastAPI, ngrok, Google Colab |
| In-notebook UI | Gradio (embedded + `gradio.live` share link) |
| Language model | `google/gemma-2-2b-it` |
| Vector database | ChromaDB |
| Retrieval | Hybrid retrieval using vector search and BM25 |
| Model and dataset access | Hugging Face |
| Live CVE fallback | NIST NVD API (keyless) |
| Optional external CTI source | ThreatCluster API |

## Main Features

- **Cyber Threat Intelligence Research:** Ask natural-language questions about cybersecurity threats and incidents.
- **Hybrid Retrieval:** Combines vector similarity search and BM25 keyword retrieval.
- **CVE Research:** Supports vulnerability-related investigation using available structured and retrieved CTI evidence.
- **NVD Live CVE Fallback:** When a requested CVE is missing from the selected snapshot, the authoritative record is fetched from the NIST NVD API (no key required) and cited as `[N#]` evidence — so any CVE can be answered, not only those in the dataset.
- **Dataset Aggregate Analytics:** Statistics questions (sector targeting, attack-type distribution, ransomware-group activity, CVSS severity, year filtering) are computed deterministically from the loaded datasets and returned as percentage breakdowns with a bar-chart visualisation and `[AGG#]` citations.
- **Incident Research:** Retrieves available incident reports and threat intelligence records for case-study questions.
- **Evidence-based Responses:** Uses retrieved sources to support generated answers; uncited model claims are automatically attached to matching evidence or dropped, so a grounded answer is produced whenever records exist.
- **Conversational Follow-ups:** Resolves follow-up questions against the previous turn (typo-tolerant intent matching).
- **Email Triage:** Classifies suspicious emails and extracts indicators of compromise, cross-checked against the PhishDestroy blocklist.
- **Optional Live Intelligence:** Can use the ThreatCluster API when configured and enabled.

## Security Notes

- Do not expose API keys in frontend code.
- Keep Colab and gateway credentials in their respective secret or server-side environment configurations.
- Do not commit `.env` files or credentials to GitHub.
- Use the Vercel API proxy and Cloud Run gateway for protected backend communication.
- The website is public; keys stay server-side. If live ThreatCluster enrichment is enabled, be aware public visitors can consume API quota.
- Keep the Colab runtime active while the application is in use.

## Limitations

- The availability of the backend depends on the active Google Colab runtime (free-tier sessions expire after a period of inactivity or a maximum session length).
- GPU and High-RAM access depend on Colab availability and account limits.
- The GPU processes one generation at a time; back-to-back questions queue and may hit the proxy timeout.
- Responses depend on the coverage and quality of the indexed datasets; aggregate statistics reflect only the snapshot's records (e.g. leak-site claims are claims, not confirmed breaches — the answer states this caveat).
- Optional live intelligence depends on API availability and valid credentials.
- Retrieved information should be checked against the cited sources before making operational security decisions.

## Acknowledgement and AI Assistance

This project was developed for academic and research purposes. AI tools, including Google Gemini, and ChatGPT were used as development and research assistance where applicable. The final implementation, testing, evaluation, and academic submission should be reviewed by the project author.
