import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { useCulture } from '@/hooks/culture-context';

const CultureWidget: React.FC = () => {
  const { quoteOfTheDay, commandment, affirmation, brandMood } = useCulture();
  const [currentContent, setCurrentContent] = useState<string>('');
  const [contentType, setContentType] = useState<string>('quote');
  
  useEffect(() => {
    // Set initial content
    setCurrentContent(quoteOfTheDay);
    
    // Rotate content every 10 seconds
    const interval = setInterval(() => {
      if (contentType === 'quote') {
        setCurrentContent(commandment);
        setContentType('commandment');
      } else if (contentType === 'commandment') {
        setCurrentContent(affirmation);
        setContentType('affirmation');
      } else if (contentType === 'affirmation') {
        setCurrentContent(brandMood);
        setContentType('mood');
      } else {
        setCurrentContent(quoteOfTheDay);
        setContentType('quote');
      }
    }, 10000);
    
    return () => clearInterval(interval);
  }, [quoteOfTheDay, commandment, affirmation, brandMood, contentType]);
  
  return (
    <View style={styles.container} testID="culture-widget">
      <View style={styles.contentContainer}>
        <Text style={styles.content}>{currentContent}</Text>
      </View>
      
      <View style={styles.indicatorContainer}>
        <View style={[styles.indicator, contentType === 'quote' && styles.activeIndicator]} />
        <View style={[styles.indicator, contentType === 'commandment' && styles.activeIndicator]} />
        <View style={[styles.indicator, contentType === 'affirmation' && styles.activeIndicator]} />
        <View style={[styles.indicator, contentType === 'mood' && styles.activeIndicator]} />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#1E1E1E',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  contentContainer: {
    minHeight: 80,
    justifyContent: 'center',
  },
  content: {
    color: '#FFD700',
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
    fontStyle: 'italic',
  },
  indicatorContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 12,
  },
  indicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#333',
    marginHorizontal: 4,
  },
  activeIndicator: {
    backgroundColor: '#FFD700',
  },
});

export default CultureWidget;