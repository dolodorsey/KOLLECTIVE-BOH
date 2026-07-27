import React, { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, FlatList, Modal, Pressable, SafeAreaView, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { Plus, X, Search, CheckCircle2, AlertTriangle, Lightbulb, ClipboardList, Building2 } from 'lucide-react-native';
import { supabase } from '../../lib/supabase';

type Mode = 'directory' | 'tasks' | 'handoffs' | 'ideas';

type DirectoryRecord = {
  id: string;
  entity_name: string;
  division: string | null;
  status: string;
  primary_poc: string | null;
  current_blocker: string | null;
  next_action: string | null;
  overall_readiness: number;
};

type TaskRecord = {
  id: string;
  title: string;
  status: string;
  priority: string;
  due_date: string | null;
  blocker: string | null;
  next_action: string | null;
  progress_percent: number;
};

type HandoffRecord = {
  id: string;
  title: string;
  note_type: string;
  status: string;
  priority: string;
  next_action: string | null;
  blocker: string | null;
  due_at: string | null;
};

type IdeaRecord = {
  id: string;
  title: string;
  status: string;
  priority: string;
  description: string | null;
};

const MODES: { key: Mode; label: string }[] = [
  { key: 'directory', label: 'Directory' },
  { key: 'tasks', label: 'Tasks' },
  { key: 'handoffs', label: 'Handoffs' },
  { key: 'ideas', label: 'Ideas' },
];

export default function OperationsScreen() {
  const [mode, setMode] = useState<Mode>('directory');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState('');
  const [directory, setDirectory] = useState<DirectoryRecord[]>([]);
  const [tasks, setTasks] = useState<TaskRecord[]>([]);
  const [handoffs, setHandoffs] = useState<HandoffRecord[]>([]);
  const [ideas, setIdeas] = useState<IdeaRecord[]>([]);
  const [openForm, setOpenForm] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState('medium');

  async function load() {
    setLoading(true);
    const [directoryResult, taskResult, handoffResult, ideaResult] = await Promise.all([
      supabase.from('enterprise_directory_records').select('id,entity_name,division,status,primary_poc,current_blocker,next_action,overall_readiness').order('entity_name'),
      supabase.from('tasks').select('id,title,status,priority,due_date,blocker,next_action,progress_percent').order('created_at', { ascending: false }).limit(250),
      supabase.from('enterprise_handoff_notes').select('id,title,note_type,status,priority,next_action,blocker,due_at').order('created_at', { ascending: false }).limit(250),
      supabase.from('enterprise_random_ideas').select('id,title,status,priority,description').order('created_at', { ascending: false }).limit(250),
    ]);
    if (directoryResult.data) setDirectory(directoryResult.data as DirectoryRecord[]);
    if (taskResult.data) setTasks(taskResult.data as TaskRecord[]);
    if (handoffResult.data) setHandoffs(handoffResult.data as HandoffRecord[]);
    if (ideaResult.data) setIdeas(ideaResult.data as IdeaRecord[]);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    const source = mode === 'directory' ? directory : mode === 'tasks' ? tasks : mode === 'handoffs' ? handoffs : ideas;
    if (!q) return source;
    return source.filter((item: any) => JSON.stringify(item).toLowerCase().includes(q));
  }, [mode, directory, tasks, handoffs, ideas, search]);

  async function createRecord() {
    if (!title.trim()) return;
    setSaving(true);
    let result;
    if (mode === 'tasks') {
      result = await supabase.from('tasks').insert({ title: title.trim(), description: description.trim() || null, priority, status: 'pending', progress_percent: 0 });
    } else if (mode === 'handoffs') {
      result = await supabase.from('enterprise_handoff_notes').insert({ title: title.trim(), body: description.trim() || null, priority, status: 'open', note_type: 'handoff', next_action: description.trim() || 'Assign next action' });
    } else if (mode === 'ideas') {
      result = await supabase.from('enterprise_random_ideas').insert({ title: title.trim(), description: description.trim() || null, priority, status: 'new' });
    } else {
      result = await supabase.from('enterprise_directory_records').insert({ entity_name: title.trim(), description: description.trim() || null, status: 'needs_setup', priority, overall_readiness: 0 });
    }
    setSaving(false);
    if (!result.error) {
      setOpenForm(false);
      setTitle('');
      setDescription('');
      setPriority('medium');
      load();
    }
  }

  async function quickUpdate(table: string, id: string, values: Record<string, unknown>) {
    await supabase.from(table).update(values).eq('id', id);
    load();
  }

  function renderDirectory(item: DirectoryRecord) {
    return (
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <View style={styles.iconBox}><Building2 color="#F4C95D" size={20} /></View>
          <View style={styles.grow}>
            <Text style={styles.cardTitle}>{item.entity_name}</Text>
            <Text style={styles.meta}>{item.division || 'Unassigned division'} • {item.primary_poc || 'POC needed'}</Text>
          </View>
          <Text style={styles.score}>{item.overall_readiness || 0}%</Text>
        </View>
        <View style={styles.statusRow}>
          <Text style={styles.status}>{item.status}</Text>
          {!!item.current_blocker && <Text style={styles.blocker}>Blocker: {item.current_blocker}</Text>}
        </View>
        <Text style={styles.next}>Next: {item.next_action || 'Add next action'}</Text>
        <View style={styles.actions}>
          <Pressable style={styles.secondaryButton} onPress={() => quickUpdate('enterprise_directory_records', item.id, { status: 'operating' })}><Text style={styles.secondaryText}>Mark operating</Text></Pressable>
          <Pressable style={styles.secondaryButton} onPress={() => quickUpdate('enterprise_directory_records', item.id, { last_verified_at: new Date().toISOString() })}><Text style={styles.secondaryText}>Verify now</Text></Pressable>
        </View>
      </View>
    );
  }

  function renderTask(item: TaskRecord) {
    return (
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <View style={styles.iconBox}><ClipboardList color="#5FA8FF" size={20} /></View>
          <View style={styles.grow}>
            <Text style={styles.cardTitle}>{item.title}</Text>
            <Text style={styles.meta}>{item.priority} priority • {item.status}</Text>
          </View>
          <Text style={styles.score}>{item.progress_percent || 0}%</Text>
        </View>
        {!!item.blocker && <Text style={styles.blocker}>Blocker: {item.blocker}</Text>}
        <Text style={styles.next}>Next: {item.next_action || 'Add next action'}</Text>
        <View style={styles.actions}>
          <Pressable style={styles.secondaryButton} onPress={() => quickUpdate('tasks', item.id, { status: 'in_progress', progress_percent: Math.max(item.progress_percent || 0, 25) })}><Text style={styles.secondaryText}>Start</Text></Pressable>
          <Pressable style={styles.primaryButton} onPress={() => quickUpdate('tasks', item.id, { status: 'completed', progress_percent: 100 })}><Text style={styles.primaryText}>Complete</Text></Pressable>
        </View>
      </View>
    );
  }

  function renderHandoff(item: HandoffRecord) {
    return (
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <View style={styles.iconBox}><AlertTriangle color="#F4C95D" size={20} /></View>
          <View style={styles.grow}>
            <Text style={styles.cardTitle}>{item.title}</Text>
            <Text style={styles.meta}>{item.note_type} • {item.priority} • {item.status}</Text>
          </View>
        </View>
        {!!item.blocker && <Text style={styles.blocker}>Blocker: {item.blocker}</Text>}
        <Text style={styles.next}>Next: {item.next_action || 'Assign next action'}</Text>
        <View style={styles.actions}>
          <Pressable style={styles.secondaryButton} onPress={() => quickUpdate('enterprise_handoff_notes', item.id, { status: 'in_progress' })}><Text style={styles.secondaryText}>Continue</Text></Pressable>
          <Pressable style={styles.primaryButton} onPress={() => quickUpdate('enterprise_handoff_notes', item.id, { status: 'resolved', resolved_at: new Date().toISOString() })}><Text style={styles.primaryText}>Resolve</Text></Pressable>
        </View>
      </View>
    );
  }

  function renderIdea(item: IdeaRecord) {
    return (
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <View style={styles.iconBox}><Lightbulb color="#E892FF" size={20} /></View>
          <View style={styles.grow}>
            <Text style={styles.cardTitle}>{item.title}</Text>
            <Text style={styles.meta}>{item.priority} priority • {item.status}</Text>
          </View>
        </View>
        {!!item.description && <Text style={styles.next}>{item.description}</Text>}
        <View style={styles.actions}>
          <Pressable style={styles.secondaryButton} onPress={() => quickUpdate('enterprise_random_ideas', item.id, { status: 'reviewing' })}><Text style={styles.secondaryText}>Review</Text></Pressable>
          <Pressable style={styles.primaryButton} onPress={() => quickUpdate('enterprise_random_ideas', item.id, { status: 'approved' })}><Text style={styles.primaryText}>Approve</Text></Pressable>
        </View>
      </View>
    );
  }

  const renderItem = ({ item }: { item: any }) => mode === 'directory' ? renderDirectory(item) : mode === 'tasks' ? renderTask(item) : mode === 'handoffs' ? renderHandoff(item) : renderIdea(item);

  return (
    <SafeAreaView style={styles.screen}>
      <View style={styles.header}>
        <Text style={styles.eyebrow}>OWNER OPERATING CENTER</Text>
        <Text style={styles.title}>Enterprise Operations</Text>
        <Text style={styles.subtitle}>Create, edit, assign, resolve and continue work. Nothing here is read-only.</Text>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabs}>
        {MODES.map((entry) => (
          <Pressable key={entry.key} onPress={() => setMode(entry.key)} style={[styles.tab, mode === entry.key && styles.tabActive]}>
            <Text style={[styles.tabText, mode === entry.key && styles.tabTextActive]}>{entry.label}</Text>
          </Pressable>
        ))}
      </ScrollView>

      <View style={styles.toolbar}>
        <View style={styles.searchBox}>
          <Search color="#8190A5" size={18} />
          <TextInput value={search} onChangeText={setSearch} placeholder={`Search ${mode}`} placeholderTextColor="#697A90" style={styles.searchInput} />
        </View>
        <Pressable style={styles.addButton} onPress={() => setOpenForm(true)}>
          <Plus color="#071426" size={20} />
          <Text style={styles.addText}>Add</Text>
        </Pressable>
      </View>

      {loading ? (
        <View style={styles.loading}><ActivityIndicator color="#F4C95D" size="large" /></View>
      ) : (
        <FlatList data={filtered as any[]} keyExtractor={(item) => item.id} renderItem={renderItem} contentContainerStyle={styles.list} refreshing={loading} onRefresh={load} ListEmptyComponent={<View style={styles.empty}><CheckCircle2 color="#37B26C" size={30} /><Text style={styles.emptyTitle}>No records found</Text><Text style={styles.emptyText}>Use Add to create the first record in this section.</Text></View>} />
      )}

      <Modal visible={openForm} transparent animationType="slide" onRequestClose={() => setOpenForm(false)}>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add {mode === 'directory' ? 'entity' : mode.slice(0, -1)}</Text>
              <Pressable onPress={() => setOpenForm(false)}><X color="#FFFFFF" size={24} /></Pressable>
            </View>
            <TextInput value={title} onChangeText={setTitle} placeholder="Title or entity name" placeholderTextColor="#697A90" style={styles.input} />
            <TextInput value={description} onChangeText={setDescription} placeholder="Description, next action or note" placeholderTextColor="#697A90" style={[styles.input, styles.multiline]} multiline />
            <View style={styles.priorityRow}>
              {['low','medium','high','urgent'].map((value) => (
                <Pressable key={value} onPress={() => setPriority(value)} style={[styles.priorityChip, priority === value && styles.priorityChipActive]}><Text style={[styles.priorityText, priority === value && styles.priorityTextActive]}>{value}</Text></Pressable>
              ))}
            </View>
            <Pressable style={styles.saveButton} onPress={createRecord} disabled={saving}><Text style={styles.saveText}>{saving ? 'Saving…' : 'Save'}</Text></Pressable>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#071426' },
  header: { paddingHorizontal: 20, paddingTop: 18, paddingBottom: 12 },
  eyebrow: { color: '#F4C95D', fontSize: 12, fontWeight: '800', letterSpacing: 1.4 },
  title: { color: '#FFFFFF', fontSize: 30, fontWeight: '900', marginTop: 4 },
  subtitle: { color: '#9FB0C3', marginTop: 6, fontSize: 14, lineHeight: 20 },
  tabs: { gap: 8, paddingHorizontal: 20, paddingBottom: 12 },
  tab: { backgroundColor: '#10243D', borderRadius: 999, paddingHorizontal: 16, paddingVertical: 10, borderWidth: 1, borderColor: '#263B55' },
  tabActive: { backgroundColor: '#F4C95D', borderColor: '#F4C95D' },
  tabText: { color: '#B8C3D1', fontWeight: '700' },
  tabTextActive: { color: '#071426' },
  toolbar: { flexDirection: 'row', gap: 10, paddingHorizontal: 20, paddingBottom: 12 },
  searchBox: { flex: 1, minHeight: 46, borderRadius: 14, backgroundColor: '#0D2038', borderWidth: 1, borderColor: '#263B55', paddingHorizontal: 14, flexDirection: 'row', alignItems: 'center', gap: 8 },
  searchInput: { flex: 1, color: '#FFFFFF', fontSize: 15 },
  addButton: { minHeight: 46, borderRadius: 14, backgroundColor: '#F4C95D', paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center', gap: 6 },
  addText: { color: '#071426', fontWeight: '900' },
  list: { paddingHorizontal: 20, paddingBottom: 120, gap: 12 },
  card: { backgroundColor: '#10243D', borderRadius: 18, borderWidth: 1, borderColor: '#263B55', padding: 16 },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  iconBox: { width: 38, height: 38, borderRadius: 12, backgroundColor: '#0A1A2E', alignItems: 'center', justifyContent: 'center' },
  grow: { flex: 1 },
  cardTitle: { color: '#FFFFFF', fontWeight: '900', fontSize: 17 },
  meta: { color: '#9FB0C3', fontSize: 12, marginTop: 4, textTransform: 'capitalize' },
  score: { color: '#F4C95D', fontWeight: '900', fontSize: 18 },
  statusRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 14 },
  status: { color: '#37B26C', backgroundColor: '#123A2B', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 999, overflow: 'hidden', textTransform: 'capitalize', fontWeight: '800' },
  blocker: { color: '#FF9D9D', marginTop: 12, fontSize: 13 },
  next: { color: '#DCE6F2', marginTop: 10, lineHeight: 19 },
  actions: { flexDirection: 'row', gap: 8, marginTop: 14 },
  secondaryButton: { flex: 1, borderRadius: 12, borderWidth: 1, borderColor: '#3A5270', paddingVertical: 11, alignItems: 'center' },
  secondaryText: { color: '#DCE6F2', fontWeight: '800' },
  primaryButton: { flex: 1, borderRadius: 12, backgroundColor: '#37B26C', paddingVertical: 11, alignItems: 'center' },
  primaryText: { color: '#071426', fontWeight: '900' },
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  empty: { marginTop: 80, alignItems: 'center', gap: 8 },
  emptyTitle: { color: '#FFFFFF', fontWeight: '900', fontSize: 18 },
  emptyText: { color: '#9FB0C3', textAlign: 'center' },
  modalBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,.62)', justifyContent: 'flex-end' },
  modalCard: { backgroundColor: '#0D2038', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20, paddingBottom: 34, borderWidth: 1, borderColor: '#263B55' },
  modalHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 },
  modalTitle: { color: '#FFFFFF', fontSize: 22, fontWeight: '900', textTransform: 'capitalize' },
  input: { minHeight: 48, borderRadius: 14, backgroundColor: '#071426', color: '#FFFFFF', borderWidth: 1, borderColor: '#263B55', paddingHorizontal: 14, paddingVertical: 12, marginBottom: 12 },
  multiline: { minHeight: 112, textAlignVertical: 'top' },
  priorityRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 },
  priorityChip: { borderRadius: 999, borderWidth: 1, borderColor: '#3A5270', paddingHorizontal: 12, paddingVertical: 8 },
  priorityChipActive: { backgroundColor: '#F4C95D', borderColor: '#F4C95D' },
  priorityText: { color: '#B8C3D1', fontWeight: '700', textTransform: 'capitalize' },
  priorityTextActive: { color: '#071426' },
  saveButton: { backgroundColor: '#F4C95D', borderRadius: 14, paddingVertical: 14, alignItems: 'center' },
  saveText: { color: '#071426', fontWeight: '900', fontSize: 16 },
});
