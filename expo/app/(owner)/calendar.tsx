import React, { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, RefreshControl, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CalendarDays, ChevronLeft, ChevronRight, Clock3, RefreshCw } from 'lucide-react-native';
import { supabase } from '../../lib/supabase';

const GOLD = '#E0A700';
const BG = '#0A0A0A';
const CARD = '#141414';
const BORDER = '#27241E';

type Item = { id: string; title: string; when: string; kind: 'event' | 'deadline' | 'operation'; subtitle?: string | null };

export default function CalendarScreen() {
  const [loading, setLoading] = useState(true);
  const [offset, setOffset] = useState(0);
  const [items, setItems] = useState<Item[]>([]);

  const windowStart = useMemo(() => {
    const d = new Date(); d.setHours(0,0,0,0); d.setDate(d.getDate() + offset * 7); return d;
  }, [offset]);
  const windowEnd = useMemo(() => { const d = new Date(windowStart); d.setDate(d.getDate() + 7); return d; }, [windowStart]);

  async function load() {
    setLoading(true);
    const from = windowStart.toISOString();
    const to = windowEnd.toISOString();
    const [events, tasks, ops] = await Promise.all([
      supabase.from('calendar_events').select('id,title,starts_at,location,city,status').gte('starts_at', from).lt('starts_at', to).order('starts_at'),
      supabase.from('tasks').select('id,title,due_date,priority,status,campaign_or_project').not('due_date','is',null).gte('due_date', from).lt('due_date', to).neq('status','completed').order('due_date'),
      supabase.from('scheduled_operations').select('id,operation_name,next_run_at,priority,status,department_key').not('next_run_at','is',null).gte('next_run_at', from).lt('next_run_at', to).eq('status','active').order('next_run_at'),
    ]);
    const merged: Item[] = [];
    (events.data || []).forEach((x:any) => merged.push({ id:`e-${x.id}`, title:x.title, when:x.starts_at, kind:'event', subtitle:[x.location,x.city].filter(Boolean).join(' · ') }));
    (tasks.data || []).forEach((x:any) => merged.push({ id:`t-${x.id}`, title:x.title, when:x.due_date, kind:'deadline', subtitle:x.campaign_or_project || `${x.priority || 'normal'} priority` }));
    (ops.data || []).forEach((x:any) => merged.push({ id:`o-${x.id}`, title:x.operation_name, when:x.next_run_at, kind:'operation', subtitle:x.department_key || 'Automated operation' }));
    merged.sort((a,b) => +new Date(a.when) - +new Date(b.when));
    setItems(merged);
    setLoading(false);
  }

  useEffect(() => { load(); }, [offset]);

  const groups = useMemo(() => {
    const map: Record<string, Item[]> = {};
    items.forEach((item) => {
      const key = new Date(item.when).toDateString();
      (map[key] ||= []).push(item);
    });
    return Object.entries(map);
  }, [items]);

  const label = `${windowStart.toLocaleDateString('en-US',{month:'short',day:'numeric'})} – ${new Date(windowEnd.getTime()-86400000).toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric'})}`;

  return <View style={styles.screen}><SafeAreaView style={{flex:1}} edges={['top']}>
    <ScrollView refreshControl={<RefreshControl refreshing={loading} onRefresh={load} tintColor={GOLD}/> } contentContainerStyle={styles.content}>
      <View style={styles.headerRow}><View><Text style={styles.eyebrow}>TEAM SCHEDULE</Text><Text style={styles.title}>Calendar</Text><Text style={styles.subtitle}>Deadlines, events and scheduled operations in one view.</Text></View><TouchableOpacity style={styles.iconBtn} onPress={load}><RefreshCw size={20} color={GOLD}/></TouchableOpacity></View>
      <View style={styles.rangeRow}><TouchableOpacity style={styles.arrow} onPress={()=>setOffset(v=>v-1)}><ChevronLeft color="#fff"/></TouchableOpacity><View style={styles.range}><CalendarDays color={GOLD} size={19}/><Text style={styles.rangeText}>{label}</Text></View><TouchableOpacity style={styles.arrow} onPress={()=>setOffset(v=>v+1)}><ChevronRight color="#fff"/></TouchableOpacity></View>
      <View style={styles.kpis}><Kpi value={items.filter(i=>i.kind==='deadline').length} label="DEADLINES"/><Kpi value={items.filter(i=>i.kind==='event').length} label="EVENTS"/><Kpi value={items.filter(i=>i.kind==='operation').length} label="OPERATIONS"/></View>
      {loading && !items.length ? <ActivityIndicator color={GOLD} size="large" style={{marginTop:40}}/> : groups.length ? groups.map(([day, dayItems]) => <View key={day} style={styles.dayCard}><Text style={styles.dayTitle}>{new Date(day).toLocaleDateString('en-US',{weekday:'short',month:'short',day:'numeric'})}</Text>{dayItems.map(item => <View key={item.id} style={styles.item}><View style={[styles.dot,{backgroundColor:item.kind==='event'?'#4F8CFF':item.kind==='deadline'?'#EF5A5A':'#9B6BFF'}]}/><View style={{flex:1}}><Text style={styles.itemTitle}>{item.title}</Text><Text style={styles.itemMeta}>{new Date(item.when).toLocaleTimeString('en-US',{hour:'numeric',minute:'2-digit'})} · {item.subtitle}</Text></View><Clock3 color="#6F6A61" size={16}/></View>)}</View>) : <View style={styles.empty}><CalendarDays color="#6F6A61" size={38}/><Text style={styles.emptyTitle}>Nothing scheduled</Text><Text style={styles.emptyText}>This week has no scoped events, deadlines or operations.</Text></View>}
    </ScrollView>
  </SafeAreaView></View>;
}

