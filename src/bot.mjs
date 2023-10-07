import {Bot, InputFile} from "grammy";
import {autoQuote} from "@roziscoding/grammy-autoquote";

const isNode = typeof EdgeRuntime !== "string";

export const {
    API_URL: apiURL,
    TELEGRAM_BOT_TOKEN: token,
    TELEGRAM_SECRET_TOKEN: secretToken = String(token).split(":").pop(),
    TELEGRAM_FILES_URL: fileApiURL = `https://api.telegram.org/file/bot${token}/`,
} = process.env;

export const bot = new Bot(token);

bot.use(autoQuote);

const safe = bot.errorBoundary(console.error);

safe.on(":sticker:is_animated", async ctx => {
    await ctx.replyWithChatAction("upload_document");
    const file = await convert(await ctx.getFile());
    return ctx.replyWithDocument(file);
});

safe.on("::custom_emoji", async ctx => {
    await ctx.replyWithChatAction("upload_document");
    const stickers = await ctx.getCustomEmojiStickers();
    const animated = stickers.filter(({is_animated} = {}) => is_animated);
    if (!animated.length) return ctx.reply("Send animated (vector) emoji");
    return Promise.all(animated.map(async ({file_id}, index) => {
        const file = await ctx.api.getFile(file_id);
        const filename = [++index, "svg"].join(".");
        const svg = await convert(file, filename);
        return ctx.replyWithDocument(svg);
    }));
});

safe.on("msg", ctx => ctx.reply(`Send animated sticker or custom emoji`));

async function convert({file_path} = {}, filename = "sticker.svg") {
    const tgsResponse = await fetch(new URL(file_path, fileApiURL).href);
    const svgResponse = await fetch(apiURL, {
        body: isNode ? await tgsResponse.blob() : tgsResponse.body,
        headers: {"Content-Type": "application/octet-stream"},
        method: "POST",
    });
    const svg = await svgResponse.blob();
    const result = isNode ? svg.stream() : svg;
    return new InputFile(result, filename);
}
