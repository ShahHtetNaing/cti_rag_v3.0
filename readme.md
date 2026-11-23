# CTI RAG Assistant v2.0

A Cyber Threat Intelligence (CTI) Retrieval-Augmented Generation assistant designed to help security analysts research cyber threats, vulnerabilities, incidents, and phishing-related information using retrieved evidence.

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

| Secret | Purpose |
|---|---|
| `HF_TOKEN` | Hugging Face access for downloading supported datasets and models |
| `CTI_ACCESS_KEY` | Secures communication with the Colab backend |
| `THREATCLUSTER_API_KEY` | Optional access to the ThreatCluster API |

Enable notebook access to the secrets where required.

Never publish API keys, access tokens, or private credentials in GitHub or frontend source code.

### Step 4: Run the Notebook

1. Confirm that the runtime is connected.
2. Execute the notebook cells in their intended order.
3. Allow the notebook to install dependencies, load datasets, initialize the retrieval system, and load the language model.
4. Wait until the backend initialization process finishes.
5. Check the final output for the backend service URL and startup confirmation.

Keep the Colab runtime running while using the website. If the runtime disconnects or stops, the backend may become unavailable.

### Step 5: Start the Secure Backend Connection

The deployed application uses a secure connection architecture:

**Analyst Browser → Vercel Frontend → Vercel API Proxy → Cloud Run Gateway → Google Colab Backend**

The backend and access keys are configured on the server. Users do not need to enter backend URLs or access keys in the browser.

The Cloud Run gateway uses the following server-side configuration:

| Environment variable | Purpose |
|---|---|
| `COLAB_BACKEND_URL` | Colab backend URL |
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

**CVE investigation**

> Explain CVE-2021-26855 and describe the security risks associated with it.

**Threat research**

> What is a wiper attack? Explain it in simple terms, provide a documented real-world example, and recommend defensive measures.

**Healthcare ransomware research**

> Identify two documented ransomware incidents involving healthcare organizations. Explain their impacts and how the organizations responded.

**Incident analysis**

> What are the common techniques used by ransomware groups to gain initial access to an organization's network?

The assistant uses retrieved CTI information to support its responses. Check the citations and source references provided with the answers.

If the selected datasets do not contain sufficient evidence, the assistant should indicate that the information cannot be found in the available sources rather than inventing facts.

### Step 8: Troubleshooting

| Problem | Recommended action |
|---|---|
| Backend offline | Check whether the Colab runtime is still running and the backend service started successfully |
| Secure connection failed | Check the Vercel API proxy and Cloud Run gateway configuration |
| Authentication error | Verify the configured gateway and Colab access keys |
| Notebook runs slowly | Check the runtime type, GPU availability, RAM usage, and model initialization |
| No relevant CTI results | Check dataset loading, indexing, and retrieval configuration |
| Website cannot reach backend | Check the Cloud Run service and the Colab backend URL |

If you restart the Colab runtime, you may need to execute the notebook again and update the backend URL in the server-side configuration if it has changed.

---

## System Architecture

```text
Analyst / Security Researcher
          |
          v
Vercel React Frontend
          |
          v
Vercel API Routes
          |
          v
Cloud Run FastAPI Gateway
          |
          v
Google Colab FastAPI Backend
          |
          v
CTI RAG Processing Pipeline
          |
          +--------------------------+
          |                          |
          v                          v
     Hybrid Retrieval          Structured CTI Data
     ChromaDB + BM25            CVE / Incident Data
          |                          |
          +------------+-------------+
                       |
                       v
                Evidence Context
                       |
                       v
               Gemma 2 2B IT
                       |
                       v
             Evidence-based Answer
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
| RAG backend | Python, Google Colab |
| Language model | `google/gemma-2-2b-it` |
| Vector database | ChromaDB |
| Retrieval | Hybrid retrieval using vector search and BM25 |
| Model and dataset access | Hugging Face |
| Optional external CTI source | ThreatCluster API |

## Main Features

- **Cyber Threat Intelligence Research:** Ask natural-language questions about cybersecurity threats and incidents.
- **Hybrid Retrieval:** Combines vector similarity search and BM25 keyword retrieval.
- **CVE Research:** Supports vulnerability-related investigation using available structured and retrieved CTI evidence.
- **Incident Research:** Retrieves available incident reports and threat intelligence records.
- **Evidence-based Responses:** Uses retrieved sources to support generated answers.
- **Email Triage:** Preserves the email analysis functionality.
- **PhishDestroy:** Supports phishing-domain checks using the available domain blocklist.
- **Optional Live Intelligence:** Can use the ThreatCluster API when configured and enabled.

## Security Notes

- Do not expose API keys in frontend code.
- Keep Colab and gateway credentials in their respective secret or server-side environment configurations.
- Do not commit `.env` files or credentials to GitHub.
- Use the Vercel API proxy and Cloud Run gateway for protected backend communication.
- Keep the Colab runtime active while the application is in use.

## Limitations

- The availability of the backend depends on the active Google Colab runtime.
- GPU and High-RAM access depend on Colab availability and account limits.
- Responses depend on the coverage and quality of the indexed datasets.
- Optional live intelligence depends on API availability and valid credentials.
- Retrieved information should be checked against the cited sources before making operational security decisions.

## Acknowledgement and AI Assistance

This project was developed for academic and research purposes. AI tools, including Google Gemini and ChatGPT, were used as development and research assistance where applicable. The final implementation, testing, evaluation, and academic submission should be reviewed by the project author.
