import * as slash from "https://raw.githubusercontent.com/indiainvestments/harmony/main/deploy.ts";
import { Embed } from "https://raw.githubusercontent.com/harmonyland/harmony/ce455c50c3af667a02077db5ffb79c5086510945/src/structures/embed.ts";
import { randomHexColorGen } from "./utils.ts";
import { GitbookSpaceClient } from "./gitbook_client.ts";
import { EmbedAuthor } from "https://raw.githubusercontent.com/indiainvestments/harmony/main/deploy.ts";

const { env } = Deno;
slash.init({
  env: true,
});

const GITBOOK_SPACE_ID = env.get("GITBOOK_SPACE_ID") ?? "";
const GITBOOK_TOKEN = env.get("GITBOOK_TOKEN") ?? "";
const GITBOOK_API_URL = env.get("GITBOOK_API_URL") ?? "";

const randomHexColor = randomHexColorGen();

const client = new GitbookSpaceClient(GITBOOK_TOKEN, {
  spaceId: GITBOOK_SPACE_ID,
  gitbookApiUrl: GITBOOK_API_URL,
});

// const cache = new Cache(client);
// await cache.fillData();

slash.registerHandler("faq", async (interaction) => {
  console.log("handling faq");
  try {
    const results = await client.fetchContentOfPage('faqs');
    console.log(results);
    console.log("=============================");
    const pages = results.pages;

    let data = await client.fetchContentOfPage(`/faqs/${pages[0].path}`);
    let contents =  [data.pages.map((pg) => pg.title)];

    data = await client.fetchContentOfPage(`/faqs/${pages[1].path}`);
    contents.push(data.pages.map((pg) => pg.title));

    data = await client.fetchContentOfPage(`/faqs/${pages[2].path}`);
    contents.push(data.pages.map((pg) => pg.title));

    data = await client.fetchContentOfPage(`/faqs/${pages[3].path}`);
    contents.push(data.pages.map((pg) => pg.title));
    // const contents = [];
    // for (const page of pages) {
    //   const data = await client.fetchContentOfPage(`/faqs/${page.path}`);
    //   contents.push(data.pages.map((pg) => pg.title));
    // }
    // const contents = await Promise.all(pages.map(async (page) => {
    //     const data = await client.fetchContentOfPage(`/faqs/${page.path}`);
    //     return data.pages.map((pg) => pg.title);
    // }));

    console.log(contents);

    if (!contents.length) {
      return interaction.reply({
        content: `Nothing found`,
        ephemeral: true,
      });
    }
    // const resultsSize = results.length;
    // results = results.slice(0, 5);

    const embeds = [];
    const color = randomHexColor.next().value;

    // let desc = results.map((content: GitbookSearchNode) => {
    //   const description = cache.getValue(content.uid);
    //   return `**[${content.title}](${client.iiGitbookBaseUrl}/${content.path})**\n${
    //     (description && description !== "")
    //       ? description
    //       : "No description available."
    //   }`;
    // }).join("\n\n");
    // if (resultsSize > 5) {
    //   desc =
    //     `${desc}\n\n[click here more results from our wiki](${client.iiGitbookBaseUrl}/?q=${
    //       encodeURI(query.value)
    //     })`;
    // }
    const embed = new Embed()
      .setColor(color)
      .setDescription(JSON.stringify(contents))
      .setThumbnail("https://i.imgur.com/kSxwaQA.png");
    embeds.push(embed);

    // if (embeds.length <= 0) {
    //   return interaction.reply({
    //     content: `Nothing found for your query: \`${query.value}\``,
    //     ephemeral: true,
    //   });
    // }
    const author: EmbedAuthor = {
      name: interaction.user.username,
      "icon_url": interaction.user.avatarURL(),
    };
    embeds[0].setAuthor(author);
    // embeds[embeds.length - 1].setFooter(
    //   `\/wiki query: ${query.value} | retrieved in ${
    //     (timeTaken).toString().padEnd(3, "0")
    //   } seconds`,
    // );
    return interaction.respond({
      embeds,
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
