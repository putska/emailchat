// src/app/api/archiveemail/[domain]/route.ts
import { google } from "googleapis";
import { NextResponse } from "next/server";
import { getTokens } from "../../../utils/tokens"; // Assume tokens retrieval

export async function POST(
  req: Request,
  { params }: { params: { domain: string } }
) {
  const { domain } = params;
  if (!domain) {
    return NextResponse.json({ error: "Domain is required" }, { status: 400 });
  }

  const tokens = await getTokens();
  if (!tokens) {
    return NextResponse.json(
      { error: "User not authenticated" },
      { status: 401 }
    );
  }

  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.NEXT_PUBLIC_REDIRECT_URI
  );
  oauth2Client.setCredentials(tokens);

  const gmail = google.gmail({ version: "v1", auth: oauth2Client });

  try {
    // Retrieve existing filters
    const response = await gmail.users.settings.filters.list({ userId: "me" });
    const filters = response.data.filter || [];

    // Find existing "clear" filter for archiving action
    let clearFilter = filters.find((filter) =>
      filter.action?.removeLabelIds?.includes("INBOX")
    );

    // Build the "from" criteria string
    const newCriteria = clearFilter?.criteria?.from
      ? `${clearFilter.criteria.from} OR @${domain}`
      : `@${domain}`;

    // If the filter exists, update it; otherwise, create a new one
    if (clearFilter) {
      await gmail.users.settings.filters.delete({
        userId: "me",
        id: clearFilter.id!,
      });
    }

    await gmail.users.settings.filters.create({
      userId: "me",
      requestBody: {
        criteria: { from: newCriteria },
        action: { removeLabelIds: ["INBOX"] },
      },
    });

    return NextResponse.json({
      message: `Emails from ${domain} will be cleared from the inbox`,
    });
  } catch (error) {
    console.error("Error managing clear filter:", error);
    return NextResponse.json(
      { error: "Failed to manage clear filter" },
      { status: 500 }
    );
  }
}
