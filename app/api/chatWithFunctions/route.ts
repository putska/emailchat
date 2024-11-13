import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import { handleFetchUnreadEmails } from "../../utils/handleFetchUnreadEmails";
import { handleSendReply } from "../../utils/handleSendReply";
import { handleArchiveEmail } from "../../utils/handleArchiveEmail";
import { handleTrashEmailSender } from "../../utils/handleTrashEmailSender";
import { handleArchiveEmailSender } from "../../utils/handleArchiveEmailSender";
import { handleTrashEmail } from "../../utils/handleTrashEmail";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(req: NextRequest) {
  try {
    const { messages } = await req.json();
    console.log("messages: ", messages);

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini", //gpt-4o,
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
            name: "archive_specific_email",
            description:
              "Archive a specific email by removing it from the Inbox",
            parameters: {
              type: "object",
              required: ["email_id"],
              properties: {
                email_id: {
                  type: "string",
                  description:
                    "The unique identifier of the email to archive. Not the index but the ID of the email.",
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
            name: "delete_specific_email",
            description:
              "Delete a specific email by removing it from the Inbox and putting it in the Trash",
            parameters: {
              type: "object",
              required: ["email_id"],
              properties: {
                email_id: {
                  type: "string",
                  description:
                    "The unique identifier of the email to archive.  Not the index but the ID of the email.",
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
              required: ["number_of_emails"],
              properties: {
                number_of_emails: {
                  type: "number",
                  description:
                    "The number of unread emails to fetch, typically set to 5",
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
              "Block all future emails from a specific domain by moving them to Trash",
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
              "Archive or Filter all future emails from a specific domain by always removing them from Inbox",
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
      const functionCall = toolCalls[0];

      if (functionCall.type === "function") {
        const functionName = functionCall.function?.name;
        const functionArgs = functionCall.function?.arguments
          ? JSON.parse(functionCall.function.arguments)
          : {};

        console.log("Function Name:", functionName);
        console.log("Function Arguments:", functionArgs);

        // Route based on function name
        if (functionName === "fetch_unread_emails") {
          const result = await handleFetchUnreadEmails(functionArgs);
          return NextResponse.json(result);
        } else if (functionName === "send_reply") {
          const result = await handleSendReply(functionArgs);
          return NextResponse.json(result);
        } else if (functionName === "block_email_sender") {
          const result = await handleTrashEmailSender(functionArgs.domain);
          return NextResponse.json(result);
        } else if (functionName === "archive_email_sender") {
          console.log("Archive email sender function detected.");
          const result = await handleArchiveEmailSender(functionArgs.domain);
          return NextResponse.json(result);
        } else if (functionName === "archive_specific_email") {
          console.log("Archive specific email function detected.");
          const result = await handleArchiveEmail(functionArgs.email_id);
          return NextResponse.json(result);
        } else if (functionName === "delete_specific_email") {
          console.log("Delete specific email function detected.");
          const result = await handleTrashEmail(functionArgs.email_id);
          return NextResponse.json(result);
        }
      }
    } else {
      console.log("No function call detected in response.");
    }

    // Send back the response in JSON format
    return NextResponse.json(response);
  } catch (error) {
    console.error("Error in API route:", error);
    return NextResponse.json(
      { error: "Error processing request" },
      { status: 500 }
    );
  }
}
