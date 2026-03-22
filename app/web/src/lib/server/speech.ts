import type { SpeechCapabilities } from "@/lib/data/contracts";

import { getOpenAIClient } from "@/lib/server/openai";

const acceptedMimeTypes = [
  "audio/webm",
  "audio/mp4",
  "audio/m4a",
  "audio/wav",
  "audio/mpeg"
];

export function getSpeechCapabilities(): SpeechCapabilities {
  const model = process.env.OPENAI_TRANSCRIPTION_MODEL ?? "gpt-4o-mini-transcribe";
  const hasOpenAI = Boolean(process.env.OPENAI_API_KEY);

  return {
    provider: hasOpenAI ? `openai:${model}` : "browser-or-placeholder",
    enabled: true,
    acceptedMimeTypes,
    warning: hasOpenAI
      ? undefined
      : "Server-side transcription is ready, but it will stay in placeholder mode until OPENAI_API_KEY is configured."
  };
}

export async function transcribeAudio(formData: FormData) {
  const file = formData.get("audio");

  if (!(file instanceof File)) {
    throw new Error("Missing audio file.");
  }

  const client = getOpenAIClient();
  const model = process.env.OPENAI_TRANSCRIPTION_MODEL ?? "gpt-4o-mini-transcribe";

  if (client) {
    const transcription = await client.audio.transcriptions.create({
      file,
      model,
      language: "es"
    });

    return {
      transcript: transcription.text.trim(),
      provider: `openai:${model}`
    };
  }

  return {
    transcript: "",
    provider: "placeholder",
    warning: `Received ${file.type || "audio"} (${file.size} bytes), but no STT provider is configured yet.`
  };
}
