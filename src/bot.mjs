import "grammy-debug-edge";
import {Bot, InputFile} from "grammy";
import {autoRetry} from "@grammyjs/auto-retry";
import {autoQuote} from "@roziscoding/grammy-autoquote";

const isNode = typeof EdgeRuntime !== "string";

export const {
    API_URL: apiURL,
    TELEGRAM_BOT_TOKEN: token,
    TELEGRAM_SECRET_TOKEN: secretToken = String(token).split(":").pop(),
    TELEGRAM_FILES_URL: fileApiURL = `https://api.telegram.org/file/bot${token}/`,
} = process.env;

export const bot = new Bot(token);

bot.api.config.use(autoRetry({
    retryOnInternalServerErrors: true,
    maxRetryAttempts: 1,
    maxDelaySeconds: 10
}));

bot.use(autoQuote);

const safe = bot.errorBoundary(console.error);

safe.on(":sticker:is_animated", async ctx => {
    void ctx.replyWithChatAction("upload_document").catch(console.error);
    const file = await convert(await ctx.getFile());
    return ctx.replyWithDocument(file);
});

safe.on("::custom_emoji", async ctx => {
    void ctx.replyWithChatAction("upload_document").catch(console.error);
    const stickers = await ctx.getCustomEmojiStickers();
    const animated = stickers.filter(({is_animated} = {}) => is_animated);
    if (!animated.length) return ctx.reply("Send animated (vector) emoji");
    for (const index in animated) {
        try {
            void ctx.replyWithChatAction("upload_document").catch(console.error);
            const {file_id} = animated[index];
            const file = await ctx.api.getFile(file_id);
            const filename = [parseInt(index) + 1, "svg"].join(".");
            const svg = await convert(file, filename);
            await ctx.replyWithDocument(svg);
        } catch (e) {
            console.error(e);
        }
    }
});

safe.on("msg", ctx => ctx.reply(`Send animated sticker or custom emoji`));

async function convert({file_path} = {}, filename = "sticker.svg", frame) {
    const tgsResponse = await fetch(new URL(file_path, fileApiURL).href);
    const url = new URL(apiURL)
    if (frame) url.searchParams.set('frame', frame)
    const svgResponse = await fetch(url, {
        body: isNode ? await tgsResponse.blob() : tgsResponse.body,
        headers: {"Content-Type": "application/octet-stream"},
        method: "POST",
    });
    const svg = await svgResponse.blob();
    const result = isNode ? svg.stream() : svg;
    return new InputFile(result, filename);
}
