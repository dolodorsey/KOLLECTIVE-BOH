import React, { useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { AlertTriangle, CheckCircle2, Clock3, Sparkles, ShieldCheck, Zap } from 'lucide-react-native';
import { useAuth } from '@/hooks/auth-context';
import { trpc } from '@/lib/trpc';

const GOLD = '#E0A700';
const BG = '#0B0B0B';
const CARD = '#151515';
const MUTED = '#8F8A80';
const BORDER = '#2A2824';

export default function OwnerDashboard() {
  const { profile } = useAuth();
  const queryClient = useQueryClient();
  const router = useRouter();
  const { data: dashboardData, isLoading: summaryLoading } = trpc.dashboard.summary.useQuery();

  const summary = dashboardData || {
    active_entities_count: 0,
    alerts_open_count: 0,
    workflow_runs_today_count: 0,
    workflow_failures_today_count: 0,
    tasks_open_count: 0,
    team_online_count: 0,
    system_health: 'ok' as const,
  };

  const urgent = summary.workflow_failures_today_count || summary.alerts_open_count || 0;
  const approvals = 0;
  const dueToday = summary.tasks_open_count || 0;
  const blocked = summary.workflow_failures_today_count || 0;

  const priorityItems = useMemo(() => {
    const items = [
      urgent > 0 ? { tone: 'red', title: 'Enterprise alerts need review', sub: `${urgent} open operational issue${urgent === 1 ? '' : 's'}`, action: 'Review', route: '/operations' } : null,
      summary.workflow_failures_today_count > 0 ? { tone: 'amber', title: 'Workflow failures detected', sub: `${summary.workflow_failures_today_count} failed automation${summary.workflow_failures_today_count === 1 ? '' : 's'} today`, action: 'Inspect', route: '/workflows' } : null,
      summary.system_health === 'ok' ? { tone: 'green', title: 'Core systems operational', sub: `${summary.workflow_runs_today_count} workflow runs today`, action: 'Open', route: '/workflows' } : null,
    ].filter(Boolean) as Array<{tone:string;title:string;sub:string;action:string;route:string}>;
    return items.slice(0, 3);
  }, [urgent, summary]);

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <ScrollView
          contentContainerStyle={styles.content}
          refreshControl={<RefreshControl refreshing={summaryLoading} onRefresh={() => queryClient.invalidateQueries()} tintColor={GOLD} colors={[GOLD]} />}
        >
          <View style={styles.topRow}>
            <View>
              <Text style={styles.eyebrow}>KOLLECTIVE BOH</Text>
              <Text style={styles.greeting}>Good morning,</Text>
              <Text style={styles.name}>{profile?.full_name || 'Dr. Dorsey'}</Text>
              <View style={styles.healthRow}>
                <View style={styles.liveDot} />
                <Text style={styles.healthText}>Enterprise operational</Text>
                <Text style={styles.healthPercent}>• {summary.system_health === 'ok' ? '94%' : 'Attention'}</Text>
              </View>
            </View>
            <View style={styles.markBox}><Text style={styles.mark}>K</Text></View>
          </View>

          <View style={styles.metricRow}>
            <Metric value={urgent} label="URGENT" tone="red" />
            <Metric value={approvals} label="APPROVALS" tone="gold" />
            <Metric value={dueToday} label="DUE TODAY" tone="blue" />
            <Metric value={blocked} label="BLOCKED" tone="purple" />
          </View>

          <SectionTitle title="NEEDS YOUR ATTENTION" action="View all" onPress={() => router.push('/operations')} />
          <View style={styles.priorityStack}>
            {priorityItems.length ? priorityItems.map((item, index) => (
              <Pressable key={`${item.title}-${index}`} style={styles.priorityCard} onPress={() => router.push(item.route as any)}>
                <View style={[styles.priorityIcon, item.tone === 'red' && styles.redBg, item.tone === 'amber' && styles.amberBg, item.tone === 'green' && styles.greenBg]}>
                  {item.tone === 'red' ? <AlertTriangle color="#FF6259" size={17} /> : item.tone === 'amber' ? <Clock3 color="#F0B94A" size={17} /> : <CheckCircle2 color="#42C77A" size={17} />}
                </View>
                <View style={styles.grow}>
                  <Text style={styles.priorityTitle}>{item.title}</Text>
                  <Text style={styles.prioritySub}>{item.sub}</Text>
                </View>
                <Text style={styles.priorityAction}>{item.action} →</Text>
              </Pressable>
            )) : (
              <View style={styles.priorityCard}><CheckCircle2 color="#42C77A" size={18} /><Text style={styles.emptyGood}>Nothing critical is waiting right now.</Text></View>
            )}
          </View>

          <SectionTitle title="TODAY" action="Open execution" onPress={() => router.push('/operations')} />
          <View style={styles.scheduleCard}>
            <ScheduleLine time="09:00" title="Priority review" subtitle="Enterprise operations" />
            <ScheduleLine time="11:30" title="Team execution check" subtitle={`${summary.team_online_count} team online`} />
            <ScheduleLine time="14:00" title="Workflow health review" subtitle={`${summary.workflow_runs_today_count} runs today`} />
            <ScheduleLine time="17:00" title="Approvals + blockers" subtitle="Close the day clean" last />
          </View>

          <SectionTitle title="ENTERPRISE OVERVIEW" action="Last 24h" />
          <View style={styles.overviewGrid}>
            <Overview icon={<ShieldCheck color={GOLD} size={18} />} value={summary.active_entities_count} label="Companies" />
            <Overview icon={<CheckCircle2 color="#42C77A" size={18} />} value={summary.team_online_count} label="Live" />
            <Overview icon={<Clock3 color="#F0B94A" size={18} />} value={summary.tasks_open_count} label="Open work" />
            <Overview icon={<AlertTriangle color="#FF6259" size={18} />} value={summary.alerts_open_count} label="At risk" />
            <Overview icon={<Zap color="#5FA8FF" size={18} />} value={summary.workflow_runs_today_count} label="Runs" />
            <Overview icon={<Sparkles color="#C37BFF" size={18} />} value={summary.workflow_failures_today_count} label="Failures" />
          </View>

          <Pressable style={styles.aiCard} onPress={() => router.push('/compose')}>
            <View style={styles.aiBadge}><Sparkles color="#0B0B0B" size={18} /></View>
            <View style={styles.grow}>
              <Text style={styles.aiTitle}>AI OPERATIONS</Text>
              <Text style={styles.aiSub}>Ask what needs attention, what is blocked, or what should execute next.</Text>
            </View>
            <Text style={styles.aiArrow}>→</Text>
          </Pressable>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

function Metric({ value, label, tone }: { value: number; label: string; tone: string }) {
  return <View style={styles.metricCard}><Text style={[styles.metricValue, tone === 'red' && {color:'#FF6259'}, tone === 'gold' && {color:GOLD}, tone === 'blue' && {color:'#5FA8FF'}, tone === 'purple' && {color:'#C37BFF'}]}>{value}</Text><Text style={styles.metricLabel}>{label}</Text></View>;
}

function SectionTitle({ title, action, onPress }: { title: string; action?: string; onPress?: () => void }) {
  return <View style={styles.sectionRow}><Text style={styles.sectionTitle}>{title}</Text>{action ? <Pressable onPress={onPress}><Text style={styles.sectionAction}>{action}</Text></Pressable> : null}</View>;
}

function ScheduleLine({ time, title, subtitle, last }: { time:string; title:string; subtitle:string; last?:boolean }) {
  return <View style={[styles.scheduleLine, last && {borderBottomWidth:0}]}><Text style={styles.scheduleTime}>{time}</Text><View style={styles.timelineDot} /><View style={styles.grow}><Text style={styles.scheduleTitle}>{title}</Text><Text style={styles.scheduleSub}>{subtitle}</Text></View><Text style={styles.chev}>›</Text></View>;
}

function Overview({ icon, value, label }: { icon: React.ReactNode; value:number; label:string }) {
  return <View style={styles.overviewCard}>{icon}<Text style={styles.overviewValue}>{value}</Text><Text style={styles.overviewLabel}>{label}</Text></View>;
}

const styles = StyleSheet.create({
  container:{flex:1,backgroundColor:BG},safeArea:{flex:1},content:{padding:18,paddingBottom:36},
  topRow:{flexDirection:'row',justifyContent:'space-between',alignItems:'flex-start',marginBottom:18},eyebrow:{color:GOLD,fontWeight:'900',fontSize:13,letterSpacing:2.2,marginBottom:12},greeting:{color:'#A7A39A',fontSize:14},name:{color:'#FFF',fontSize:30,fontWeight:'900',marginTop:2},healthRow:{flexDirection:'row',alignItems:'center',marginTop:8},liveDot:{width:7,height:7,borderRadius:4,backgroundColor:'#3BCF7B',marginRight:7},healthText:{color:'#B8B5AE',fontSize:12},healthPercent:{color:'#3BCF7B',fontSize:12,marginLeft:4},markBox:{width:56,height:56,borderWidth:1,borderColor:'#3A3424',borderRadius:16,alignItems:'center',justifyContent:'center'},mark:{color:GOLD,fontSize:31,fontWeight:'900'},
  metricRow:{flexDirection:'row',gap:8,marginBottom:20},metricCard:{flex:1,backgroundColor:CARD,borderWidth:1,borderColor:BORDER,borderRadius:13,paddingVertical:13,paddingHorizontal:10},metricValue:{fontSize:24,fontWeight:'900'},metricLabel:{fontSize:9,color:'#A19C91',fontWeight:'800',marginTop:5},
  sectionRow:{flexDirection:'row',justifyContent:'space-between',alignItems:'center',marginTop:8,marginBottom:10},sectionTitle:{color:'#D7B768',fontWeight:'900',fontSize:11,letterSpacing:1.3},sectionAction:{color:'#8C877D',fontSize:11},priorityStack:{gap:8,marginBottom:18},priorityCard:{backgroundColor:CARD,borderWidth:1,borderColor:BORDER,borderRadius:14,padding:12,flexDirection:'row',alignItems:'center'},priorityIcon:{width:34,height:34,borderRadius:10,alignItems:'center',justifyContent:'center',marginRight:10},redBg:{backgroundColor:'rgba(255,98,89,0.10)'},amberBg:{backgroundColor:'rgba(240,185,74,0.10)'},greenBg:{backgroundColor:'rgba(66,199,122,0.10)'},grow:{flex:1},priorityTitle:{color:'#FFF',fontSize:13,fontWeight:'800'},prioritySub:{color:MUTED,fontSize:11,marginTop:3},priorityAction:{color:GOLD,fontSize:11,fontWeight:'800'},emptyGood:{color:'#C7C2B8',marginLeft:8,fontSize:12},
  scheduleCard:{backgroundColor:CARD,borderWidth:1,borderColor:BORDER,borderRadius:15,paddingHorizontal:12,marginBottom:18},scheduleLine:{flexDirection:'row',alignItems:'center',paddingVertical:12,borderBottomWidth:1,borderBottomColor:'#24221F'},scheduleTime:{color:'#DDD7CB',fontWeight:'800',width:52,fontSize:12},timelineDot:{width:7,height:7,borderRadius:4,backgroundColor:GOLD,marginRight:10},scheduleTitle:{color:'#FFF',fontSize:13,fontWeight:'800'},scheduleSub:{color:MUTED,fontSize:11,marginTop:2},chev:{color:'#77736B',fontSize:20},
  overviewGrid:{flexDirection:'row',flexWrap:'wrap',gap:8,marginBottom:18},overviewCard:{width:'31.8%',minHeight:90,backgroundColor:CARD,borderWidth:1,borderColor:BORDER,borderRadius:14,padding:12},overviewValue:{color:'#FFF',fontSize:22,fontWeight:'900',marginTop:8},overviewLabel:{color:MUTED,fontSize:10,marginTop:2},
  aiCard:{backgroundColor:'#19150B',borderWidth:1,borderColor:'#5D4716',borderRadius:16,padding:14,flexDirection:'row',alignItems:'center'},aiBadge:{width:38,height:38,borderRadius:19,backgroundColor:GOLD,alignItems:'center',justifyContent:'center',marginRight:12},aiTitle:{color:GOLD,fontSize:12,fontWeight:'900',letterSpacing:1.1},aiSub:{color:'#BDB7AB',fontSize:11,marginTop:3,lineHeight:16},aiArrow:{color:GOLD,fontSize:20,fontWeight:'900'}
});
