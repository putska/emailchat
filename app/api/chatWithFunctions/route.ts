// route.ts
import { NextRequest, NextResponse } from "next/server";
//import { Configuration, OpenAIApi } from "openai-edge";
import OpenAI from "openai";
import { handleFetchUnreadEmails } from "../../utils/handleFetchUnreadEmails";
import { handleSendReply } from "../../utils/handleSendReply";

//const config = new Configuration({
//  apiKey: process.env.OPENAI_API_KEY,
//});
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(req: NextRequest) {
  try {
    const { messages } = await req.json();

    // Make the call to OpenAI's GPT-4 model
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: messages,
      temperature: 1,
      max_tokens: 2048,
      top_p: 1,
      frequency_penalty: 0,
      presence_penalty: 0,
      tools: [
        {
          type: "function",
          function: {
            name: "send_reply",
            description: "Send a reply to a specific email",
            parameters: {
              type: "object",
              required: ["email_address", "reply_message", "subject"],
              properties: {
                email_address: {
                  type: "string",
                  description:
                    "The email address to which the reply will be sent",
                },
                reply_message: {
                  type: "string",
                  description: "The message content of the reply",
                },
                subject: {
                  type: "string",
                  description: "Subject line for the reply email",
                },
              },
              additionalProperties: false,
            },
            strict: true,
          },
        },
        {
          type: "function",
          function: {
            name: "fetch_unread_emails",
            description: "Fetch the last 5 unread emails from a mailbox",
            parameters: {
              type: "object",
              required: [
                "mailbox_id",
                "number_of_emails",
                "include_attachments",
              ],
              properties: {
                mailbox_id: {
                  type: "string",
                  description:
                    "Unique identifier for the mailbox to fetch emails from",
                },
                number_of_emails: {
                  type: "number",
                  description:
                    "The number of unread emails to fetch, typically set to 5",
                },
                include_attachments: {
                  type: "boolean",
                  description:
                    "Flag to indicate whether to include attachments in the fetched emails",
                },
              },
              additionalProperties: false,
            },
            strict: true,
          },
        },
      ],
      parallel_tool_calls: true,
      response_format: {
        type: "text",
      },
    });

    const data = response;
    console.log(data);
    const functionCall = (data as any)?.function_call;
    if (functionCall) {
      const { name, parameters } = functionCall;
      console.log("name: ", name);
      console.log("parameters: ", parameters);
      // Route based on action
      if (name === "fetch_unread_emails") {
        return handleFetchUnreadEmails(parameters);
      } else if (name === "send_reply") {
        return handleSendReply(parameters);
      }
    }

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

// fetch_unread_emails({
//   mailbox_id: "12345",
//   number_of_emails: 5,
//   include_attachments: true,})

// send_reply({
//   "email_address": "steve@division8.com",
//   "reply_message": "Thank you for reaching out. I will get back to you shortly.",
//   "subject": "Re: Your Inquiry",
// })
