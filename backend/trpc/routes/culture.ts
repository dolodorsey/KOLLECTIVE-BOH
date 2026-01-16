import { createTRPCRouter, publicProcedure } from '../create-context';
import { quotes, commandments, mascotAffirmations, brandMoods } from '../../../mocks/culture';

export const cultureRouter = createTRPCRouter({
  getAll: publicProcedure.query(async () => {
    return {
      quotes,
      commandments,
      mascotAffirmations,
      brandMoods,
      dailyQuote: quotes[Math.floor(Math.random() * quotes.length)],
      dailyAffirmation: mascotAffirmations[Math.floor(Math.random() * mascotAffirmations.length)],
      currentMood: brandMoods[Math.floor(Math.random() * brandMoods.length)],
    };
  }),
});
