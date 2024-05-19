import "dotenv/config";

import { InteractionResponseType, InteractionType } from "discord-interactions";

import { VerifyDiscordRequest } from "./utils.js";
import express from "express";
import fetch from "node-fetch";

// Create an express app
const app = express();
// Get port, or default to 3000
const PORT = process.env.PORT || 3000;
// Parse request body and verifies incoming requests using discord-interactions package
app.use(express.json({ verify: VerifyDiscordRequest(process.env.PUBLIC_KEY) }));

/**
 * Interactions endpoint URL where Discord will send HTTP requests
 */
app.post("/interactions", async function (req, res) {
  // Interaction type and data
  const { type, data } = req.body;

  /**
   * Handle verification requests
   */
  if (type === InteractionType.PING) {
    return res.send({ type: InteractionResponseType.PONG });
  }

  // Log request bodies
  //   console.log('****** BODY ******');
  //   console.log(req.body);

  if (type === InteractionType.APPLICATION_COMMAND) {
    const { name } = data;

    if (name === "Send to Todolist") {
      const EPHEMERAL = 64;
      const message = Object.values(data.resolved?.messages)[0];
      const webhookURL = process.env.WEBHOOK_URL;
      const postBody = {
        messageContent: message.content,
        messageURL: `https://discord.com/channels/${req.body.guild_id}/${message.channel_id}/${message.id}`,
        author: message.author.username,
        authorGlobalName: message.author.global_name,
      };

      const webhookResponse = await fetch(webhookURL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(postBody),
      });

      let messageContent = webhookResponse.ok
        ? "✅ Message sent to webhook."
        : "Error: " + (await webhookResponse.text());

      // Send a message into the channel where command was triggered from
      return res.send({
        type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
        data: {
          content: messageContent,
          flags: EPHEMERAL,
        },
      });
    }
  }
});

app.listen(PORT, () => {
  console.log("Listening on port", PORT);
});
