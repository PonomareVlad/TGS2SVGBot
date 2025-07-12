// noinspection JSUnusedGlobalSymbols

import {webhookStream} from "vercel-grammy";
import {bot, secretToken} from "../src/bot.mjs";

export const config = {runtime: "edge"};

export default webhookStream(bot, {
    timeoutMilliseconds: 59_000,
    secretToken,
});
