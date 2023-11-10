const { Telegraf, Markup } = require('telegraf');
const fetch = require('node-fetch');
require('dotenv').config();

const { BOT_TOKEN } = process.env;
const bot = new Telegraf(BOT_TOKEN);
const api = 'https://rapidapi.com/api-sports/api/api-basketball';

let dataFromServer = [];

bot.start(ctx => 
  {ctx.replyWithHTML("Welcome to my bot")});
bot.hears(/hi/i, (ctx) => {ctx.reply('Hi to you too')})

bot.hears(/[A-Z]+/i, async (ctx) =>{ 
  console.log(ctx.message.text);
  const key = ctx.message.text;
  await getDataFromServer(dataFromServer.length == 0);
  ctx.reply(`data :>> ${dataFromServer[key]}`);
});


bot.launch();