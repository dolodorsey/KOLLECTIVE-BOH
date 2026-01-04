import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { DIAGNOSTIC_INFO, SUPABASE_CONFIG_OK } from '@/lib/supabase';

interface ConnectionTest {
  name: string;
  status: 'pending' | 'success' | 'failed';
  message: string;
  details?: string;
}

export function ConnectionDiagnostic() {
  const [tests, setTests] = useState<ConnectionTest[]>([
    { name: 'Environment Variables', status: 'pending', message: 'Checking...' },
    { name: 'Supabase Config', status: 'pending', message: 'Checking...' },
    { name: 'API Base URL', status: 'pending', message: 'Checking...' },
    { name: 'Network Connectivity', status: 'pending', message: 'Checking...' },
    { name: 'HTTPS Protocol', status: 'pending', message: 'Checking...' },
  ]);

  const runDiagnostics = async () => {
    const newTests: ConnectionTest[] = [];

    const apiUrl = process.env.EXPO_PUBLIC_RORK_API_BASE_URL || 'Not set';
    
    newTests.push({
      name: 'Environment Variables',
      status: apiUrl !== 'Not set' ? 'success' : 'failed',
      message: apiUrl !== 'Not set' ? 'API URL configured' : 'API URL missing',
      details: `EXPO_PUBLIC_RORK_API_BASE_URL: ${apiUrl}`,
    });

    newTests.push({
      name: 'Supabase Config',
      status: SUPABASE_CONFIG_OK ? 'success' : 'failed',
      message: SUPABASE_CONFIG_OK ? 'Configuration valid' : 'Configuration missing',
      details: `URL: ${DIAGNOSTIC_INFO.url}\nKey: ${DIAGNOSTIC_INFO.keyPreview}`,
    });

    newTests.push({
      name: 'API Base URL',
      status: apiUrl.includes('localhost') ? 'failed' : 'success',
      message: apiUrl.includes('localhost') 
        ? 'Using localhost (won\'t work on devices)' 
        : 'Valid URL',
      details: apiUrl,
    });

    newTests.push({
      name: 'HTTPS Protocol',
      status: apiUrl.startsWith('https://') ? 'success' : 'failed',
      message: apiUrl.startsWith('https://') 
        ? 'Using secure HTTPS' 
        : 'Using HTTP (iOS will block)',
      details: apiUrl.startsWith('http://') ? 'iOS requires HTTPS for API requests' : 'Protocol check passed',
    });

    try {
      const response = await fetch('https://www.google.com', { method: 'HEAD' });
      newTests.push({
        name: 'Network Connectivity',
        status: response.ok ? 'success' : 'failed',
        message: response.ok ? 'Internet connection active' : 'Connection issue',
      });
    } catch (error) {
      newTests.push({
        name: 'Network Connectivity',
        status: 'failed',
        message: 'No internet connection',
        details: error instanceof Error ? error.message : 'Unknown error',
      });
    }

    setTests(newTests);
  };

  useEffect(() => {
    runDiagnostics();
  }, []);

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Connection Diagnostics</Text>
        <TouchableOpacity style={styles.button} onPress={runDiagnostics}>
          <Text style={styles.buttonText}>Rerun Tests</Text>
        </TouchableOpacity>
      </View>

      {tests.map((test, index) => (
        <View key={index} style={styles.testItem}>
          <View style={styles.testHeader}>
            <Text style={styles.testName}>{test.name}</Text>
            <View style={[
              styles.badge,
              test.status === 'success' && styles.badgeSuccess,
              test.status === 'failed' && styles.badgeFailed,
              test.status === 'pending' && styles.badgePending,
            ]}>
              <Text style={styles.badgeText}>
                {test.status === 'success' ? '✓' : test.status === 'failed' ? '✗' : '...'}
              </Text>
            </View>
          </View>
          <Text style={styles.testMessage}>{test.message}</Text>
          {test.details && (
            <Text style={styles.testDetails}>{test.details}</Text>
          )}
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a1a',
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  button: {
    backgroundColor: '#3b82f6',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  buttonText: {
    color: '#fff',
    fontWeight: '600',
  },
  testItem: {
    backgroundColor: '#2a2a2a',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  testHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  testName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  badge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  badgeSuccess: {
    backgroundColor: '#10b981',
  },
  badgeFailed: {
    backgroundColor: '#ef4444',
  },
  badgePending: {
    backgroundColor: '#6b7280',
  },
  badgeText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
  },
  testMessage: {
    fontSize: 14,
    color: '#d1d5db',
    marginBottom: 4,
  },
  testDetails: {
    fontSize: 12,
    color: '#9ca3af',
    fontFamily: 'monospace',
  },
});
