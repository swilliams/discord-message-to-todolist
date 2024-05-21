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

async function sendPostToWebhook(webhookURL, postBody) {
  return await fetch(webhookURL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(postBody),
  });
}

function getFirstMessageOrError(data) {
  if (data && data.resolved && data.resolved.messages) {
    const keys = Object.keys(data.resolved.messages);
    if (keys.length === 0) {
      throw new Error("messages object was empty");
    }
    return data.resolved.messages[keys[0]];
  }
  throw new Error("No message found in data");
}

function buildResponseBody(messageContent) {
  const EPHEMERAL_FLAG = 64;
  return {
    type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
    data: {
      content: messageContent,
      flags: EPHEMERAL_FLAG,
    },
  };
}

function sendErrorResponse(res, message) {
  console.error(message);
  return res.send(buildResponseBody(message));
}

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
      let message = {};
      try {
        message = getFirstMessageOrError(data);
      } catch (e) {
        return sendErrorResponse(res, e);
      }

      const webhookURL = process.env.WEBHOOK_URL;
      const postBody = {
        messageContent: message.content,
        messageURL: `https://discord.com/channels/${req.body.guild_id}/${message.channel_id}/${message.id}`,
        author: message.author.username,
        authorGlobalName: message.author.global_name,
      };

      const webhookResponse = await sendPostToWebhook(webhookURL, postBody);

      let messageContent = webhookResponse.ok
        ? "✅ Message sent to webhook."
        : "Error: " + (await webhookResponse.text());

      // Send a message into the channel where command was triggered from
      return res.send(buildResponseBody(messageContent));
    }
  }
});

app.listen(PORT, () => {
  console.log("Listening on port", PORT);
});
