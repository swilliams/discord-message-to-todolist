import "dotenv/config";

import { InstallGlobalCommands, MESSAGE_COMMAND_TYPE } from "./utils.js";

const INTEGRATION_TYPE_USER = 1;
const CONTEXT_GUILD = 0;
const CONTEXT_BOT_DM = 1;
const CONTEXT_PRIVATE_CHANNEL = 2;

const WEBHOOK_COMMAND = {
  name: "Send to Todolist",
  type: MESSAGE_COMMAND_TYPE,
  integration_types: [INTEGRATION_TYPE_USER],
  contexts: [CONTEXT_GUILD, CONTEXT_BOT_DM, CONTEXT_PRIVATE_CHANNEL],
};

const ALL_COMMANDS = [WEBHOOK_COMMAND];

InstallGlobalCommands(process.env.APP_ID, ALL_COMMANDS);
