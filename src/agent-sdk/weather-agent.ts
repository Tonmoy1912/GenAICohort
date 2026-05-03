import dotenv from "dotenv";
import { Agent, run, tool } from "@openai/agents";
import {z} from "zod";

dotenv.config();

const getTimeTool= tool({
    name:"get_current_time",
    description:"Return the current time",
    parameters:z.object({}),
    execute:async()=>{
        return new Date().toLocaleString();
    }
})

const agent= new Agent({
    name:"General AI Agent",
    instructions:"You are an AI agent who resolves user query.",
    tools:[getTimeTool],
    model:"gpt-4.1-mini",
});

const result= await run(agent,"What is the current time?");

console.log("History : ",result.history);

console.log("Final Output : ",result.finalOutput);
