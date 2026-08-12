require('dotenv').config();
const axios = require('axios');

const EPIC_URL = 'https://store.epicgames.com/free-games';
const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID;

async function checkEpicGames() {
    try {
        console.log('Checking Epic Games for free games...');
        
        const url = 'https://store-site-backend-static.ak.epicgames.com/freeGamesPromotions?locale=uk&country=UA&allowCountries=UA';
        const { data } = await axios.get(url);
        const elements = data.data.Catalog.searchStore.elements;
        
        const freeGamesRaw = elements.filter(game => {
            if (game.title.includes('Mystery Game')) return false;
            if (!game.promotions || !game.promotions.promotionalOffers || game.promotions.promotionalOffers.length === 0) return false;
            const offers = game.promotions.promotionalOffers[0].promotionalOffers;
            if (!offers || offers.length === 0) return false;
            const offer = offers[0];
            const now = new Date();
            const startDate = new Date(offer.startDate);
            const endDate = new Date(offer.endDate);
            return now >= startDate && now <= endDate && offer.discountSetting.discountPercentage === 0;
        });

        const games = freeGamesRaw.map(g => {
            let slug = g.productSlug;
            if (!slug && g.catalogNs && g.catalogNs.mappings && g.catalogNs.mappings.length > 0) {
                slug = g.catalogNs.mappings[0].pageSlug;
            }
            if (!slug && g.urlSlug) slug = g.urlSlug;

            return {
                title: g.title,
                link: slug ? `https://store.epicgames.com/p/${slug}` : EPIC_URL
            };
        });

        if (games.length > 0) {
            console.log(`Found ${games.length} free games on Epic. Sending notification...`);
        } else {
            console.log('No free games currently found on Epic Games. Sending empty notification...');
        }

        await sendTelegramNotification(games);

    } catch (error) {
        console.error('Error fetching Epic Games data:', error.message);
    }
}

async function sendTelegramNotification(games) {
    if (!TELEGRAM_BOT_TOKEN || !TELEGRAM_CHAT_ID) {
        console.error('Missing TELEGRAM_BOT_TOKEN or TELEGRAM_CHAT_ID in environment variables.');
        return;
    }

    let message = '';
    if (games.length > 0) {
        message = `🎁 <b>Нові безкоштовні ігри в Epic Games Store!</b>\n\n`;
        games.forEach((game, index) => {
            message += `${index + 1}. <a href="${game.link}">${game.title}</a>\n`;
        });
        message += `\n<a href="${EPIC_URL}">🔗 Перейти в магазин Epic Games</a>`;
    } else {
        message = `🎁 <b>Наразі роздача нових ігор в Epic Games ще не почалась або ігор немає.</b>\n\nМожете переконатися самі:\n<a href="${EPIC_URL}">🔗 Переглянути Epic Games Store</a>`;
    }

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
checkEpicGames();
