import uuid
import datetime

from flask import Flask, request, render_template, jsonify, make_response, Response
from prometheus_client import Counter, Histogram, generate_latest, CONTENT_TYPE_LATEST

from flipkart.data_ingestion import DataIngestion
from flipkart.rag_chain import RAGChainBuilder
from utils.logger import get_logger

logger = get_logger(__name__)

REQUEST_COUNT = Counter("chat_requests_total", "Total chat requests")
RESPONSE_LATENCY = Histogram("chat_response_latency_seconds", "Chat response latency")

app = Flask(__name__, static_folder="static", template_folder="templates")


def analyze_sentiment(text: str) -> str:
    text_lower = text.lower()
    pos_words = {
        "good", "great", "excellent", "love", "best", "perfect", "awesome",
        "amazing", "satisfied", "nice", "wonderful", "cool", "superb", "happy",
        "recommend", "worthy", "fine", "beautiful",
    }
    neg_words = {
        "bad", "worst", "poor", "disappointed", "waste", "not good", "hate",
        "terrible", "useless", "defect", "broken", "cheap", "slow", "disappointment",
        "regret", "faulty", "worst product", "horrible",
    }
    pos_count = sum(1 for w in pos_words if w in text_lower)
    neg_count = sum(1 for w in neg_words if w in text_lower)
    if pos_count > neg_count:
        return "Positive"
    elif neg_count > pos_count:
        return "Negative"
    else:
        return "Mixed"


logger.info("Initializing vector store and RAG chain...")
vector_store = DataIngestion().ingest(load_existing=True)
rag_chain = RAGChainBuilder(vector_store).build_chain()
logger.info("RAG chain ready.")


@app.get("/")
def index():
    return render_template("index.html")


@app.post("/get")
def chat():
    session_id = request.cookies.get("session_id") or str(uuid.uuid4())
    msg = request.form.get("msg", "").strip()

    if not msg:
        return jsonify({"error": "Empty message"}), 400

    REQUEST_COUNT.inc()

    with RESPONSE_LATENCY.time():
        result = rag_chain.invoke(
            {"input": msg},
            config={"configurable": {"thread_id": session_id}},
        )

    answer = result.get("answer", "Sorry, I could not find an answer.")
    context_docs = result.get("context", [])

    products = []
    seen_titles = set()
    for doc in context_docs:
        title = doc.metadata.get("source", "").strip()
        if not title or title in seen_titles:
            continue
        seen_titles.add(title)
        excerpt = doc.page_content.strip()
        if len(excerpt) > 165:
            excerpt = excerpt[:162] + "..."
        products.append({
            "title": title,
            "sentiment": analyze_sentiment(excerpt),
            "excerpt": excerpt,
        })

    logger.info(
        "session=%s | q=%s | a=%s | products=%d",
        session_id, msg[:80], answer[:80], len(products),
    )

    resp = make_response(jsonify({
        "answer": answer,
        "products": products,
        "timestamp": datetime.datetime.now(datetime.timezone.utc).isoformat(),
    }))
    resp.set_cookie("session_id", session_id, httponly=True, samesite="Lax")
    return resp


@app.get("/metrics")
def metrics():
    return Response(generate_latest(), mimetype=CONTENT_TYPE_LATEST)


@app.get("/health")
def health():
    return jsonify({"status": "ok"})


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=False)
