from langchain_astradb import AstraDBVectorStore
from langchain_huggingface import HuggingFaceEndpointEmbeddings

try:
    from langchain_astradb.utils.astradb import SetupMode
    _SETUP_OFF = SetupMode.OFF
    _SETUP_SYNC = SetupMode.SYNC
except ImportError:
    # Older versions accept the raw string values
    _SETUP_OFF = "off"
    _SETUP_SYNC = "sync"

from flipkart.data_convertor import DataConvertor
from flipkart.config import Configuration

class DataIngestion:
    def __init__(self):
        self.embedding = HuggingFaceEndpointEmbeddings(
            repo_id=Configuration.EMBEDDING_MODEL,
            task="feature-extraction",
        )

    def _build_vectorstore(self, setup_mode) -> AstraDBVectorStore:
        return AstraDBVectorStore(
            embedding=self.embedding,
            collection_name="FLIPKART_DATABASE",
            token=Configuration.ASTRA_DB_APPLICATION_TOKEN,
            api_endpoint=Configuration.ASTRA_DB_API_ENDPOINT,
            namespace=Configuration.ASTRA_DB_KEYSPACE,
            setup_mode=setup_mode,
        )

    def ingest(self, load_existing=True):
        if load_existing:
            return self._build_vectorstore(_SETUP_OFF)

        print("Loading data from CSV")
        data = DataConvertor("data/flipkart_product_review.csv").convert()
        print("Data loaded successfully")
        vectorstore = self._build_vectorstore(_SETUP_SYNC)
        vectorstore.add_documents(documents=data)
        print("Data ingested successfully")
        return vectorstore


if __name__ == "__main__":
    DataIngestion().ingest(load_existing=False)