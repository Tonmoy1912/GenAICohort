import { PDFLoader } from "@langchain/community/document_loaders/fs/pdf";
import { QdrantVectorStore } from "@langchain/qdrant";
import { OpenAIEmbeddings } from "@langchain/openai";
import dotenv from "dotenv";
import type { Document } from "@langchain/core/documents";
import path from "node:path";

dotenv.config();

async function loadDocumentAndDivideIntoPages(pdfPath: string) {
    const loader = new PDFLoader(pdfPath);
    const docs = await loader.load()
    return docs;

}

async function storeChunksIntoVectorDB(docs: Document<Record<string, any>>[]) {
    const embeddings = new OpenAIEmbeddings({
        model: "text-embedding-3-small",
    });

    const vectorStore = await QdrantVectorStore.fromDocuments(docs, embeddings, {
        url: "http://localhost:6333",
        collectionName: "os-doc",
    });
}

async function main() {
    let docs = await loadDocumentAndDivideIntoPages(path.join(process.cwd(), "pdfs/OS_Full_Notes.pdf"));
    // await storeChunksIntoVectorDB(docs);
    console.log("Done..")
}

main();
