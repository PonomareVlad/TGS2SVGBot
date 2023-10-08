import {bot} from "../../src/bot.mjs";
import {runHandler} from "grammy-tasks";

export const config = {runtime: "edge"};

export default runHandler(bot);
