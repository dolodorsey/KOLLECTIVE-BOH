import React, { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, RefreshControl, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Search, Building2, ChevronRight } from 'lucide-react-native';
import { supabase } from '../../lib/supabase';

const GOLD='#E0A700', BG='#0A0A0A', CARD='#141414', BORDER='#28251F';
type Row={id:string;entity_name:string;division:string|null;entity_type:string|null;status:string;priority:string|null;primary_poc:string|null;current_blocker:string|null;next_action:string|null;brand_readiness:number|null;operational_readiness:number|null;revenue_readiness:number|null;technical_readiness:number|null};

export default function EntitiesScreen(){
  const [loading,setLoading]=useState(true);
  const [rows,setRows]=useState<Row[]>([]);
  const [search,setSearch]=useState('');
  const [division,setDivision]=useState('All');

  async function load(){
    setLoading(true);
    const {data}=await supabase.from('enterprise_directory_records').select('id,entity_name,division,entity_type,status,priority,primary_poc,current_blocker,next_action,brand_readiness,operational_readiness,revenue_readiness,technical_readiness').order('entity_name');
    setRows((data||[]) as Row[]); setLoading(false);
  }
  useEffect(()=>{load()},[]);

  const divisions=useMemo(()=>['All',...Array.from(new Set(rows.map(r=>r.division).filter(Boolean) as string[])).sort()], [rows]);
  const filtered=useMemo(()=>rows.filter(r=>{
    const q=search.trim().toLowerCase();
    return (division==='All'||r.division===division) && (!q||JSON.stringify(r).toLowerCase().includes(q));
  }),[rows,search,division]);
  const score=(r:Row)=>Math.round([r.brand_readiness,r.operational_readiness,r.revenue_readiness,r.technical_readiness].map(v=>v??0).reduce((a,b)=>a+b,0)/4);
  const active=rows.filter(r=>['operating','active','live'].includes((r.status||'').toLowerCase()));
  const atRisk=rows.filter(r=>!!r.current_blocker || ['blocked','at_risk'].includes((r.status||'').toLowerCase()));

  return <View style={styles.screen}><SafeAreaView style={{flex:1}} edges={['top']}><ScrollView refreshControl={<RefreshControl refreshing={loading} onRefresh={load} tintColor={GOLD}/>} contentContainerStyle={styles.content}>
    <Text style={styles.eyebrow}>KOLLECTIVE DIRECTORY</Text><Text style={styles.title}>Companies</Text><Text style={styles.subtitle}>Browse the enterprise by division, operating status and readiness.</Text>
    <View style={styles.metrics}><Metric value={rows.length} label="COMPANIES"/><Metric value={active.length} label="ACTIVE"/><Metric value={atRisk.length} label="AT RISK"/></View>
    <View style={styles.search}><Search color="#777168" size={18}/><TextInput value={search} onChangeText={setSearch} placeholder="Search companies or divisions" placeholderTextColor="#6F6A61" style={styles.searchInput}/></View>
    <Text style={styles.sectionTitle}>BROWSE BY DIVISION</Text><ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.divisions}>{divisions.map(d=><TouchableOpacity key={d} onPress={()=>setDivision(d)} style={[styles.divisionChip,division===d&&styles.divisionActive]}><Text style={[styles.divisionText,division===d&&styles.divisionTextActive]}>{d}</Text></TouchableOpacity>)}</ScrollView>
    {loading&&!rows.length?<ActivityIndicator color={GOLD} size="large" style={{marginTop:50}}/>:<>
      <Text style={styles.sectionTitle}>ACTIVE NOW</Text><View style={styles.compactGrid}>{active.slice(0,6).map(r=><View key={r.id} style={styles.compact}><Text style={styles.compactName} numberOfLines={1}>{r.entity_name}</Text><Text style={styles.compactMeta}>{r.division||r.entity_type||'Enterprise'}</Text><View style={styles.progress}><View style={[styles.progressFill,{width:`${Math.max(3,score(r))}%` as any}]}/></View><Text style={styles.health}>{score(r)}% READY</Text></View>)}</View>
      <View style={styles.headingRow}><Text style={styles.sectionTitle}>ALL COMPANIES · {filtered.length}</Text></View>
      {filtered.map(r=><View key={r.id} style={styles.card}><View style={styles.cardTop}><View style={styles.iconBox}><Building2 color={GOLD} size={18}/></View><View style={{flex:1}}><Text style={styles.cardTitle}>{r.entity_name}</Text><Text style={styles.meta}>{r.division||'Unassigned'} · {r.primary_poc||'POC needed'}</Text></View><Text style={styles.score}>{score(r)}%</Text><ChevronRight color="#665F55" size={18}/></View><View style={styles.progress}><View style={[styles.progressFill,{width:`${Math.max(3,score(r))}%` as any}]}/></View><View style={styles.statusRow}><Text style={styles.status}>{r.status||'needs setup'}</Text>{!!r.current_blocker&&<Text style={styles.risk}>BLOCKED</Text>}</View><Text style={styles.next}>Next: {r.next_action||'Add next action'}</Text></View>)}
    </>}
  </ScrollView></SafeAreaView></View>
}

