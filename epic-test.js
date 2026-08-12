const axios = require('axios');

async function testEpic() {
    const url = 'https://store-site-backend-static.ak.epicgames.com/freeGamesPromotions?locale=uk&country=UA&allowCountries=UA';
    const { data } = await axios.get(url);
    const elements = data.data.Catalog.searchStore.elements;
    
    const freeGames = elements.filter(game => {
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

    console.log(JSON.stringify(freeGames.map(g => ({
        title: g.title,
        productSlug: g.productSlug,
        mappings: g.catalogNs?.mappings
    })), null, 2));
}
testEpic();
