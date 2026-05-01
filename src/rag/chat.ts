import { QdrantVectorStore } from "@langchain/qdrant";
import { OpenAIEmbeddings } from "@langchain/openai";
import dotenv from "dotenv";
import OpenAI from "openai";
import type { ResponseInputItem } from "openai/resources/responses/responses.mjs";
import type { Document } from "@langchain/core/documents";

dotenv.config();

const SYSTEM_PROMT = `
    You are an AI agent who resolves user queries based on the context provided to you.

    You only gives response based on the context given to you, don't use any other knowledge source.
`

async function getRelevantPages(query: string):Promise<Document<Record<string, any>>[]> {
    const embeddings = new OpenAIEmbeddings({
        model: "text-embedding-3-small",
    });

    const vectorStore = await QdrantVectorStore.fromExistingCollection(embeddings,
        {
            url: "http://localhost:6333",
            collectionName: "os-doc",
        });

    const retriever = vectorStore.asRetriever({
        k: 3,
    });

    return await retriever.invoke(query);
}

async function getResponse(query: string) {
    let doc = await getRelevantPages(query);
    let messages: Array<ResponseInputItem> = [
        { role: "system", content: SYSTEM_PROMT },
        { role: "developer", content: `Context: ${JSON.stringify(doc)}` },
        { role: "user", content: query }
    ];

    const openai = new OpenAI();

    let response = await openai.responses.create({
        model: "gpt-4.1-mini",
        input: messages
    });
    return response.output_text;
}

async function main() {
    // const query = "How does OS manage concurrency issue?";
    const query = "explain transaction in DB.";

    const response = await getResponse(query);
    console.log("AI response:");
    console.log(response);
}

main();