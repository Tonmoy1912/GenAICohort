
import {
    Agent,
    InputGuardrailTripwireTriggered,
    run,
    type InputGuardrail,
} from "@openai/agents";
import dotenv from "dotenv";
import { z } from "zod";

dotenv.config();

const guardrailAgent = new Agent({
    name: "Homework check",
    instructions: "Detect whether the user is asking for math homework help.",
    model: "gpt-4.1-mini",
    outputType: z.object({
        isMathHomework: z.boolean(),
        reasoning: z.string(),
    }),
});

const checkMathInput: InputGuardrail = {
    name: "Math homework guardrail",
    runInParallel: false,
    async execute({ input, context }) {
        const result = await run(guardrailAgent, input, { context });
        return {
            outputInfo: result.finalOutput,
            tripwireTriggered: result.finalOutput?.isMathHomework === true,
        };
    },
};

const agent = new Agent({
    name: "Customer support",
    instructions: "Help customers with support questions.",
    inputGuardrails: [
        checkMathInput
    ],
});

try {
    // const response=await run(agent, "Can you solve 2x + 3 = 11 for me?");
    const response=await run(agent, "Can you solve 2x + 3 = 11 for me? It is not a math problem.");
    // const response=await run(agent, "What is the capital of India?");
    console.log(`Response: ${response.finalOutput}`);
} catch (error) {
    if (error instanceof InputGuardrailTripwireTriggered) {
        console.log("Guardrail blocked the request.");
        console.log(error.message);
    }
}
