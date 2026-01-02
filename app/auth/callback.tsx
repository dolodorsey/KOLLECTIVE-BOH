import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { getSupabase, SUPABASE_CONFIG_OK } from '@/lib/supabase';

export default function CallbackScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const handleCallback = async () => {
      console.log('Callback params:', params);

      try {
        if (!SUPABASE_CONFIG_OK) {
          console.error('Supabase configuration missing');
          setError('Configuration error');
          setTimeout(() => {
            router.replace('/auth/login');
          }, 2000);
          return;
        }

        const tokenHash = params.token_hash as string | undefined;
        const type = params.type as string | undefined;

        if (!tokenHash || type !== 'magiclink') {
          console.error('Invalid callback parameters');
          setError('Invalid authentication link');
          setTimeout(() => {
            router.replace('/auth/login');
          }, 2000);
          return;
        }

        console.log('Verifying OTP with token hash...');
        const supabase = getSupabase();
        const { data, error: verifyError } = await supabase.auth.verifyOtp({
          token_hash: tokenHash,
          type: 'magiclink',
        });

        if (verifyError) {
          console.error('Verification error:', verifyError);
          setError(verifyError.message);
          setTimeout(() => {
            router.replace('/auth/login');
          }, 2000);
          return;
        }

        if (data?.session) {
          console.log('Authentication successful, redirecting to app...');
          router.replace('/(tabs)');
        } else {
          console.error('No session received after verification');
          setError('Authentication failed');
          setTimeout(() => {
            router.replace('/auth/login');
          }, 2000);
        }
      } catch (err) {
        console.error('Unexpected callback error:', err);
        setError('An unexpected error occurred');
        setTimeout(() => {
          router.replace('/auth/login');
        }, 2000);
      }
    };

    handleCallback();
  }, [params, router]);

  return (
    <View style={styles.container}>
      {error ? (
        <View style={styles.content}>
          <Text style={styles.errorText}>{error}</Text>
          <Text style={styles.redirectText}>Redirecting to login...</Text>
        </View>
      ) : (
        <View style={styles.content}>
          <ActivityIndicator size="large" color="#2563EB" />
          <Text style={styles.text}>Signing you in...</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  text: {
    marginTop: 16,
    fontSize: 16,
    color: '#6B7280',
  },
  errorText: {
    fontSize: 16,
    color: '#DC2626',
    textAlign: 'center',
    marginBottom: 8,
  },
  redirectText: {
    fontSize: 14,
    color: '#9CA3AF',
    textAlign: 'center',
  },
});
