import React, { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, RefreshControl, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AlertTriangle, BellRing, CheckCircle2, ShieldAlert } from 'lucide-react-native';
import { supabase } from '../../lib/supabase';

const GOLD='#E0A700', BG='#0A0A0A', CARD='#141414', BORDER='#28251F';
type Tab='all'|'approvals'|'blocked'|'alerts';

export default function ActionsScreen(){
  const [tab,setTab]=useState<Tab>('all');
  const [loading,setLoading]=useState(true);
  const [approvals,setApprovals]=useState<any[]>([]);
  const [blocked,setBlocked]=useState<any[]>([]);
  const [alerts,setAlerts]=useState<any[]>([]);

  async function load(){
    setLoading(true);
    const [a,b,c]=await Promise.all([
      supabase.from('company_execution_queue').select('id,title,channel,queue_status,approval_status,scheduled_at').eq('approval_status','pending').order('created_at',{ascending:false}).limit(40),
      supabase.from('tasks').select('id,title,priority,status,blocker,due_date,campaign_or_project').not('blocker','is',null).neq('status','completed').order('created_at',{ascending:false}).limit(40),
      supabase.from('enterprise_incidents').select('id,title,summary,severity,status,category,last_detected_at').neq('status','resolved').order('last_detected_at',{ascending:false}).limit(40),
    ]);
    setApprovals(a.data||[]); setBlocked(b.data||[]); setAlerts(c.data||[]); setLoading(false);
  }
  useEffect(()=>{load()},[]);

  async function approve(id:string){ await supabase.from('company_execution_queue').update({approval_status:'approved'}).eq('id',id); load(); }
  async function resolve(id:string){ await supabase.from('enterprise_incidents').update({status:'resolved',resolved_at:new Date().toISOString()}).eq('id',id); load(); }
  async function startTask(id:string){ await supabase.from('tasks').update({status:'in_progress'}).eq('id',id); load(); }

  const total=approvals.length+blocked.length+alerts.length;
  const tabs=useMemo(()=>[{k:'all',l:`ALL · ${total}`},{k:'approvals',l:`APPROVALS · ${approvals.length}`},{k:'blocked',l:`BLOCKED · ${blocked.length}`},{k:'alerts',l:`ALERTS · ${alerts.length}`}], [total,approvals.length,blocked.length,alerts.length]);

  return <View style={styles.screen}><SafeAreaView style={{flex:1}} edges={['top']}><ScrollView refreshControl={<RefreshControl refreshing={loading} onRefresh={load} tintColor={GOLD}/>} contentContainerStyle={styles.content}>
    <View style={styles.header}><Text style={styles.eyebrow}>BOH ACTION CENTER</Text><Text style={styles.title}>Actions</Text><Text style={styles.subtitle}>{total?`${total} items need review or intervention.`:'You’re caught up.'}</Text></View>
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabs}>{tabs.map((t:any)=><TouchableOpacity key={t.k} onPress={()=>setTab(t.k)} style={[styles.tab,tab===t.k&&styles.tabActive]}><Text style={[styles.tabText,tab===t.k&&styles.tabTextActive]}>{t.l}</Text></TouchableOpacity>)}</ScrollView>
    {loading&&total===0?<ActivityIndicator color={GOLD} size="large" style={{marginTop:60}}/>:<>
      {(tab==='all'||tab==='approvals')&&approvals.length>0&&<Section title="APPROVALS">{approvals.map(x=><Card key={x.id} icon={<CheckCircle2 size={18} color="#57C785"/>} title={x.title} meta={`${x.channel||'Execution'} · ${x.queue_status||'queued'}`}><View style={styles.actions}><TouchableOpacity style={styles.primary} onPress={()=>approve(x.id)}><Text style={styles.primaryText}>Approve</Text></TouchableOpacity><TouchableOpacity style={styles.secondary}><Text style={styles.secondaryText}>Review</Text></TouchableOpacity></View></Card>)}</Section>}
      {(tab==='all'||tab==='blocked')&&blocked.length>0&&<Section title="BLOCKED WORK">{blocked.map(x=><Card key={x.id} icon={<AlertTriangle size={18} color="#F3B544"/>} title={x.title} meta={x.campaign_or_project||x.priority||'Task'} body={x.blocker}><TouchableOpacity style={styles.secondary} onPress={()=>startTask(x.id)}><Text style={styles.secondaryText}>Open task</Text></TouchableOpacity></Card>)}</Section>}
      {(tab==='all'||tab==='alerts')&&alerts.length>0&&<Section title="AI + SYSTEM ALERTS">{alerts.map(x=><Card key={x.id} icon={<ShieldAlert size={18} color="#EF6666"/>} title={x.title} meta={`${x.severity||'alert'} · ${x.category||'system'}`} body={x.summary}><View style={styles.actions}><TouchableOpacity style={styles.primary} onPress={()=>resolve(x.id)}><Text style={styles.primaryText}>Resolve</Text></TouchableOpacity><TouchableOpacity style={styles.secondary}><Text style={styles.secondaryText}>Investigate</Text></TouchableOpacity></View></Card>)}</Section>}
      {total===0&&<View style={styles.empty}><BellRing color="#69645C" size={44}/><Text style={styles.emptyTitle}>No actions waiting</Text><Text style={styles.emptyText}>Approvals, blockers and system alerts will appear here.</Text></View>}
    </>}
  </ScrollView></SafeAreaView></View>
}

