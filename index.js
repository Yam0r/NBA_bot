const { Telegraf, Markup, Extra } = require('telegraf');
const fetch = require('node-fetch');
require('dotenv').config();

const { BOT_TOKEN } = process.env;
const bot = new Telegraf(BOT_TOKEN);

const api_teams = "https://www.balldontlie.io/api/v1/teams";
const api_players = 'https://www.balldontlie.io/api/v1/players'; // це тобі на майбутнє, цей ендпоінт поверне всіх гравців

let dataFromServer = [];

function getDataFromServer(forceFetch = false, api) {
  if (!forceFetch) {
      return;
  }

  return fetch(api, 
  {
      method: 'GET', 
      headers: {'Content-Type': 'application/json'}
  })
  .then(response => response.json())
  .then(data => {
      dataFromServer = data.data;
      console.log(dataFromServer);
  })   
}


bot.start(ctx => {
  ctx.replyWithHTML("Welcome to my bot", Markup.inlineKeyboard([
    Markup.button.callback('Всі команди', 'allTeams'),
    Markup.button.callback('Button 2', 'button2'), //тут зроби "всі гравці"
    Markup.button.callback('Button 3', 'button3'), // тут зроби "пошук гравця"
  ]))
});


bot.hears(/hi/i, (ctx) => {ctx.reply('Hi to you too')})

let currentIndex = 0;
let sentMessageId = null;

async function sendTeamInfo(ctx) {
  const team = dataFromServer[currentIndex];

  const message = `
    <b>${team.full_name}</b>
    City: ${team.city}
    `;
//тут всі поля виведи

  await ctx.telegram.editMessageCaption(
      ctx.chat.id,
      sentMessageId,
      null,
      message,
      { parse_mode: 'HTML', ...Markup.inlineKeyboard([
        [{ text: 'Попередня команда', callback_data: 'previous' }],
        [{ text: 'Наступна команда', callback_data: 'next' }],
      ])}
  );
}

bot.action('previous', (ctx) => {
  currentIndex = (currentIndex - 1 + dataFromServer.length) % dataFromServer.length;
  sendTeamInfo(ctx);
});

bot.action('next', (ctx) => {
  currentIndex = (currentIndex + 1) % dataFromServer.length;
  sendTeamInfo(ctx);
});

//це зараз працює і красиво показує команди
bot.action('allTeams', async (ctx) => {
  await getDataFromServer(dataFromServer.length == 0, api_teams);
  const team = dataFromServer[currentIndex];

  const message = `
    <b>${team.full_name}</b>
    City: ${team.city}

    `;
//тут всі поля виведи

    const sentMessage = await ctx.replyWithPhoto({ url: 'https://robohash.org/1' }, {
        caption: message,
        parse_mode: 'HTML',
        reply_markup: {
            inline_keyboard: [
                [{ text: 'Попередня команда', callback_data: 'previous' }],
                [{ text: 'Наступна команда', callback_data: 'next' }],
            ],
        },
    });

    // Store the sent message ID
    sentMessageId = sentMessage.message_id;

});

bot.action('previous', (ctx) => {
  currentIndex = (currentIndex - 1 + data.length) % data.length;
  sendPlayerInfo(ctx);
});

bot.action('next', (ctx) => {
  currentIndex = (currentIndex + 1) % data.length;
  sendPlayerInfo(ctx);
});


// це нижче тобі заготовки
bot.action('button2', (ctx) => {
  ctx.reply('You clicked Button 2!');
});

bot.action('button3', (ctx) => {
  ctx.reply('You clicked Button 3!');
});



bot.launch();