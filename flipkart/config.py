import os
from dotenv import load_dotenv
load_dotenv()

class Configuration:
    ASTRA_DB_API_ENDPOINT = os.getenv("ASTRA_DB_API_ENDPOINT")
    ASTRA_DB_APPLICATION_TOKEN = os.getenv("ASTRA_DB_APPLICATION_TOKEN")
    ASTRA_DB_KEYSPACE = os.getenv("ASTRA_DB_KEYSPACE")
    GROQ_API_KEY = os.getenv("GROQ_API_KEY")
    GROQ_MODEL_NAME = os.getenv("GROQ_MODEL")
    EMBEDDING_MODEL = os.getenv("EMBEDDING_MODEL")
    TEMPERATURE = os.getenv("TEMPERATURE")