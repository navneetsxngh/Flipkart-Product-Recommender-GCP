# Flipkart Product Recommender

A conversational product recommendation chatbot built with FastAPI, LangChain, Groq LLM, and AstraDB vector store. Users can ask natural-language questions about Flipkart products and receive AI-powered answers with relevant product excerpts and sentiment analysis.

## Features

- Conversational RAG (Retrieval-Augmented Generation) powered by Groq LLaMA
- AstraDB cloud vector store for fast semantic search
- HuggingFace embeddings (`BAAI/bge-large-en-v1.5`)
- Per-session conversation memory via cookies
- Inline sentiment analysis on retrieved product reviews
- Prometheus metrics at `/metrics`
- Health check at `/health`

## Tech Stack

| Layer | Technology |
|---|---|
| Web framework | FastAPI + Uvicorn |
| LLM | Groq (llama-3.1-8b-instant) |
| Embeddings | HuggingFace Endpoint |
| Vector store | DataStax AstraDB |
| Orchestration | LangChain |
| Frontend | Jinja2 + vanilla JS |

## Environment Variables

Create a `.env` file in the project root (never commit it):

```env
GROQ_API_KEY=your_groq_api_key
GROQ_MODEL=llama-3.1-8b-instant

HUGGINGFACEHUB_API_TOKEN=your_hf_token
HF_TOKEN=your_hf_token
EMBEDDING_MODEL=BAAI/bge-large-en-v1.5

ASTRA_DB_API_ENDPOINT=https://<db-id>-<region>.apps.astra.datastax.com
ASTRA_DB_APPLICATION_TOKEN=AstraCS:...
ASTRA_DB_KEYSPACE=default_keyspace

TEMPERATURE=0.4
```

## Local Setup

```bash
# Create and activate virtual environment
python -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Run the app
uvicorn app:app --host 0.0.0.0 --port 8080 --reload
```

Open http://localhost:8080 in your browser.

## Docker

```bash
# Build image
docker build -t flipkart-recommender .

# Run container (pass env vars from your .env file)
docker run --env-file .env -p 8080:8080 flipkart-recommender
```

## Deploy on Render

1. Push this repository to GitHub (ensure `.env` is in `.gitignore`).
2. Go to [Render](https://render.com) → **New → Web Service**.
3. Connect your GitHub repo.
4. Set **Runtime** to **Docker**.
5. Add all environment variables from the table above under **Environment**.
6. Set **Health Check Path** to `/health`.
7. Click **Deploy**.

Render automatically injects the `PORT` environment variable; the container reads it at startup.

## Data Ingestion

Product reviews are pre-ingested into AstraDB. To re-ingest from the CSV:

```bash
python -m flipkart.data_ingestion
```