function Metric({value,label}:{value:number;label:string}){return <View style={styles.metric}><Text style={styles.metricValue}>{value}</Text><Text style={styles.metricLabel}>{label}</Text></View>}

const styles=StyleSheet.create({screen:{flex:1,backgroundColor:BG},content:{padding:18,paddingBottom:110},eyebrow:{color:GOLD,fontWeight:'800',letterSpacing:2,fontSize:12},title:{color:'#fff',fontSize:40,fontWeight:'900',marginTop:3},subtitle:{color:'#999287',fontSize:15,lineHeight:22,marginTop:5,maxWidth:340},metrics:{flexDirection:'row',gap:8,marginTop:18},metric:{flex:1,backgroundColor:CARD,borderWidth:1,borderColor:BORDER,borderRadius:15,padding:12},metricValue:{color:'#fff',fontSize:24,fontWeight:'900'},metricLabel:{color:'#8D877D',fontSize:10,fontWeight:'800',marginTop:3},search:{height:48,marginTop:12,backgroundColor:CARD,borderWidth:1,borderColor:BORDER,borderRadius:15,flexDirection:'row',alignItems:'center',paddingHorizontal:13,gap:9},searchInput:{flex:1,color:'#fff',fontSize:14},sectionTitle:{color:GOLD,fontWeight:'900',fontSize:12,letterSpacing:1.5,marginTop:20,marginBottom:9},divisions:{gap:8,paddingBottom:2},divisionChip:{paddingHorizontal:13,paddingVertical:9,borderRadius:16,borderWidth:1,borderColor:BORDER,backgroundColor:CARD},divisionActive:{backgroundColor:'#F4EFE4'},divisionText:{color:'#9A948B',fontWeight:'800',fontSize:11},divisionTextActive:{color:'#0A0A0A'},compactGrid:{flexDirection:'row',flexWrap:'wrap',gap:8},compact:{width:'48.7%',backgroundColor:'#F1EDE5',borderRadius:15,padding:12},compactName:{color:'#151515',fontWeight:'900',fontSize:14},compactMeta:{color:'#756E65',fontSize:11,marginTop:3},health:{color:'#5E574F',fontWeight:'800',fontSize:10,marginTop:6},headingRow:{flexDirection:'row',justifyContent:'space-between'},card:{backgroundColor:CARD,borderWidth:1,borderColor:BORDER,borderRadius:17,padding:14,marginBottom:10},cardTop:{flexDirection:'row',alignItems:'center',gap:10},iconBox:{width:35,height:35,borderRadius:11,backgroundColor:'#1F1D19',alignItems:'center',justifyContent:'center'},cardTitle:{color:'#fff',fontWeight:'900',fontSize:15},meta:{color:'#8D877D',fontSize:12,marginTop:2},score:{color:GOLD,fontWeight:'900',fontSize:17},progress:{height:5,backgroundColor:'#302D28',borderRadius:4,marginTop:11,overflow:'hidden'},progressFill:{height:5,backgroundColor:GOLD,borderRadius:4},statusRow:{flexDirection:'row',gap:8,alignItems:'center',marginTop:10},status:{color:'#B8B0A4',fontSize:11,fontWeight:'800',textTransform:'uppercase'},risk:{color:'#EF6666',fontSize:10,fontWeight:'900'},next:{color:'#8D877D',fontSize:12,marginTop:7}})
