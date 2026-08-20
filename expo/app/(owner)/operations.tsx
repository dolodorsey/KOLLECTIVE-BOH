import React, { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, RefreshControl, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Search, SlidersHorizontal, CheckCircle2, AlertTriangle, Play, Building2 } from 'lucide-react-native';
import { supabase } from '../../lib/supabase';

const GOLD='#E0A700', BG='#0A0A0A', CARD='#141414', BORDER='#28251F';
type ViewMode='all'|'in_progress'|'blocked'|'urgent';

type Task={id:string;title:string;status:string;priority:string|null;due_date:string|null;blocker:string|null;next_action:string|null;completion_percent:number|null;campaign_or_project:string|null;department_key:string|null};

export default function OperationsScreen(){
  const [loading,setLoading]=useState(true);
  const [search,setSearch]=useState('');
  const [mode,setMode]=useState<ViewMode>('all');
  const [tasks,setTasks]=useState<Task[]>([]);

  async function load(){
    setLoading(true);
    const {data}=await supabase.from('tasks').select('id,title,status,priority,due_date,blocker,next_action,completion_percent,campaign_or_project,department_key').is('archived_at',null).neq('status','completed').order('due_date',{ascending:true,nullsFirst:false}).limit(250);
    setTasks((data||[]) as Task[]); setLoading(false);
  }
  useEffect(()=>{load()},[]);

  const filtered=useMemo(()=>tasks.filter(t=>{
    const q=search.trim().toLowerCase();
    if(q && !JSON.stringify(t).toLowerCase().includes(q)) return false;
    if(mode==='in_progress') return t.status==='in_progress';
    if(mode==='blocked') return !!t.blocker || t.status==='blocked';
    if(mode==='urgent') return ['urgent','critical','p0'].includes((t.priority||'').toLowerCase());
    return true;
  }),[tasks,search,mode]);

  async function start(id:string){await supabase.from('tasks').update({status:'in_progress',claimed_at:new Date().toISOString()}).eq('id',id);load()}
  async function complete(id:string){await supabase.from('tasks').update({status:'completed',completion_percent:100,completed_at:new Date().toISOString()}).eq('id',id);load()}

  const counts={all:tasks.length,in_progress:tasks.filter(t=>t.status==='in_progress').length,blocked:tasks.filter(t=>!!t.blocker||t.status==='blocked').length,urgent:tasks.filter(t=>['urgent','critical','p0'].includes((t.priority||'').toLowerCase())).length};

  return <View style={styles.screen}><SafeAreaView style={{flex:1}} edges={['top']}><ScrollView refreshControl={<RefreshControl refreshing={loading} onRefresh={load} tintColor={GOLD}/>} contentContainerStyle={styles.content}>
    <View style={styles.headerRow}><View style={{flex:1}}><Text style={styles.eyebrow}>KOLLECTIVE EXECUTION</Text><Text style={styles.title}>Execute</Text><Text style={styles.subtitle}>Priority work across the enterprise. Start, unblock and finish from one screen.</Text></View><Pressable style={styles.filterBtn}><SlidersHorizontal color={GOLD} size={20}/></Pressable></View>
    <View style={styles.search}><Search color="#777168" size={18}/><TextInput value={search} onChangeText={setSearch} placeholder="Search tasks, projects or brands" placeholderTextColor="#6F6A61" style={styles.searchInput}/></View>
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabs}>{([{k:'all',l:'My Work'},{k:'urgent',l:'Urgent'},{k:'in_progress',l:'In Progress'},{k:'blocked',l:'Blocked'}] as any[]).map(x=><Pressable key={x.k} onPress={()=>setMode(x.k)} style={[styles.tab,mode===x.k&&styles.tabActive]}><Text style={[styles.tabText,mode===x.k&&styles.tabTextActive]}>{x.l} · {counts[x.k as ViewMode]}</Text></Pressable>)}</ScrollView>
    <Text style={styles.sectionTitle}>PRIORITY TASKS</Text>
    {loading&&!tasks.length?<ActivityIndicator color={GOLD} size="large" style={{marginTop:50}}/>:filtered.length?filtered.map(task=><View key={task.id} style={styles.card}>
      <View style={styles.cardTop}><View style={[styles.priorityDot,{backgroundColor:(task.priority||'').toLowerCase()==='urgent'?'#EF5A5A':task.blocker?'#F2B84B':'#57C785'}]}/><View style={{flex:1}}><Text style={styles.cardTitle}>{task.title}</Text><Text style={styles.meta}>{task.campaign_or_project||task.department_key||'Enterprise work'} · {task.priority||'normal'}</Text></View><Text style={styles.percent}>{task.completion_percent||0}%</Text></View>
      <View style={styles.progressTrack}><View style={[styles.progressFill,{width:`${Math.max(3,Math.min(100,task.completion_percent||0))}%` as any}]}/></View>
      {!!task.blocker&&<View style={styles.blocker}><AlertTriangle color="#F2B84B" size={15}/><Text style={styles.blockerText}>{task.blocker}</Text></View>}
      {!!task.next_action&&<Text style={styles.next}>Next: {task.next_action}</Text>}
      <View style={styles.actions}>{task.status!=='in_progress'&&<Pressable style={styles.secondary} onPress={()=>start(task.id)}><Play color="#D7CFC2" size={14}/><Text style={styles.secondaryText}>Start</Text></Pressable>}<Pressable style={styles.primary} onPress={()=>complete(task.id)}><CheckCircle2 color="#fff" size={14}/><Text style={styles.primaryText}>Complete</Text></Pressable></View>
    </View>):<View style={styles.empty}><CheckCircle2 color="#6C675F" size={42}/><Text style={styles.emptyTitle}>Nothing in this view</Text><Text style={styles.emptyText}>Switch filters or pull to refresh.</Text></View>}
    <View style={styles.footerNote}><Building2 color={GOLD} size={17}/><Text style={styles.footerText}>Execution stays brand-isolated while rolling up to the enterprise.</Text></View>
  </ScrollView></SafeAreaView></View>
}

