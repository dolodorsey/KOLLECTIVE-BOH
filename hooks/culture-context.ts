import createContextHook from '@nkzw/create-context-hook';
import { useState, useEffect } from 'react';

import { quotes, commandments, mascotAffirmations, brandMoods } from '@/mocks/culture';

export const [CultureContext, useCulture] = createContextHook(() => {
  const [quoteOfTheDay, setQuoteOfTheDay] = useState<string>('');
  const [commandment, setCommandment] = useState<string>('');
  const [affirmation, setAffirmation] = useState<string>('');
  const [brandMood, setBrandMood] = useState<string>('');

  useEffect(() => {
    // Randomly select cultural elements
    const randomQuote = quotes[Math.floor(Math.random() * quotes.length)];
    const randomCommandment = commandments[Math.floor(Math.random() * commandments.length)];
    const randomAffirmation = mascotAffirmations[Math.floor(Math.random() * mascotAffirmations.length)];
    const randomMood = brandMoods[Math.floor(Math.random() * brandMoods.length)];

    setQuoteOfTheDay(randomQuote);
    setCommandment(randomCommandment);
    setAffirmation(randomAffirmation);
    setBrandMood(randomMood);
  }, []);

  return {
    quoteOfTheDay,
    commandment,
    affirmation,
    brandMood
  };
});