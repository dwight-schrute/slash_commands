import * as slash from "https://raw.githubusercontent.com/indiainvestments/harmony/main/deploy.ts";

const { env } = Deno;
slash.init({
  env: true,
});

const GITHUB_PAT = env.get('GITHUB_PAT') ?? '';
const GITHUB_API_DISPATCH_URL = env.get('GITHUB_API_DISPATCH_URL') ?? '';

slash.registerHandler("faq", async (interaction) => {
  console.log("handling faq");
  try {
    const apiData = await fetch(GITHUB_API_DISPATCH_URL, {
      headers: {
        Authorization: `Bearer ${GITHUB_PAT}`
      },
      method: 'POST'
    });

    console.log(apiData.status);

    return interaction.reply({
      content: `Dispatched giuthub action with status ${apiData.status}`,
      ephemeral: true,
    });
  } catch (err) {
    console.error("Error in handling wiki command", err);
    return interaction.reply({
      content: `Something went wrong`,
      ephemeral: true,
    });
  }
});

slash.registerHandler("*", (d) =>
  d.reply({
    content: `Unhandled command`,
    ephemeral: true,
  }));
slash.client.on("interactionError", console.error);
