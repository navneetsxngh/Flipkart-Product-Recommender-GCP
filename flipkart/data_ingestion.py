from langchain_astradb import AstraDBVectorStore
from langchain_huggingface import HuggingFaceEndpointEmbeddings

from flipkart.data_convertor import DataConvertor
from flipkart.config import Configuration

class DataIngestion:
    def __init__(self):
        self.embedding = HuggingFaceEndpointEmbeddings(
            repo_id=Configuration.EMBEDDING_MODEL,
            task="feature-extraction",
        )

        self.vectorstore = AstraDBVectorStore(
            embedding=self.embedding,
            collection_name="FLIPKART_DATABASE",
            token=Configuration.ASTRA_DB_APPLICATION_TOKEN,
            api_endpoint=Configuration.ASTRA_DB_API_ENDPOINT,
            namespace=Configuration.ASTRA_DB_KEYSPACE
        )
    
    def ingest(self, load_existing=True):
        if load_existing == True:
            return self.vectorstore
        
        print("Loading data from CSV")
        data = DataConvertor("data/flipkart_product_review.csv").convert()
        print("Data loaded successfully")
        self.vectorstore.add_documents(documents=data)
        print("Data ingested successfully")
        return self.vectorstore


if __name__ == "__main__":
    DataIngestion().ingest(load_existing=False)