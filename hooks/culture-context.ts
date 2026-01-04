import createContextHook from '@nkzw/create-context-hook';
import { useState, useEffect } from 'react';
import { api } from '@/lib/api';

interface CultureData {
  quotes: string[];
  commandments: string[];
  mascotAffirmations: string[];
  brandMoods: string[];
}

export const [CultureContext, useCulture] = createContextHook(() => {
  const [quoteOfTheDay, setQuoteOfTheDay] = useState<string>('');
  const [commandment, setCommandment] = useState<string>('');
  const [affirmation, setAffirmation] = useState<string>('');
  const [brandMood, setBrandMood] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchCultureData = async () => {
      try {
        const response = await api.get<CultureData>('/api/culture');
        
        if (response.data) {
          const { quotes, commandments, mascotAffirmations, brandMoods } = response.data;
          
          setQuoteOfTheDay(quotes[Math.floor(Math.random() * quotes.length)] || '');
          setCommandment(commandments[Math.floor(Math.random() * commandments.length)] || '');
          setAffirmation(mascotAffirmations[Math.floor(Math.random() * mascotAffirmations.length)] || '');
          setBrandMood(brandMoods[Math.floor(Math.random() * brandMoods.length)] || '');
        }
      } catch (error) {
        console.error('[Culture] Failed to fetch culture data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchCultureData();
  }, []);

  return {
    quoteOfTheDay,
    commandment,
    affirmation,
    brandMood,
    isLoading,
  };
});