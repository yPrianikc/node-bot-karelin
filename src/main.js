import { session, Telegraf } from 'telegraf';
import config from 'config';
import { message } from 'telegraf/filters';
import { ogg } from './ogg.js';
import { openai } from './openai.js';
import { code } from 'telegraf/format';

const KEYBOARD = {
    reply_markup: {
        inline_keyboard: [
            [
                {
                    text: 'Начать новое общение',
                    callback_data: 'start_over',
                    resize_keyboard: true,
                    height: 60
                }
            ]
        ]
    }
};
const INITIAL_SESSION = {
    messages: []
};
const bot = new Telegraf(config.get('TELEGRAM_TOKEN'));

bot.use(session());

bot.telegram.setMyCommands([{ command: '/new', description: 'Новый диалог.' }]);

bot.command('new', async ctx => {
    ctx.session ??= INITIAL_SESSION;
    await ctx.reply('Вы начали новый диалог...');
});

bot.command('start', async ctx => {
    ctx.session ??= INITIAL_SESSION;
    await ctx.reply(
        'Здравствуйте, я умный помощник, я понимаю текстовые и голосовые сообщения, спросите меня о чем нибудь.'
    );
});

bot.action('start_over', async ctx => {
    ctx.session ??= INITIAL_SESSION;
    try {
        await ctx.telegram.editMessageText(
            ctx.chat.id,
            ctx.callbackQuery.message.message_id,
            null,
            code('Диалог сброшен')
        );
    } catch (error) {
        console.error(error);
    }
});

bot.on(message('voice'), async ctx => {
    ctx.session ??= INITIAL_SESSION;
    try {
        const link = await ctx.telegram.getFileLink(ctx.message.voice.file_id);
        const user_id = String(ctx.message.from.id);
        const oggPath = await ogg.create(link.href, user_id);
        const mp3Path = await ogg.toMp3(oggPath, user_id);
        const text = await openai.transcription(mp3Path);
        await ctx.reply(code(`${text}`));
        ctx.session.messages.push({ role: openai.roles.USER, content: text });
        await openaiChatResponseHandler(ctx);
    } catch (e) {
        console.log('Ошибка при обработке голосового сообщения', e.message);
    }
});

bot.on(message('text'), async ctx => {
    ctx.session ??= INITIAL_SESSION;
    try {
        const user_id = String(ctx.message.from.id);
        const text = ctx.message.text;
        ctx.session.messages.push({ role: openai.roles.USER, content: text });
        await openaiChatResponseHandler(ctx);
    } catch (e) {
        console.log('Ошибка при обработке текстового сообщения', e.message);
    }
});
const openaiChatResponseHandler = async ctx => {
    try {
        const response = await openai.chat(ctx.session.messages);
        ctx.session.messages.push({
            role: openai.roles.ASSISTANT,
            content: response.content
        });
        await ctx.reply(response.content);
    } catch (e) {
        if (e?.response?.status === 400) {
            if (e.response?.data?.error?.code === 'context_length_exceeded') {
                await ctx.replyWithMarkdown(
                    code(`Вы превысили максимальную дину контекста.`),
                    KEYBOARD
                );
            }
        }
        if (e.response.status === 429) {
            await ctx.reply(
                'Слишком много запросов, пожалуйста попробуйте позже!'
            );
        }
        console.error(
            'Ошибка получения ответа от GPT чата | ',
            'code: ' + e.response?.data?.error?.code
                ? e.response?.data?.error?.code
                : e?.response?.message
        );
    }
};
bot.launch();

process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));

console.log(config.get('TEST_ENV'));
console.log('working stable...');
