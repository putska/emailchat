// route.ts
import { NextRequest, NextResponse } from "next/server";
import { Configuration, OpenAIApi } from "openai-edge";

const config = new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
});
const openai = new OpenAIApi(config);

export async function POST(req: NextRequest) {
  try {
    const { messages } = await req.json();

    // Make the call to OpenAI's GPT-4 model
    const response = await openai.createChatCompletion({
      model: "gpt-4",
      messages,
    });

    const data = await response.json();

    // Send back the response in JSON format
    return NextResponse.json(data);
  } catch (error) {
    console.error("Error in API route:", error);
    return NextResponse.json(
      { error: "Error processing request" },
      { status: 500 }
    );
  }
}
