import uuid
import datetime
from contextlib import asynccontextmanager

from fastapi import Cookie, FastAPI, Form, Request
from fastapi.responses import HTMLResponse, Response, JSONResponse
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
from prometheus_client import Counter, Histogram, generate_latest, CONTENT_TYPE_LATEST

from flipkart.data_ingestion import DataIngestion
from flipkart.rag_chain import RAGChainBuilder
from utils.logger import get_logger

logger = get_logger(__name__)

REQUEST_COUNT = Counter("chat_requests_total", "Total chat requests")
RESPONSE_LATENCY = Histogram("chat_response_latency_seconds", "Chat response latency")

rag_chain = None


def analyze_sentiment(text: str) -> str:
    text_lower = text.lower()
    pos_words = {
        "good", "great", "excellent", "love", "best", "perfect", "awesome",
        "amazing", "satisfied", "nice", "wonderful", "cool", "superb", "happy",
        "recommend", "worthy", "fine", "beautiful"
    }
    neg_words = {
        "bad", "worst", "poor", "disappointed", "waste", "not good", "hate",
        "terrible", "useless", "defect", "broken", "cheap", "slow", "disappointment",
        "regret", "faulty", "worst product", "horrible"
    }
    pos_count = sum(1 for w in pos_words if w in text_lower)
    neg_count = sum(1 for w in neg_words if w in text_lower)
    if pos_count > neg_count:
        return "Positive"
    elif neg_count > pos_count:
        return "Negative"
    else:
        return "Mixed"


@asynccontextmanager
async def lifespan(app: FastAPI):
    global rag_chain
    logger.info("Initializing vector store and RAG chain...")
    vector_store = DataIngestion().ingest(load_existing=True)
    rag_chain = RAGChainBuilder(vector_store).build_chain()
    logger.info("RAG chain ready.")
    yield
    logger.info("Shutting down.")


app = FastAPI(title="Flipkart Product Recommender", lifespan=lifespan)

app.mount("/static", StaticFiles(directory="static"), name="static")
templates = Jinja2Templates(directory="templates")


@app.get("/", response_class=HTMLResponse)
async def index(request: Request):
    return templates.TemplateResponse(request, "index.html")


@app.post("/get")
async def chat(
    request: Request,
    msg: str = Form(...),
    session_id: str = Cookie(default=None),
):
    if not session_id:
        session_id = str(uuid.uuid4())

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
        if not title:
            continue
        if title in seen_titles:
            continue
        seen_titles.add(title)
        
        excerpt = doc.page_content.strip()
        if len(excerpt) > 165:
            excerpt = excerpt[:162] + "..."
            
        sentiment = analyze_sentiment(excerpt)
        products.append({
            "title": title,
            "sentiment": sentiment,
            "excerpt": excerpt
        })

    logger.info("session=%s | q=%s | a=%s | products=%d", session_id, msg[:80], answer[:80], len(products))

    response_data = {
        "answer": answer,
        "products": products,
        "timestamp": datetime.datetime.now(datetime.timezone.utc).isoformat()
    }
    
    resp = JSONResponse(content=response_data)
    resp.set_cookie(key="session_id", value=session_id, httponly=True, samesite="lax")
    return resp


@app.get("/metrics")
async def metrics():
    return Response(content=generate_latest(), media_type=CONTENT_TYPE_LATEST)


@app.get("/health")
async def health():
    return {"status": "ok"}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app:app", host="0.0.0.0", port=8080, reload=False)
