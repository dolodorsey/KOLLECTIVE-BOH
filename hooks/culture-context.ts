import { useState, useEffect, useMemo } from 'react';
import createContextHook from '@nkzw/create-context-hook';
import { quotes, commandments, mascotAffirmations, brandMoods } from '@/mocks/culture';

function getRandomItem<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

export const [CultureContext, useCulture] = createContextHook(() => {
  const [isLoading, setIsLoading] = useState(true);

  const fallbackData = useMemo(() => ({
    quoteOfTheDay: getRandomItem(quotes) || '',
    commandment: getRandomItem(commandments) || '',
    affirmation: getRandomItem(mascotAffirmations) || '',
    brandMood: getRandomItem(brandMoods) || '',
  }), []);

  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 500);
    return () => clearTimeout(timer);
  }, []);

  return {
    quoteOfTheDay: fallbackData.quoteOfTheDay,
    commandment: fallbackData.commandment,
    affirmation: fallbackData.affirmation,
    brandMood: fallbackData.brandMood,
    isLoading,
  };
});