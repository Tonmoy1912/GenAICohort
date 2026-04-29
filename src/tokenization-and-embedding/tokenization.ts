import { get_encoding, encoding_for_model } from "tiktoken";

const enc = get_encoding("gpt2");
// const enc = get_encoding("gpt5");

// let tokens= enc.encode("Hi! I am Tonmoy.");
let tokens= enc.encode("does Copilot CLI has same level access of GitHub repos and organisation that I have?");
console.log({tokens});

let decodedStr= enc.decode(tokens);
console.log({decodedStr});