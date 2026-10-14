import OpenAI from "openai";
import { input } from "@inquirer/prompts";
import { type ChatCompletionMessageParam } from "openai/resources";

const client = new OpenAI({
  baseURL: process.env.LLAMA_BASE_URL || "http://127.0.0.1:8888/v1",
  apiKey: process.env.LLAMA_API_KEY || "local",
  maxRetries: 0,
  timeout: 120_000,
});

console.log("Local assistant — type end to finish.");

let currentMessage = {
  role: "user" as const,
  content: await input({ message: "You: " }),
};
const messages: ChatCompletionMessageParam[] = [];