function Section({title,children}:{title:string;children:React.ReactNode}){return <View style={{marginTop:22}}><Text style={styles.sectionTitle}>{title}</Text>{children}</View>}
function Card({icon,title,meta,body,children}:{icon:React.ReactNode;title:string;meta:string;body?:string|null;children?:React.ReactNode}){return <View style={styles.card}><View style={styles.cardTop}><View style={styles.iconBox}>{icon}</View><View style={{flex:1}}><Text style={styles.cardTitle}>{title}</Text><Text style={styles.meta}>{meta}</Text></View></View>{!!body&&<Text style={styles.body}>{body}</Text>}{children&&<View style={{marginTop:12}}>{children}</View>}</View>}

const styles=StyleSheet.create({screen:{flex:1,backgroundColor:BG},content:{padding:18,paddingBottom:110},header:{marginBottom:10},eyebrow:{color:GOLD,fontWeight:'800',letterSpacing:2,fontSize:12},title:{color:'#fff',fontSize:40,fontWeight:'900',marginTop:3},subtitle:{color:'#999287',fontSize:15,marginTop:4},tabs:{gap:8,paddingVertical:14},tab:{paddingHorizontal:14,paddingVertical:10,borderRadius:18,borderWidth:1,borderColor:BORDER,backgroundColor:CARD},tabActive:{backgroundColor:'#F4EFE4'},tabText:{color:'#9A948B',fontWeight:'800',fontSize:11},tabTextActive:{color:'#0A0A0A'},sectionTitle:{color:GOLD,fontWeight:'900',fontSize:12,letterSpacing:1.5,marginBottom:9},card:{backgroundColor:CARD,borderWidth:1,borderColor:BORDER,borderRadius:17,padding:14,marginBottom:10},cardTop:{flexDirection:'row',gap:10,alignItems:'center'},iconBox:{width:34,height:34,borderRadius:11,backgroundColor:'#1E1C18',alignItems:'center',justifyContent:'center'},cardTitle:{color:'#fff',fontWeight:'800',fontSize:15},meta:{color:'#8D877D',fontSize:12,marginTop:2,textTransform:'capitalize'},body:{color:'#B4ADA2',fontSize:13,lineHeight:18,marginTop:10},actions:{flexDirection:'row',gap:8},primary:{backgroundColor:'#1E6A3B',paddingHorizontal:14,paddingVertical:9,borderRadius:11},primaryText:{color:'#fff',fontWeight:'800',fontSize:12},secondary:{borderWidth:1,borderColor:'#3A362F',paddingHorizontal:14,paddingVertical:9,borderRadius:11,alignSelf:'flex-start'},secondaryText:{color:'#D8D0C3',fontWeight:'800',fontSize:12},empty:{alignItems:'center',paddingVertical:90},emptyTitle:{color:'#fff',fontWeight:'900',fontSize:22,marginTop:16},emptyText:{color:'#8D877D',textAlign:'center',marginTop:7}})
