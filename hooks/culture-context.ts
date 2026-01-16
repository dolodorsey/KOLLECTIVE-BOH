import createContextHook from '@nkzw/create-context-hook';
import { trpc } from '@/lib/trpc';
import { quotes, commandments, mascotAffirmations, brandMoods } from '@/mocks/culture';

export const [CultureContext, useCulture] = createContextHook(() => {
  const cultureQuery = trpc.culture.getAll.useQuery(undefined, {
    staleTime: 1000 * 60 * 60,
    retry: 1,
  });

  const data = cultureQuery.data;

  const quoteOfTheDay = data?.dailyQuote || quotes[Math.floor(Math.random() * quotes.length)] || '';
  const commandment = data?.commandments?.[0] || commandments[Math.floor(Math.random() * commandments.length)] || '';
  const affirmation = data?.dailyAffirmation || mascotAffirmations[Math.floor(Math.random() * mascotAffirmations.length)] || '';
  const brandMood = data?.currentMood || brandMoods[Math.floor(Math.random() * brandMoods.length)] || '';

  return {
    quoteOfTheDay,
    commandment,
    affirmation,
    brandMood,
    isLoading: cultureQuery.isLoading,
  };
});