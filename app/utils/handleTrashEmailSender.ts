// src/lib/handleTrashDomainEmails.ts

import { getGmailClient } from "./tokens"; // Adjust the path as needed

export async function handleTrashEmailSender(domain: string) {
  console.log("Entering handleTrashEmailSender");
  console.log("Domain:", domain);

  try {
    const gmail = await getGmailClient(); // Get the configured Gmail client

    // Retrieve existing filters
    const filtersResponse = await gmail.users.settings.filters.list({
      userId: "me",
    });
    const filters = filtersResponse.data.filter || [];

    // Find an existing filter that moves emails from this domain to Trash
    let existingFilter = filters.find(
      (filter) =>
        filter.action?.addLabelIds?.includes("TRASH") && // Only target filters with the "TRASH" label
        filter.criteria?.from?.includes(`@${domain}`)
    );

    // Construct the "from" criteria string, combining existing domains with the new one
    const newCriteria = existingFilter?.criteria?.from
      ? `${existingFilter.criteria.from} OR @${domain}`
      : `@${domain}`;

    // If a matching filter exists, delete it to update with the new criteria
    if (existingFilter) {
      await gmail.users.settings.filters.delete({
        userId: "me",
        id: existingFilter.id!,
      });
      console.log(
        `Deleted existing filter for domain: ${domain} that sends emails to Trash`
      );
    }

    // Create a new filter to move emails from the specified domain to Trash
    await gmail.users.settings.filters.create({
      userId: "me",
      requestBody: {
        criteria: { from: newCriteria },
        action: { addLabelIds: ["TRASH"], removeLabelIds: ["INBOX"] },
      },
    });

    console.log(
      `Filter created or updated to send emails from domain: ${domain} to Trash`
    );
  } catch (error) {
    console.error("Error managing filter for domain to Trash:", error);
    throw new Error("Failed to create or update filter for domain to Trash");
  }
}
