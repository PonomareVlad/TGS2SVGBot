import {bot} from "../../src/bot.mjs";
import {callbackHandler} from "grammy-tasks";

export const config = {runtime: "edge"};

export default callbackHandler(bot);
