
import React from 'react';
import { StyleSheet, Text, View, TouchableOpacity } from 'react-native';

import { STATUS_COLORS } from '@/constants/colors';
import { Brand } from '@/types/brand';

interface BrandTileProps {
  brand: Brand;
}

const BrandTile: React.FC<BrandTileProps> = ({ brand }) => {

  const statusColor = STATUS_COLORS[brand.status];
  
  const handlePress = () => {
    // In a real app, this would navigate to the brand dashboard
    console.log(`Navigate to ${brand.name} dashboard`);
  };
  
  return (
    <TouchableOpacity 
      style={[styles.container, { borderColor: statusColor }]} 
      onPress={handlePress}
      testID={`brand-tile-${brand.id}`}
    >
      <View style={styles.header}>
        <Text style={styles.mascot}>{brand.mascot}</Text>
        <Text style={[styles.name, { color: brand.color }]}>{brand.name}</Text>
      </View>
      
      <View style={styles.statsContainer}>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{brand.taskCompletion}%</Text>
          <Text style={styles.statLabel}>Tasks</Text>
        </View>
        
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{brand.activeAgents}</Text>
          <Text style={styles.statLabel}>Agents</Text>
        </View>
        
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{brand.recentUploads}</Text>
          <Text style={styles.statLabel}>Uploads</Text>
        </View>
      </View>
      
      <View style={styles.progressContainer}>
        <View style={styles.progressBackground}>
          <View 
            style={[
              styles.progressFill, 
              { width: `${brand.taskCompletion}%`, backgroundColor: brand.color }
            ]} 
          />
        </View>
      </View>
      
      <TouchableOpacity style={[styles.accessButton, { backgroundColor: brand.color }]}>
        <Text style={styles.accessButtonText}>Access</Text>
      </TouchableOpacity>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#1E1E1E',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
    width: '48%',
  },
  header: {
    alignItems: 'center',
    marginBottom: 12,
  },
  mascot: {
    fontSize: 32,
    marginBottom: 8,
  },
  name: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  statLabel: {
    color: '#aaa',
    fontSize: 12,
  },
  progressContainer: {
    marginBottom: 12,
  },
  progressBackground: {
    height: 6,
    backgroundColor: '#333',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
  },
  accessButton: {
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: 'center',
  },
  accessButtonText: {
    color: '#000',
    fontWeight: 'bold',
  },
});

export default BrandTile;