const path = require('path');
const { Telegraf, Markup } = require('telegraf');
const fetch = require('node-fetch');
require('dotenv').config();

const { BOT_TOKEN } = process.env;
const bot = new Telegraf(BOT_TOKEN);

const api_teams = "https://www.balldontlie.io/api/v1/teams";
const api_players = "https://www.balldontlie.io/api/v1/players";

let dataFromServer = [];

function getDataFromServer(forceFetch = false, api) {
  if (!forceFetch) {
    return;
  }

  return fetch(api, {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
  })
    .then((response) => response.json())
    .then((data) => {
      dataFromServer = data.data;
      console.log(dataFromServer);
    });
}

bot.start((ctx) => {
  ctx.replyWithHTML("Welcome to my bot", Markup.inlineKeyboard([
    Markup.button.callback('Всі команди', 'allTeams'),
    Markup.button.callback('Пошук гравця', 'button3'),
  ]));
});

let currentIndex = 0;


async function sendTeamInfo(ctx) {
  const team = dataFromServer[currentIndex];

  const message = `
    <b>${team.full_name}</b>
    Abbreviation: ${team.abbreviation}
    City: ${team.city}
    Name: ${team.full_name}
    Division: ${team.division}
  `;


  const imagePath = path.join(__dirname, 'images', `${team.id}.png`);
  const imageBuffer = require('fs').readFileSync(imagePath);

  await ctx.telegram.sendDocument(
    ctx.chat.id,
    { source: imageBuffer, filename: 'image.png' },
    {
      caption: message,
      parse_mode: 'HTML',
      ...Markup.inlineKeyboard([
        [{ text: 'Попередня команда', callback_data: 'previous' }],
        [{ text: 'Початкове меню', callback_data: 'mainMenu' }],
        [{ text: 'Наступна команда', callback_data: 'next' }],
      ]),
    }
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



bot.action('allTeams', async (ctx) => {
  await getDataFromServer(dataFromServer.length === 0, api_teams);
  sendTeamInfo(ctx);
});


bot.action('button3', (ctx) => {
  ctx.reply('Введіть ім\'я та прізвище гравця (наприклад, LeBron James або Alex Abrines):');


  const textHandler = async (ctx) => {
    const fullName = ctx.message.text.trim();


    await searchPlayer(fullName, ctx);
  };


  bot.on('text', textHandler);
});


async function searchPlayer(fullName, ctx) {
  const response = await fetch(`${api_players}?search=${encodeURIComponent(fullName)}`);
  const data = await response.json();

  const foundPlayers = data.data;

  if (foundPlayers.length === 0) {
    ctx.reply(`Гравця ${fullName} не знайдено.`);
  } else {

    for (const player of foundPlayers) {
      await sendPlayerInfo(ctx, player);
    }
  }
}


async function sendPlayerInfo(ctx, player) {
  const message = `
    <b>${player.first_name} ${player.last_name}</b>
    Позиція: ${player.position}
    Команда: ${player.team.full_name}
  `;

  await ctx.replyWithHTML(message, Markup.inlineKeyboard([
    [{ text: 'Початкове меню', callback_data: 'mainMenu' }],
  ]));
}


bot.action('mainMenu', (ctx) => {
  ctx.replyWithHTML("З поверненням!", Markup.inlineKeyboard([
    Markup.button.callback('Всі команди', 'allTeams'),
    Markup.button.callback('Пошук гравця', 'button3'),
  ]));
});



bot.launch();

