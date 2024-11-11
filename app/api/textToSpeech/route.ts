// /app/api/textToSpeech/route.ts
import { NextResponse } from "next/server";
import OpenAI from "openai";
import { env } from "@/app/config/env";

const openai = new OpenAI({
  apiKey: env.OPENAI_API_KEY,
});

export async function POST(req: Request) {
  const { text } = await req.json();

  try {
    const ttsResponse = await openai.audio.speech.create({
      model: "tts-1",
      voice: "alloy",
      input: text,
    });

    const audioBuffer = await ttsResponse.arrayBuffer();
    return new Response(audioBuffer, {
      headers: { "Content-Type": "audio/mpeg" },
    });
  } catch (error) {
    console.error("Error generating speech:", error);
    return NextResponse.error();
  }
}
