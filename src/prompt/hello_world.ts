import dotenv from 'dotenv';
import OpenAI from "openai";

dotenv.config();

const openai = new OpenAI();

const responses = await openai.responses.create({
    model: "gpt-4.1-mini",
    input: [
        { role: "user", content: "Hi, I am Tonmoy" },
        { role: "assistant", content: "Hello Tonmoy! How can I assist you today?" },
        { role: "user", content: "do you know what is my name? And what I do?" }
    ]
});

// console.log(responses.output[0].content);
console.log(responses.output_text);