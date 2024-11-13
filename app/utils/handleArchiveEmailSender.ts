// src/lib/handleTrashDomainEmails.ts

import { getGmailClient } from "../utils/tokens"; // Adjust the path as needed

export async function handleArchiveEmailSender(domain: string) {
  console.log("Entering handleArchiveEmailSender");
  console.log("Domain:", domain);

  try {
    const gmail = await getGmailClient(); // Get the configured Gmail client

    // Retrieve existing filters
    const filtersResponse = await gmail.users.settings.filters.list({
      userId: "me",
    });
    const filters = filtersResponse.data.filter || [];

    // Find an existing filter that removes emails from the INBOX based on "from" criteria
    let existingFilter = filters.find(
      (filter) =>
        filter.action?.removeLabelIds?.includes("INBOX") &&
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
      console.log(`Deleted existing filter for domain: ${domain}`);
    }

    // Create a new filter to move emails from the specified domain to All Mail (remove from INBOX)
    await gmail.users.settings.filters.create({
      userId: "me",
      requestBody: {
        criteria: { from: newCriteria },
        action: { removeLabelIds: ["INBOX"] },
      },
    });
    return {
      success: true,
      message: `Filter created or updated for domain: ${domain}`,
    };
    console.log(
      `Filter created or updated to remove emails from domain: ${domain} from the INBOX`
    );
  } catch (error) {
    console.error("Error managing filter for domain:", error);
    if (error instanceof Error) {
      console.error(error.stack);
    }
    throw new Error("Failed to create or update filter for domain");
  }
}
