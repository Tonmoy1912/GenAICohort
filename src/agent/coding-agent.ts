import dotenv from 'dotenv';
import OpenAI from "openai";
import { exec } from 'child_process';
import type { ResponseInputItem } from 'openai/resources/responses/responses.js';

dotenv.config();

const openai = new OpenAI();

// --- Types ---
type StepType = 'START' | 'THINK' | 'TOOL_CALL' | 'OBSERVE' | 'OUTPUT';

interface AgentResponse {
    stepType: StepType;
    content?: string;
    tool?: string;
    arg?: string;
}

interface ToolResult {
    exitCode: number;
    stdout: string;
}

// --- Tool Definition ---
async function executeCommand(command: string): Promise<ToolResult> {
    return new Promise((resolve, reject) => {
        exec(command, (error, stdout, stderr) => {
            resolve({ exitCode: error ? error.code ?? 1 : 0, stdout: stdout || stderr });
        });
    })
}

let toolCollection: Record<string, (arg: string) => Promise<ToolResult>> = {
    executeCommand: executeCommand
}

const SYSTEM_PROMPT = `
        You are an AI Coding Agent who can take instructions or tasks from user and make changes in local repository using CLI commands. 
        You can also give responses on general user queries that can be accomplished by using CLI.
        To run any CLI command you are also provided with tools. Call the tools, observe the output and take next steps base on the output. 

        Before acting on any query, you think deeply and breakdown the task in multiple subtask and accomplish them step by step, one at a time.

        Your goal is to:
        - Understand the task
        - Break it into steps
        - Execute commands step-by-step
        - Observe outputs
        - Adjust actions until the task is complete

        Tools:
        - executeCommand(command: string): this tool takes the command as argument and execute the command in shell and return the result/output of the command call. Observe the output and take next 

        Rules:
        - Always break the task in multiple steps and execute one step at a time.
        - Follow the output format strictly. 
        - Work iteratively: START → THINK → TOOL_CALL → OBSERVE → repeat → OUTPUT
        - After tool call observe the output and take next steps accordingly.
        - Always perform only one step at a time and wait for other step.
        - Alway make sure to do multiple steps of thinking before giving out output.
        - Do NOT run commands that access sensitive data (e.g. .env, printenv)
        - Never make any destructive operations like (rm -rf /)

        Output Format:
        { "stepType": "START | THINK | TOOL_CALL | OBSERVE | OUTPUT", "content": "string" }

        Example:
        Step 1: User: Which Node version is installed in my system?
        Step 2: Assistant: { "stepType": "START", "content":"User wants to know the Node version installed in his system." }
        Step 3: Assistant: { "stepType": "THINK", "content":"Let me check is there any CLI command to know the Node version in the system." }
        Step 4: Assistant: { "stepType": "THINK", "content":"The CLI command to get the Node version is "node --version"."} 
        Step 5: Assistant: { "stepType": "TOOL_CALL", "tool":"executeCommand", "arg":"node --version" }
        Step 6: DEVELOPER: { "stepType": "OBSERVE", "exitCode":0 , "stdout":"v24.14.1" }
        Step 7: Assistant: { "stepType": "THINK", "content":"I get the result." }
        Step 8: Assistant: { "stepType": "OUTPUT", "content":"You have Node version v24.14.1 installed in you system." }
    `;


async function runAgent() {
    let messages: Array<ResponseInputItem> = [
        { role: "system", content: SYSTEM_PROMPT },
        // { role: "user", content: "Create an expense tracking appliction using HTML, CSS and Javascript. Create a new folder for that ex:ExpenseTracker and build the project inside that folder only." },
        { role: "user", content: "is git initialized in this project." },
    ];

    while (true) {
        let response = await openai.responses.create({
            model: "gpt-4.1-mini",
            input: messages
        });

        let rawContent = response.output_text;
        let parsedContent: AgentResponse = JSON.parse(rawContent);

        messages.push({ role: "assistant", content: rawContent }); // maintain context.

        if (parsedContent.stepType == "START") {
            console.log(`✈️ - ${parsedContent.content}`);
        }
        else if (parsedContent.stepType == "THINK") {
            console.log(`\t💭 - ${parsedContent.content}`);
        }
        else if (parsedContent.stepType == "TOOL_CALL") {
            let toolName = parsedContent.tool!;
            let arg = parsedContent.arg!;

            if (!toolCollection[toolName]) {
                messages.push({
                    role: "developer",
                    content: `The tool ${toolName} doesn't exist.`
                })
            }
            else {
                console.log(`\t🛠️ - Calling tool ${toolName}(${arg}) `);
                let commandOutput = await toolCollection[toolName](arg);

                messages.push({
                    role: "developer",
                    content: JSON.stringify({
                        stepType: "OBSERVE",
                        exitCode: commandOutput.exitCode,
                        stdout: commandOutput.stdout
                    })
                });
            }

        }
        else {
            console.log(`📊 - ${parsedContent.content}`);
            break;
        }
    }
}

async function main() {
    await runAgent();
}

main();