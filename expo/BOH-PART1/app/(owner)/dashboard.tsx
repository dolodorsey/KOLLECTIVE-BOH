import React from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

const GOLD = '#FFD700';
const BG = '#0A0A0F';
const CARD = 'rgba(255,255,255,0.03)';
const BORDER = 'rgba(255,255,255,0.06)';

const QUICK_ACTIONS = [
  { icon: 'paper-plane', label: 'Compose', color: GOLD },
  { icon: 'people', label: 'People', color: '#3B82F6' },
  { icon: 'git-branch', label: 'Workflows', color: '#10B981' },
  { icon: 'business', label: 'Entities', color: '#8B5CF6' },
];

const METRICS = [
  { label: 'Revenue MTD', value: '$142.8K', change: '+12%', up: true },
  { label: 'Active Staff', value: '47', change: '+3', up: true },
  { label: 'Open Tasks', value: '23', change: '-5', up: false },
  { label: 'Workflows', value: '189', change: '—', up: true },
];

const FEED = [
  { text: 'Linda completed: Newsletter batch for HugLife', time: '8m ago', icon: 'checkmark-circle', color: '#10B981' },
  { text: 'New lead captured: Taste of Art Instagram DM', time: '22m ago', icon: 'person-add', color: '#3B82F6' },
  { text: 'Workflow alert: GHL sync failed for Pronto', time: '1h ago', icon: 'warning', color: '#F59E0B' },
  { text: 'Eric uploaded: Forever Futbol event graphics', time: '2h ago', icon: 'cloud-upload', color: '#8B5CF6' },
  { text: 'Vincent completed: Casper menu price update', time: '3h ago', icon: 'checkmark-circle', color: '#10B981' },
];

const BRANDS_STATUS = [
  { name: 'NOIR', health: 'good', ops: 12 },
  { name: 'HugLife', health: 'good', ops: 8 },
  { name: 'Casper Group', health: 'warning', ops: 15 },
  { name: 'Pronto Energy', health: 'good', ops: 6 },
  { name: 'Forever Futbol', health: 'good', ops: 9 },
];

export default function DashboardScreen() {
  return (
    <ScrollView style={s.container} showsVerticalScrollIndicator={false}>
      <View style={s.content}>
        {/* Header */}
        <Text style={s.greeting}>Good morning,{'\n'}Dr. Dorsey</Text>
        <Text style={s.subtitle}>{new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</Text>

        {/* Quick Actions */}
        <View style={s.actionsRow}>
          {QUICK_ACTIONS.map((a) => (
            <TouchableOpacity key={a.label} style={s.actionBtn} activeOpacity={0.8}>
              <View style={[s.actionIcon, { backgroundColor: a.color + '15' }]}>
                <Ionicons name={a.icon as any} size={20} color={a.color} />
              </View>
              <Text style={s.actionLabel}>{a.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Metrics Grid */}
        <View style={s.metricsGrid}>
          {METRICS.map((m) => (
            <View key={m.label} style={s.metricCard}>
              <Text style={s.metricLabel}>{m.label}</Text>
              <Text style={s.metricValue}>{m.value}</Text>
              <Text style={[s.metricChange, { color: m.up ? '#10B981' : '#F59E0B' }]}>{m.change}</Text>
            </View>
          ))}
        </View>

        {/* Brand Health */}
        <Text style={s.sectionTitle}>Brand Health</Text>
        <View style={s.brandGrid}>
          {BRANDS_STATUS.map((b) => (
            <View key={b.name} style={s.brandCard}>
              <View style={s.brandTop}>
                <Text style={s.brandName}>{b.name}</Text>
                <View style={[s.healthDot, { backgroundColor: b.health === 'good' ? '#10B981' : '#F59E0B' }]} />
              </View>
              <Text style={s.brandOps}>{b.ops} active ops</Text>
            </View>
          ))}
        </View>

        {/* Activity Feed */}
        <Text style={[s.sectionTitle, { marginTop: 28 }]}>Activity Feed</Text>
        {FEED.map((item, i) => (
          <View key={i} style={s.feedRow}>
            <View style={[s.feedIcon, { backgroundColor: item.color + '15' }]}>
              <Ionicons name={item.icon as any} size={16} color={item.color} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={s.feedText}>{item.text}</Text>
              <Text style={s.feedTime}>{item.time}</Text>
            </View>
          </View>
        ))}
      </View>
      <View style={{ height: 100 }} />
    </ScrollView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: BG },
  content: { padding: 24, paddingTop: 60 },
  greeting: { fontSize: 32, fontWeight: '800', color: '#fff', lineHeight: 38, letterSpacing: -0.5 },
  subtitle: { fontSize: 14, color: '#555', marginTop: 6, marginBottom: 24 },
  actionsRow: { flexDirection: 'row', gap: 12, marginBottom: 28 },
  actionBtn: { flex: 1, alignItems: 'center', gap: 8 },
  actionIcon: { width: 48, height: 48, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  actionLabel: { color: '#888', fontSize: 11, fontWeight: '600' },
  metricsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 28 },
  metricCard: { width: (width - 58) / 2, backgroundColor: CARD, borderRadius: 14, padding: 16, borderWidth: 1, borderColor: BORDER },
  metricLabel: { color: '#555', fontSize: 11, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 1 },
  metricValue: { color: '#fff', fontSize: 26, fontWeight: '800', marginTop: 6, letterSpacing: -0.5 },
  metricChange: { fontSize: 12, fontWeight: '700', marginTop: 4 },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: '#fff', marginBottom: 12 },
  brandGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  brandCard: { width: (width - 58) / 2, backgroundColor: CARD, borderRadius: 14, padding: 14, borderWidth: 1, borderColor: BORDER },
  brandTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  brandName: { color: GOLD, fontSize: 14, fontWeight: '700' },
  healthDot: { width: 8, height: 8, borderRadius: 4 },
  brandOps: { color: '#555', fontSize: 12 },
  feedRow: { flexDirection: 'row', alignItems: 'flex-start', paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.03)' },
  feedIcon: { width: 32, height: 32, borderRadius: 10, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  feedText: { color: '#ccc', fontSize: 13, fontWeight: '500', lineHeight: 18 },
  feedTime: { color: '#444', fontSize: 11, marginTop: 3 },
});
