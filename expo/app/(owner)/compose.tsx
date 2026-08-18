import React, { useMemo, useState } from 'react';
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
import { trpc } from '@/lib/trpc';
import { Mail, MessageSquare, Send, Sparkles, ShieldCheck } from 'lucide-react-native';

type ChannelType = 'email' | 'sms';
type StreamType = 'marketing' | 'transactional';

export default function ComposeScreen() {
  const [selectedBrand, setSelectedBrand] = useState('');
  const [selectedChannel, setSelectedChannel] = useState<ChannelType>('email');
  const [stream, setStream] = useState<StreamType>('marketing');
  const [recipient, setRecipient] = useState('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');

  const { data: senders, isLoading: sendersLoading } = trpc.communications.senders.useQuery();
  const sendEmail = trpc.communications.sendEmail.useMutation();
  const sendSms = trpc.communications.sendSms.useMutation();

  const brandKeys = useMemo(
    () => Array.from(new Set((senders || []).map((sender: any) => sender.brand_key))).sort(),
    [senders]
  );

  const senderFor = (brandKey: string, channel: ChannelType, streamType: StreamType) =>
    (senders || []).find(
      (sender: any) =>
        sender.brand_key === brandKey &&
        sender.channel === channel &&
        sender.stream === streamType
    );

  const activeSender: any = senderFor(selectedBrand, selectedChannel, stream);
  const senderReady = Boolean(
    activeSender?.verified &&
    activeSender?.sending_enabled &&
    activeSender?.connection_status === 'connected'
  );
  const isSending = sendEmail.isPending || sendSms.isPending;

  const handleSend = async () => {
    if (!selectedBrand) return Alert.alert('Brand Required', 'Select the exact sender brand.');
    if (!senderReady) return Alert.alert('Sender Not Ready', 'This exact brand/channel/stream is not connected and enabled.');
    if (!recipient.trim()) return Alert.alert('Recipient Required', 'Enter a recipient.');
    if (!message.trim()) return Alert.alert('Message Required', 'Enter a message.');
    if (selectedChannel === 'email' && !subject.trim()) return Alert.alert('Subject Required', 'Enter an email subject.');

    try {
      if (selectedChannel === 'email') {
        await sendEmail.mutateAsync({
          brand_key: selectedBrand,
          to: recipient.trim(),
          subject: subject.trim(),
          body: message.trim(),
          stream,
        });
      } else {
        await sendSms.mutateAsync({
          brand_key: selectedBrand,
          to: recipient.trim(),
          body: message.trim(),
          stream,
        });
      }

      Alert.alert('Sent', `Message accepted by the direct ${activeSender?.provider || selectedChannel} sender.`);
      setRecipient('');
      setSubject('');
      setMessage('');
    } catch (error: any) {
      Alert.alert('Send Blocked', error?.message || 'The current sender rail rejected this message.');
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.keyboardView}>
        <View style={styles.header}>
          <View style={styles.headerTop}>
            <Sparkles color="#FFD700" size={28} />
            <Text style={styles.headerTitle}>Direct Compose</Text>
          </View>
          <Text style={styles.headerSubtitle}>Exact sender · direct provider · compliance gates</Text>
        </View>

        <ScrollView style={styles.content} keyboardShouldPersistTaps="handled">
          <View style={styles.notice}>
            <ShieldCheck color="#00FF88" size={18} />
            <Text style={styles.noticeText}>
              Marketing sends require brand-specific consent and suppression checks. Transactional is for legitimate service/relationship messages only. Instagram DM uses the separate IG engagement queue.
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionLabel}>SENDER BRAND</Text>
            {sendersLoading ? (
              <ActivityIndicator color="#FFD700" />
            ) : (
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.brandList}>
                {brandKeys.map((brandKey) => (
                  <TouchableOpacity
                    key={brandKey}
                    style={[styles.brandButton, selectedBrand === brandKey && styles.brandButtonActive]}
                    onPress={() => setSelectedBrand(brandKey)}
                  >
                    <Text style={[styles.brandButtonText, selectedBrand === brandKey && styles.brandButtonTextActive]}>
                      {brandKey}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            )}
          </View>

          {selectedBrand ? (
            <>
              <View style={styles.section}>
                <Text style={styles.sectionLabel}>CHANNEL</Text>
                <View style={styles.row}>
                  {(['email', 'sms'] as ChannelType[]).map((channel) => {
                    const candidate: any = senderFor(selectedBrand, channel, stream);
                    const ready = Boolean(candidate?.verified && candidate?.sending_enabled && candidate?.connection_status === 'connected');
                    const Icon = channel === 'email' ? Mail : MessageSquare;
                    return (
                      <TouchableOpacity
                        key={channel}
                        style={[styles.optionButton, selectedChannel === channel && styles.optionButtonActive, !ready && styles.optionButtonDisabled]}
                        onPress={() => ready && setSelectedChannel(channel)}
                        disabled={!ready}
                      >
                        <Icon color={selectedChannel === channel ? '#000' : ready ? '#FFD700' : '#555'} size={19} />
                        <Text style={[styles.optionText, selectedChannel === channel && styles.optionTextActive, !ready && styles.optionTextDisabled]}>
                          {channel.toUpperCase()}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>

              <View style={styles.section}>
                <Text style={styles.sectionLabel}>MESSAGE STREAM</Text>
                <View style={styles.row}>
                  {(['marketing', 'transactional'] as StreamType[]).map((item) => (
                    <TouchableOpacity
                      key={item}
                      style={[styles.optionButton, stream === item && styles.optionButtonActive]}
                      onPress={() => setStream(item)}
                    >
                      <Text style={[styles.optionText, stream === item && styles.optionTextActive]}>{item.toUpperCase()}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
                <Text style={[styles.readiness, { color: senderReady ? '#00FF88' : '#FF8C00' }]}>
                  {senderReady
                    ? `READY · ${activeSender.provider}${activeSender.from_address ? ` · ${activeSender.from_address}` : ''}`
                    : `NOT READY · ${activeSender?.connection_status || 'missing sender profile'}`}
                </Text>
              </View>

              <View style={styles.section}>
                <Text style={styles.sectionLabel}>RECIPIENT</Text>
                <TextInput
                  style={styles.input}
                  placeholder={selectedChannel === 'email' ? 'recipient@example.com' : '+14045551234'}
                  placeholderTextColor="#666"
                  value={recipient}
                  onChangeText={setRecipient}
                  autoCapitalize="none"
                  keyboardType={selectedChannel === 'email' ? 'email-address' : 'phone-pad'}
                />
              </View>

              {selectedChannel === 'email' ? (
                <View style={styles.section}>
                  <Text style={styles.sectionLabel}>SUBJECT</Text>
                  <TextInput style={styles.input} placeholder="Email subject" placeholderTextColor="#666" value={subject} onChangeText={setSubject} />
                </View>
              ) : null}

              <View style={styles.section}>
                <Text style={styles.sectionLabel}>MESSAGE</Text>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  placeholder="Write the message…"
                  placeholderTextColor="#666"
                  value={message}
                  onChangeText={setMessage}
                  multiline
                  numberOfLines={8}
                  textAlignVertical="top"
                />
              </View>

              <TouchableOpacity
                style={[styles.sendButton, (!senderReady || isSending) && styles.sendButtonDisabled]}
                onPress={handleSend}
                disabled={!senderReady || isSending}
              >
                {isSending ? <ActivityIndicator color="#000" /> : <><Send color="#000" size={20} /><Text style={styles.sendButtonText}>SEND DIRECT</Text></>}
              </TouchableOpacity>
            </>
          ) : null}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0A0A0A' },
  keyboardView: { flex: 1 },
  header: { paddingHorizontal: 20, paddingTop: 20, paddingBottom: 16, backgroundColor: '#121212', borderBottomWidth: 1, borderBottomColor: '#333' },
  headerTop: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 8 },
  headerTitle: { fontSize: 24, fontWeight: '700', color: '#FFFFFF' },
  headerSubtitle: { fontSize: 14, color: '#FFD700' },
  content: { flex: 1, paddingTop: 18 },
  notice: { marginHorizontal: 20, marginBottom: 22, padding: 14, flexDirection: 'row', gap: 10, backgroundColor: '#102018', borderRadius: 10, borderWidth: 1, borderColor: '#285A3E' },
  noticeText: { flex: 1, color: '#BFD9C8', fontSize: 12, lineHeight: 18 },
  section: { marginBottom: 22, paddingHorizontal: 20 },
  sectionLabel: { fontSize: 12, fontWeight: '700', color: '#FFD700', marginBottom: 11, letterSpacing: 1 },
  brandList: { gap: 10 },
  brandButton: { paddingHorizontal: 15, paddingVertical: 10, borderRadius: 18, backgroundColor: '#1A1A1A', borderWidth: 1, borderColor: '#333' },
  brandButtonActive: { backgroundColor: '#FFD700', borderColor: '#FFD700' },
  brandButtonText: { color: '#AAA', fontSize: 12, fontWeight: '700' },
  brandButtonTextActive: { color: '#000' },
  row: { flexDirection: 'row', gap: 10 },
  optionButton: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 14, paddingVertical: 11, borderRadius: 10, backgroundColor: '#171717', borderWidth: 1, borderColor: '#333' },
  optionButtonActive: { backgroundColor: '#FFD700', borderColor: '#FFD700' },
  optionButtonDisabled: { opacity: 0.45 },
  optionText: { color: '#CCC', fontSize: 12, fontWeight: '800' },
  optionTextActive: { color: '#000' },
  optionTextDisabled: { color: '#666' },
  readiness: { marginTop: 10, fontSize: 11, fontWeight: '700' },
  input: { backgroundColor: '#151515', borderWidth: 1, borderColor: '#333', borderRadius: 10, paddingHorizontal: 14, paddingVertical: 13, color: '#FFF', fontSize: 15 },
  textArea: { minHeight: 150 },
  sendButton: { marginHorizontal: 20, marginBottom: 40, paddingVertical: 15, borderRadius: 10, backgroundColor: '#FFD700', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10 },
  sendButtonDisabled: { opacity: 0.45 },
  sendButtonText: { color: '#000', fontSize: 14, fontWeight: '900' },
});
