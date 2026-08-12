require('dotenv').config();
const axios = require('axios');
const cheerio = require('cheerio');

const STEAM_URL = 'https://store.steampowered.com/search/?hwtype=0&maxprice=free&category1=998&specials=1&ndl=1';
const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID;

async function checkSteamGames() {
    try {
        console.log('Checking Steam for free games...');
        
        // Fetch the Steam search page
        const response = await axios.get(STEAM_URL, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
            }
        });

        const $ = cheerio.load(response.data);
        const games = [];

        // Parse search results
        $('#search_resultsRows a').each((i, el) => {
            const title = $(el).find('.title').text().trim();
            const link = $(el).attr('href');
            // If the URL has a '?snr=' query parameter, we can strip it for a cleaner link
            const cleanLink = link.split('?')[0]; 
            
            if (title) {
                games.push({ title, link: cleanLink });
            }
        });

        if (games.length > 0) {
            console.log(`Found ${games.length} games. Sending notification...`);
            await sendTelegramNotification(games);
        } else {
            console.log('No games found currently matching the filters.');
        }

    } catch (error) {
        console.error('Error fetching Steam data:', error.message);
    }
}

async function sendTelegramNotification(games) {
    if (!TELEGRAM_BOT_TOKEN || !TELEGRAM_CHAT_ID) {
        console.error('Missing TELEGRAM_BOT_TOKEN or TELEGRAM_CHAT_ID in environment variables.');
        return;
    }

    let message = `🎮 <b>Нові безкоштовні ігри на Steam!</b>\n\n`;
    games.forEach((game, index) => {
        message += `${index + 1}. <a href="${game.link}">${game.title}</a>\n`;
    });
    
    message += `\n<a href="${STEAM_URL}">🔗 Переглянути всі</a>`;

    try {
        await axios.post(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
            chat_id: TELEGRAM_CHAT_ID,
            text: message,
            parse_mode: 'HTML',
            disable_web_page_preview: false
        });
        console.log('Notification sent successfully!');
    } catch (error) {
        console.error('Error sending Telegram message:', error.response?.data || error.message);
    }
}

// Run the check
checkSteamGames();
