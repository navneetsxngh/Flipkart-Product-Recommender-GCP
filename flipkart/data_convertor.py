import pandas as pd
from langchain_core.documents import Document

class DataConvertor:
    def __init__(self, file_path:str):
        self.file_path = file_path
    
    def convert(self) -> list[Document]:
        df = pd.read_csv(self.file_path)[['product_title', 'review']]
        docs = [
            Document(page_content= row['review'], metadata={'source': row['product_title']})
            for _, row in df.iterrows()
        ]
        return docs