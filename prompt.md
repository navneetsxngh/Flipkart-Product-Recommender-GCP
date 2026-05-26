# Flipkart Product Recommender — Frontend Design Brief

## Project Overview

This is a **RAG-based e-commerce chatbot** that lets users ask natural-language questions about Flipkart products using real customer reviews. The backend is **FastAPI + LangChain + AstraDB (vector store) + Groq LLM**, and the frontend is a single-page chat UI served at `/`.

The chatbot answers queries like:
- "Which phone has the best camera under ₹20,000?"
- "What do customers say about the Samsung Galaxy M series battery life?"
- "Is the boAt Rockerz 450 good for gym use?"

---

## Current Frontend State

- **Framework:** Bootstrap 4 + jQuery AJAX
- **Theme:** Dark — navy header (`#003366`), dark card body (`#1c1e25`), yellow send button (`#ffb900`)
- **Layout:** Centered chat card, fixed 500 px height on desktop, full-screen on mobile
- **Message bubbles:** Blue for bot (`#0056b3`), green for user (`#2e7d32`)
- **Input:** Dark text field with rounded corners, yellow send arrow button
- **Bot avatar:** E-commerce icon (circular)
- **User avatar:** Generic avatar image (circular)
- **API contract:** `POST /get` with `application/x-www-form-urlencoded` body `{ msg: "<text>" }` → returns plain-text answer

---

## Design Goals for Improvement

### 1. Brand Identity
- Use **Flipkart's actual brand palette**: primary blue `#2874F0`, accent yellow `#FFD814`, white backgrounds
- Replace the generic e-commerce icon with a Flipkart-inspired logo mark or a shopping-cart icon in blue/yellow
- Add a subtle Flipkart logo or wordmark in the chat header

### 2. Layout & Responsiveness
- Expand the chat window to fill more vertical space (80 vh minimum) instead of a fixed 500 px
- Make the card full-width on mobile with no border-radius
- Add a **welcome banner** above the chat that briefly explains what the bot can do
- Consider a **split layout** on desktop: left panel with product category chips, right panel with chat

### 3. Message Bubbles
- Bot messages: white bubble with a thin left blue border, dark text — more readable than white-on-blue
- User messages: light yellow (`#FFF9E6`) with dark text
- Add **typing indicator** (three animated dots) while waiting for the bot response
- Show a **timestamp tooltip** on hover instead of always-visible time below each bubble

### 4. Input Area
- Replace the plain text input with a richer input bar:
  - Rounded pill shape
  - Microphone icon placeholder (future voice input)
  - Send button: Flipkart blue with a white paper-plane icon
- Add **suggested question chips** above the input on first load (e.g. "Best phone under ₹15k", "Top-rated earphones", "Laptop with long battery")
- Show character count / disable send on empty

### 5. Product Cards in Responses
- When the bot mentions a product by name, render a small **product card** inline:
  - Product title (bold)
  - Average review sentiment badge (Positive / Mixed / Negative)
  - Short excerpt from the retrieved review
- Cards should be collapsible to keep the chat clean

### 6. Sidebar / History Panel (Desktop)
- Collapsible left sidebar listing past questions in the current session
- Click a past question to scroll to it in the chat
- "Clear chat" button at the top

### 7. Loading & Empty States
- Skeleton loader in the chat body on initial page load while the RAG chain warms up
- Empty-state illustration + prompt text when no messages yet ("Ask me about any Flipkart product!")
- Toast notification if the `/get` request fails (network error, timeout)

### 8. Accessibility & Performance
- Keyboard: Enter to send, Shift+Enter for newline
- Proper ARIA labels on input, send button, and message list
- Lazy-load bot avatar image
- Add `Content-Security-Policy` meta tag

### 9. Tech Stack for Redesign
- Keep Bootstrap 5 (upgrade from 4) or switch to **Tailwind CSS**
- Replace jQuery with vanilla `fetch` API — removes a 30 kB dependency
- Optional: Use **HTMX** for the chat form to get streaming responses without writing JS

---

## API Reference

| Endpoint  | Method | Body                          | Response               |
|-----------|--------|-------------------------------|------------------------|
| `/`       | GET    | —                             | HTML page              |
| `/get`    | POST   | `msg=<user question>` (form)  | Plain text answer      |
| `/health` | GET    | —                             | `{"status": "ok"}`     |
| `/metrics`| GET    | —                             | Prometheus metrics     |

Sessions are maintained via an `HttpOnly` cookie (`session_id`) set automatically on the first `/get` call. Conversation history is stored server-side per session.

---

## File Structure

```
Flipkart Product Recommender/
├── app.py                  # FastAPI app (entry point)
├── templates/
│   └── index.html          # Main chat UI template (Jinja2)
├── static/
│   └── style.css           # All custom styles
├── flipkart/
│   ├── config.py           # Env-based configuration
│   ├── data_ingestion.py   # AstraDB vector store setup
│   ├── data_convertor.py   # CSV → LangChain Documents
│   └── rag_chain.py        # LangChain RAG + chat history
├── utils/
│   ├── logger.py           # Rotating daily log files
│   └── exception.py        # Custom exceptions
├── data/
│   └── flipkart_product_review.csv   # Source data
└── requirements.txt
```

---

## Constraints

- The backend returns **plain text** from `/get` — the redesign must either keep this or update `app.py` to return JSON if richer data (product cards, sources) is needed
- Session state lives **in-memory** — a page refresh starts a new session unless the cookie persists
- The LLM model is `llama-3.1-8b-instant` via Groq — responses are fast (~1–2 s) so a short spinner is sufficient
