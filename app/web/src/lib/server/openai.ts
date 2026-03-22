import OpenAI from "openai";

declare global {
  // eslint-disable-next-line no-var
  var __crcOpenAIClient: OpenAI | undefined;
}

export function getOpenAIClient() {
  if (!process.env.OPENAI_API_KEY) {
    return null;
  }

  if (!globalThis.__crcOpenAIClient) {
    globalThis.__crcOpenAIClient = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    });
  }

  return globalThis.__crcOpenAIClient;
}
