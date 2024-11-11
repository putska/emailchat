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
    console.log("messages: ", messages);
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
        {
          type: "function",
          function: {
            name: "block_email_sender",
            description:
              "Block emails from a specific domain by moving them to Trash",
            parameters: {
              type: "object",
              required: ["domain"],
              properties: {
                domain: {
                  type: "string",
                  description:
                    "The domain of the sender to block (e.g., example.com)",
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
            name: "archive_email_sender",
            description:
              "Archive emails from a specific domain by removing them from Inbox",
            parameters: {
              type: "object",
              required: ["domain"],
              properties: {
                domain: {
                  type: "string",
                  description:
                    "The domain of the sender to archive (e.g., example.com)",
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
    console.log("response data: ", data);
    const toolCalls = data.choices?.[0]?.message?.tool_calls;
    if (toolCalls && toolCalls.length > 0) {
      // Extract the first tool call
      const functionCall = toolCalls[0];
      // ensure the type is "function" before proceeding
      if (functionCall.type === "function") {
        const functionName = functionCall.function?.name;
        const functionArgs = functionCall.function?.arguments
          ? JSON.parse(functionCall.function.arguments)
          : {};
        console.log("Function Name:", functionName);
        console.log("Function Arguments:", functionArgs);
        // Route based on function name
        if (functionName === "fetch_unread_emails") {
          return handleFetchUnreadEmails(functionArgs);
        } else if (functionName === "send_reply") {
          return handleSendReply(functionArgs);
        } else if (functionName === "block_email_sender") {
          console.log("Block email sender function detected.");
          const domain = functionArgs.domain;
          const blockResponse = await fetch(
            `${process.env.NEXT_PUBLIC_BASE_URL}/api/blockemail/${domain}`,
            { method: "POST" }
          );

          if (!blockResponse.ok) {
            console.error(
              "Failed to block sender:",
              await blockResponse.text()
            );
            return NextResponse.json(
              { error: "Failed to block sender" },
              { status: 500 }
            );
          }

          return NextResponse.json({
            message: `Sender from ${domain} blocked successfully.`,
          });
        } else if (functionName === "archive_email_sender") {
          console.log("Archive email sender function detected.");
          const domain = functionArgs.domain;
          const archiveResponse = await fetch(
            `${process.env.NEXT_PUBLIC_BASE_URL}/api/clearemail/${domain}`,
            { method: "POST" }
          );
          if (!archiveResponse.ok) {
            console.error(
              "Failed to archive sender:",
              await archiveResponse.text()
            );
            return NextResponse.json(
              { error: "Failed to archive sender" },
              { status: 500 }
            );
          }
          return NextResponse.json({
            message: `Sender from ${domain} archived successfully.`,
          });
        }
      }
    } else {
      console.log("No function call detected in response.");
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
