import createContextHook from '@nkzw/create-context-hook';

import { quotes, commandments, mascotAffirmations, brandMoods } from '@/mocks/culture';

export const [CultureContext, useCulture] = createContextHook(() => {
  const randomQuote = quotes[Math.floor(Math.random() * quotes.length)] || '';
  const randomCommandment = commandments[Math.floor(Math.random() * commandments.length)] || '';
  const randomAffirmation = mascotAffirmations[Math.floor(Math.random() * mascotAffirmations.length)] || '';
  const randomMood = brandMoods[Math.floor(Math.random() * brandMoods.length)] || '';

  return {
    quoteOfTheDay: randomQuote,
    commandment: randomCommandment,
    affirmation: randomAffirmation,
    brandMood: randomMood
  };
});