const path = require('path');
const { Telegraf, Markup } = require('telegraf');
const fetch = require('node-fetch');
require('dotenv').config();

const { BOT_TOKEN, API_KEY } = process.env;
const bot = new Telegraf(BOT_TOKEN);

console.log(API_KEY); // Должен вывести ваш API ключ

const api_teams = "https://api.balldontlie.io/v1/teams";
const api_players = "https://api.balldontlie.io/v1/players"; // Исправлен URL для запроса информации о игроках

let dataFromServer = [];
let currentPlayers = [];
let currentPlayerIndex = 0;
let expectingPlayerName = false; // Добавляем состояние для отслеживания ввода имени игрока

async function getDataFromServer(forceFetch = false, apiURL = api_teams) {
    if (!forceFetch && dataFromServer.length > 0) {
        return;
    }

    return fetch(apiURL, {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': API_KEY
        },
    })
    .then((response) => {
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        return response.json();
    })
    .then((data) => {
        dataFromServer = data.data;
        console.log(dataFromServer);
    })
    .catch((error) => {
        console.error('Failed to fetch data:', error);
    });
}

bot.start((ctx) => {
    ctx.replyWithHTML("Вітаю!", Markup.inlineKeyboard([
        Markup.button.callback('Всі команди', 'allTeams'),
        Markup.button.callback('Пошук гравця', 'searchPlayer'),
    ]));
});

let currentIndex = 0;
async function sendTeamInfo(ctx) {
    const team = dataFromServer[currentIndex];
    const message = `
        <b>${team.full_name}</b>
        Abbreviation: ${team.abbreviation}
        City: ${team.city}
        Division: ${team.division}
    `;

    const imagePath = path.join(__dirname, 'images', `${team.id}.png`);
    try {
        const imageBuffer = require('fs').readFileSync(imagePath);
        await ctx.telegram.sendPhoto(
            ctx.chat.id,
            { source: imageBuffer },
            {
                caption: message,
                parse_mode: 'HTML',
                ...Markup.inlineKeyboard([
                    Markup.button.callback('Попередня команда', 'previous'),
                    Markup.button.callback('Наступна команда', 'next'),
                    Markup.button.callback('Початкове меню', 'mainMenu'),
                ]),
            }
        );
    } catch (error) {
        console.error('Error sending team info:', error);
        ctx.reply('Error sending team information.');
    }
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
    await getDataFromServer(dataFromServer.length === 0);
    sendTeamInfo(ctx);
});

bot.action('searchPlayer', (ctx) => {
    ctx.reply('Ведіть ім\'я та прізвище гравця (e.g., LeBron James):');
    expectingPlayerName = true; // Устанавливаем состояние ожидания ввода имени игрока
});

bot.on('text', async (ctx) => {
    if (expectingPlayerName) {
        const playerName = ctx.message.text.trim();
        const names = playerName.split(" "); // Разделение введенного текста на слова

        if (names.length === 2) {
            const [first_name, last_name] = names;
            await searchPlayer(first_name, last_name, ctx);
        } else {
            ctx.reply('Не правильне ім\'я гравця. Будь ласка, введіть ім\'я та прізвище (наприклад, LeBron James).');
        }
    }
});

async function searchPlayer(first_name, last_name, ctx) {
    const url = `${api_players}?first_name=${encodeURIComponent(first_name)}&last_name=${encodeURIComponent(last_name)}`;
    const response = await fetch(url, {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': API_KEY
        }
    });

    if (!response.ok) {
        const responseBody = await response.text();
        console.log('Response body:', responseBody); // Вывод тела ответа для диагностики
        ctx.reply(`HTTP error! Status: ${response.status}`);
        return;
    }

    const data = await response.json();
    currentPlayers = data.data;
    if (currentPlayers.length === 0) {
        ctx.reply(`Не знайдено гравців за іменем ${first_name} ${last_name}. Введіть інше ім'я:`, Markup.inlineKeyboard([
            Markup.button.callback('Завершити пошук', 'mainMenu')
        ]));
    } else {
        currentPlayerIndex = 0;
        sendPlayerInfo(ctx, currentPlayers[currentPlayerIndex]);
    }
}

async function sendPlayerInfo(ctx, player) {
    const message = `
        <b>${player.first_name} ${player.last_name}</b>
        Position: ${player.position}
        Team: ${player.team.full_name}
    `;
    await ctx.replyWithHTML(message, Markup.inlineKeyboard([
        Markup.button.callback('Завершити пошук', 'mainMenu')
    ]));
}

bot.action('mainMenu', (ctx) => {
    expectingPlayerName = false; // Resetting the flag
    ctx.replyWithHTML("Вітаємо знову!", Markup.inlineKeyboard([
        Markup.button.callback('Всі команди', 'allTeams'),
        Markup.button.callback('Пошук гравця', 'searchPlayer'),
    ]));
});

bot.launch();


