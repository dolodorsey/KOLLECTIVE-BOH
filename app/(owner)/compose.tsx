import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useBrands } from '@/hooks/workflows-context';
import { useExecuteWorkflow } from '@/hooks/ao-core-context';
import { Mail, MessageSquare, Send, Sparkles } from 'lucide-react-native';

type ChannelType = 'sms' | 'email' | 'dm';

export default function ComposeScreen() {
  const [selectedBrand, setSelectedBrand] = useState<string>('');
  const [selectedChannel, setSelectedChannel] = useState<ChannelType>('email');
  const [recipient, setRecipient] = useState<string>('');
  const [subject, setSubject] = useState<string>('');
  const [message, setMessage] = useState<string>('');

  const { data: brands, isLoading: brandsLoading } = useBrands();
  const executeWorkflow = useExecuteWorkflow();

  const handleSend = async () => {
    if (!selectedBrand) {
      Alert.alert('Selection Required', 'Please select a brand to continue');
      return;
    }

    if (!recipient.trim()) {
      Alert.alert('Recipient Required', 'Please enter a recipient');
      return;
    }

    if (!message.trim()) {
      Alert.alert('Message Required', 'Please enter a message');
      return;
    }

    const workflowName = `send-${selectedChannel}`;

    const payload = {
      brand: selectedBrand,
      channel: selectedChannel,
      recipient: recipient.trim(),
      subject: selectedChannel === 'email' ? subject.trim() : undefined,
      message: message.trim(),
      timestamp: new Date().toISOString(),
    };

    try {
      await executeWorkflow.mutateAsync({
        workflow_name: workflowName,
        payload,
        brand: selectedBrand,
      });

      Alert.alert(
        'Vision Executed',
        `Message sent successfully via ${selectedChannel.toUpperCase()}`,
        [
          {
            text: 'Continue',
            onPress: () => {
              setRecipient('');
              setSubject('');
              setMessage('');
            },
          },
        ]
      );
    } catch (error: any) {
      Alert.alert(
        'Recalibrating the blueprint...',
        error.message || 'Failed to send message. Please try again.'
      );
    }
  };

  const selectedBrandData = brands?.find((b) => b.brand_key === selectedBrand);

  const getChannelPlaceholder = () => {
    switch (selectedChannel) {
      case 'sms':
        return '+1 (555) 123-4567';
      case 'email':
        return 'recipient@example.com';
      case 'dm':
        return '@username';
      default:
        return 'Enter recipient';
    }
  };

  const getChannelIcon = (channel: ChannelType) => {
    switch (channel) {
      case 'sms':
        return MessageSquare;
      case 'email':
        return Mail;
      case 'dm':
        return Send;
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <View style={styles.header}>
          <View style={styles.headerTop}>
            <Sparkles color="#FFD700" size={28} />
            <Text style={styles.headerTitle}>Compose Message</Text>
          </View>
          <Text style={styles.headerSubtitle}>
            Deploy communication with precision
          </Text>
        </View>

        <ScrollView style={styles.content} keyboardShouldPersistTaps="handled">
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>SELECT BRAND</Text>
            {brandsLoading ? (
              <ActivityIndicator color="#FFD700" style={styles.loader} />
            ) : (
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.brandList}
              >
                {brands?.map((brand) => (
                  <TouchableOpacity
                    key={brand.id}
                    style={[
                      styles.brandButton,
                      selectedBrand === brand.brand_key &&
                        styles.brandButtonActive,
                    ]}
                    onPress={() => setSelectedBrand(brand.brand_key)}
                  >
                    <Text
                      style={[
                        styles.brandButtonText,
                        selectedBrand === brand.brand_key &&
                          styles.brandButtonTextActive,
                      ]}
                    >
                      {brand.brand_display_name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            )}
          </View>

          {selectedBrand && (
            <>
              <View style={styles.section}>
                <Text style={styles.sectionLabel}>SELECT CHANNEL</Text>
                <View style={styles.channelRow}>
                  {(['sms', 'email', 'dm'] as ChannelType[]).map((channel) => {
                    const isEnabled =
                      selectedBrandData?.[`${channel}_enabled`] ?? false;
                    const Icon = getChannelIcon(channel);

                    return (
                      <TouchableOpacity
                        key={channel}
                        style={[
                          styles.channelButton,
                          selectedChannel === channel &&
                            styles.channelButtonActive,
                          !isEnabled && styles.channelButtonDisabled,
                        ]}
                        onPress={() =>
                          isEnabled && setSelectedChannel(channel)
                        }
                        disabled={!isEnabled}
                      >
                        <Icon
                          color={
                            selectedChannel === channel
                              ? '#000'
                              : isEnabled
                              ? '#FFD700'
                              : '#444'
                          }
                          size={20}
                        />
                        <Text
                          style={[
                            styles.channelButtonText,
                            selectedChannel === channel &&
                              styles.channelButtonTextActive,
                            !isEnabled && styles.channelButtonTextDisabled,
                          ]}
                        >
                          {channel.toUpperCase()}
                        </Text>
                        {!isEnabled && (
                          <View style={styles.disabledBadge}>
                            <Text style={styles.disabledBadgeText}>OFF</Text>
                          </View>
                        )}
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>

              <View style={styles.section}>
                <Text style={styles.sectionLabel}>RECIPIENT</Text>
                <TextInput
                  style={styles.input}
                  placeholder={getChannelPlaceholder()}
                  placeholderTextColor="#666"
                  value={recipient}
                  onChangeText={setRecipient}
                  autoCapitalize="none"
                  keyboardType={
                    selectedChannel === 'email' ? 'email-address' : 'default'
                  }
                />
              </View>

              {selectedChannel === 'email' && (
                <View style={styles.section}>
                  <Text style={styles.sectionLabel}>SUBJECT</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Enter email subject"
                    placeholderTextColor="#666"
                    value={subject}
                    onChangeText={setSubject}
                  />
                </View>
              )}

              <View style={styles.section}>
                <Text style={styles.sectionLabel}>MESSAGE</Text>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  placeholder="Craft your message..."
                  placeholderTextColor="#666"
                  value={message}
                  onChangeText={setMessage}
                  multiline
                  numberOfLines={8}
                  textAlignVertical="top"
                />
              </View>

              <TouchableOpacity
                style={[
                  styles.sendButton,
                  executeWorkflow.isPending && styles.sendButtonDisabled,
                ]}
                onPress={handleSend}
                disabled={executeWorkflow.isPending}
              >
                {executeWorkflow.isPending ? (
                  <ActivityIndicator color="#000" />
                ) : (
                  <>
                    <Send color="#000" size={20} />
                    <Text style={styles.sendButtonText}>DEPLOY MESSAGE</Text>
                  </>
                )}
              </TouchableOpacity>
            </>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0A0A0A',
  },
  keyboardView: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
    backgroundColor: '#121212',
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 8,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#FFD700',
    fontStyle: 'italic',
  },
  content: {
    flex: 1,
    paddingTop: 20,
  },
  section: {
    marginBottom: 24,
    paddingHorizontal: 20,
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFD700',
    marginBottom: 12,
    letterSpacing: 1,
  },
  loader: {
    alignSelf: 'flex-start',
    marginVertical: 8,
  },
  brandList: {
    gap: 12,
  },
  brandButton: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: '#1A1A1A',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#333',
  },
  brandButtonActive: {
    backgroundColor: '#FFD700',
    borderColor: '#FFD700',
  },
  brandButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#999',
  },
  brandButtonTextActive: {
    color: '#000',
  },
  channelRow: {
    flexDirection: 'row',
    gap: 12,
  },
  channelButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
    backgroundColor: '#1A1A1A',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#333',
  },
  channelButtonActive: {
    backgroundColor: '#FFD700',
    borderColor: '#FFD700',
  },
  channelButtonDisabled: {
    opacity: 0.4,
  },
  channelButtonText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#999',
  },
  channelButtonTextActive: {
    color: '#000',
  },
  channelButtonTextDisabled: {
    color: '#444',
  },
  disabledBadge: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: '#FF4444',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  disabledBadgeText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#FFF',
  },
  input: {
    backgroundColor: '#1A1A1A',
    borderWidth: 1,
    borderColor: '#333',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 15,
    color: '#FFFFFF',
  },
  textArea: {
    minHeight: 120,
    paddingTop: 14,
  },
  sendButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    marginHorizontal: 20,
    marginTop: 12,
    marginBottom: 32,
    paddingVertical: 18,
    backgroundColor: '#FFD700',
    borderRadius: 12,
  },
  sendButtonDisabled: {
    opacity: 0.6,
  },
  sendButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#000',
    letterSpacing: 1,
  },
});
