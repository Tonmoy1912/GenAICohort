import dotenv from "dotenv";
import { Agent, run } from "@openai/agents";

dotenv.config();

const agent = new Agent({
  name: "Planet guide",
  instructions: "Answer with short facts.",
});

const stream = await run(agent, "Give me three short facts about Saturn.", {
  stream: true,
});

// stream.toTextStream({compatibleWithNodeStreams:true}).pipe(process.stdout);

for await (const event of stream) {
  if (
    event.type === "raw_model_stream_event" &&
    event.data.type === "output_text_delta"
  ) {
    process.stdout.write(event.data.delta);
  }
}

await stream.completed;
console.log("\n\nFinal:\n", stream.finalOutput);
