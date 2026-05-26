from typing import Sequence
from typing_extensions import Annotated, TypedDict

from langchain_core.messages import AIMessage, BaseMessage, HumanMessage
from langchain_core.prompts import ChatPromptTemplate, MessagesPlaceholder
from langchain_classic.chains import create_history_aware_retriever, create_retrieval_chain
from langchain_classic.chains.combine_documents import create_stuff_documents_chain
from langchain_groq import ChatGroq
from langgraph.checkpoint.memory import MemorySaver
from langgraph.graph import START, StateGraph
from langgraph.graph.message import add_messages

from flipkart.config import Configuration


class State(TypedDict):
    input: str
    chat_history: Annotated[Sequence[BaseMessage], add_messages]
    context: list
    answer: str


class RAGChainBuilder:
    def __init__(self, vector_store):
        self.vector_store = vector_store
        self.llm = ChatGroq(
            model=Configuration.GROQ_MODEL_NAME,
            temperature=float(Configuration.TEMPERATURE),
            api_key=Configuration.GROQ_API_KEY,
        )

    def build_chain(self):
        retriever = self.vector_store.as_retriever(search_kwargs={"k": 3})

        context_prompt = ChatPromptTemplate.from_messages([
            ("system", "Given the chat history and user question, rewrite it as a standalone question."),
            MessagesPlaceholder(variable_name="chat_history"),
            ("human", "{input}"),
        ])

        qa_prompt = ChatPromptTemplate.from_messages([
            ("system", """You are an e-commerce assistant answering product queries using customer reviews.
Stick to the provided context. Be concise and helpful.

CONTEXT:
{context}"""),
            MessagesPlaceholder(variable_name="chat_history"),
            ("human", "{input}"),
        ])

        history_aware_retriever = create_history_aware_retriever(self.llm, retriever, context_prompt)
        question_answer_chain = create_stuff_documents_chain(self.llm, qa_prompt)
        rag_chain = create_retrieval_chain(history_aware_retriever, question_answer_chain)

        def call_model(state: State):
            response = rag_chain.invoke({
                "input": state["input"],
                "chat_history": state.get("chat_history", []),
            })
            return {
                "chat_history": [
                    HumanMessage(state["input"]),
                    AIMessage(response["answer"]),
                ],
                "context": response.get("context", []),
                "answer": response["answer"],
            }

        workflow = StateGraph(state_schema=State)
        workflow.add_node("model", call_model)
        workflow.add_edge(START, "model")

        return workflow.compile(checkpointer=MemorySaver())