const styles=StyleSheet.create({screen:{flex:1,backgroundColor:BG},content:{padding:18,paddingBottom:110},headerRow:{flexDirection:'row',gap:12},eyebrow:{color:GOLD,fontWeight:'800',letterSpacing:2,fontSize:12},title:{color:'#fff',fontSize:40,fontWeight:'900',marginTop:3},subtitle:{color:'#999287',fontSize:15,lineHeight:22,marginTop:5},filterBtn:{width:44,height:44,borderRadius:14,borderWidth:1,borderColor:BORDER,alignItems:'center',justifyContent:'center'},search:{height:48,marginTop:20,backgroundColor:CARD,borderWidth:1,borderColor:BORDER,borderRadius:15,flexDirection:'row',alignItems:'center',paddingHorizontal:13,gap:9},searchInput:{flex:1,color:'#fff',fontSize:14},tabs:{gap:8,paddingVertical:14},tab:{paddingHorizontal:14,paddingVertical:10,borderRadius:18,borderWidth:1,borderColor:BORDER,backgroundColor:CARD},tabActive:{backgroundColor:'#F4EFE4'},tabText:{color:'#9A948B',fontWeight:'800',fontSize:11},tabTextActive:{color:'#0A0A0A'},sectionTitle:{color:GOLD,fontWeight:'900',fontSize:12,letterSpacing:1.5,marginBottom:9,marginTop:4},card:{backgroundColor:'#F2EEE6',borderRadius:17,padding:14,marginBottom:10},cardTop:{flexDirection:'row',alignItems:'center',gap:10},priorityDot:{width:9,height:9,borderRadius:5},cardTitle:{color:'#151515',fontWeight:'900',fontSize:15},meta:{color:'#777168',fontSize:12,marginTop:3,textTransform:'capitalize'},percent:{color:'#171717',fontWeight:'900'},progressTrack:{height:5,backgroundColor:'#D8D2C7',borderRadius:4,marginTop:12,overflow:'hidden'},progressFill:{height:5,backgroundColor:'#B98300',borderRadius:4},blocker:{flexDirection:'row',gap:7,alignItems:'flex-start',marginTop:10},blockerText:{color:'#7A5510',fontSize:12,flex:1},next:{color:'#655F56',fontSize:12,marginTop:9},actions:{flexDirection:'row',gap:8,marginTop:12},primary:{backgroundColor:'#1D6B3D',paddingHorizontal:12,paddingVertical:9,borderRadius:10,flexDirection:'row',gap:6,alignItems:'center'},primaryText:{color:'#fff',fontWeight:'800',fontSize:12},secondary:{borderWidth:1,borderColor:'#C7BFB2',paddingHorizontal:12,paddingVertical:9,borderRadius:10,flexDirection:'row',gap:6,alignItems:'center'},secondaryText:{color:'#5B554D',fontWeight:'800',fontSize:12},empty:{alignItems:'center',paddingVertical:75},emptyTitle:{color:'#fff',fontWeight:'900',fontSize:22,marginTop:16},emptyText:{color:'#8D877D',marginTop:6},footerNote:{marginTop:16,borderTopWidth:1,borderTopColor:BORDER,paddingTop:16,flexDirection:'row',gap:8,alignItems:'center'},footerText:{color:'#7F796F',fontSize:12,flex:1}})