function Kpi({value,label}:{value:number;label:string}) { return <View style={styles.kpi}><Text style={styles.kpiValue}>{value}</Text><Text style={styles.kpiLabel}>{label}</Text></View> }

const styles = StyleSheet.create({screen:{flex:1,backgroundColor:BG},content:{padding:18,paddingBottom:110},headerRow:{flexDirection:'row',justifyContent:'space-between',gap:12},eyebrow:{color:GOLD,fontWeight:'800',letterSpacing:2,fontSize:12},title:{color:'#fff',fontWeight:'900',fontSize:40,marginTop:3},subtitle:{color:'#9A948A',fontSize:15,lineHeight:22,maxWidth:310,marginTop:5},iconBtn:{width:44,height:44,borderRadius:14,borderWidth:1,borderColor:BORDER,alignItems:'center',justifyContent:'center'},rangeRow:{flexDirection:'row',gap:8,marginTop:22},arrow:{width:46,height:48,borderRadius:15,borderWidth:1,borderColor:BORDER,alignItems:'center',justifyContent:'center',backgroundColor:CARD},range:{flex:1,height:48,borderRadius:15,borderWidth:1,borderColor:BORDER,backgroundColor:CARD,flexDirection:'row',alignItems:'center',justifyContent:'center',gap:9},rangeText:{color:'#fff',fontWeight:'800'},kpis:{flexDirection:'row',gap:8,marginTop:12},kpi:{flex:1,backgroundColor:CARD,borderWidth:1,borderColor:BORDER,borderRadius:16,padding:13},kpiValue:{color:'#fff',fontSize:26,fontWeight:'900'},kpiLabel:{color:'#8D877D',fontSize:10,fontWeight:'800',marginTop:4},dayCard:{backgroundColor:CARD,borderWidth:1,borderColor:BORDER,borderRadius:18,padding:14,marginTop:14},dayTitle:{color:GOLD,fontSize:18,fontWeight:'900',marginBottom:7},item:{flexDirection:'row',alignItems:'center',gap:10,paddingVertical:12,borderTopWidth:1,borderTopColor:'#211F1B'},dot:{width:8,height:8,borderRadius:4},itemTitle:{color:'#fff',fontWeight:'800',fontSize:15},itemMeta:{color:'#8E887E',fontSize:12,marginTop:3},empty:{alignItems:'center',paddingVertical:70},emptyTitle:{color:'#fff',fontWeight:'900',fontSize:22,marginTop:15},emptyText:{color:'#8E887E',textAlign:'center',marginTop:7}});
