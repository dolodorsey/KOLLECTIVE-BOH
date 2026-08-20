import React from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Building2, Users, Zap, User, Database, Bot, Megaphone, FileText, Settings, ChevronRight } from 'lucide-react-native';

const GOLD='#E0A700', BG='#0A0A0A', CARD='#141414', BORDER='#28251F';

export default function MoreScreen(){
  const router=useRouter();
  const items=[
    {title:'Companies',sub:'Enterprise directory + operating status',icon:Building2,route:'/(owner)/entities'},
    {title:'People',sub:'Roster, roles and ownership',icon:Users,route:'/(owner)/people'},
    {title:'Workflows',sub:'Automations and recurring operations',icon:Zap,route:'/(owner)/workflows'},
    {title:'AI + Agents',sub:'Agent operations and capability layer',icon:Bot,route:'/(owner)/workflows'},
    {title:'Data + Systems',sub:'Infrastructure and backend health',icon:Database,route:'/(owner)/dashboard'},
    {title:'Marketing',sub:'Campaign and channel execution',icon:Megaphone,route:'/(owner)/operations'},
    {title:'Files',sub:'Enterprise documents and handoffs',icon:FileText,route:'/(owner)/operations'},
    {title:'Profile + Access',sub:'Your account, permissions and settings',icon:User,route:'/(owner)/profile'},
    {title:'Settings',sub:'BOH preferences and configuration',icon:Settings,route:'/(owner)/profile'},
  ];
  return <View style={styles.screen}><SafeAreaView style={{flex:1}} edges={['top']}><ScrollView contentContainerStyle={styles.content}>
    <Text style={styles.eyebrow}>KOLLECTIVE BOH</Text><Text style={styles.title}>More</Text><Text style={styles.subtitle}>Everything that does not need permanent bottom-nav space.</Text>
    <View style={styles.grid}>{items.map(({title,sub,icon:Icon,route})=><TouchableOpacity key={title} style={styles.card} onPress={()=>router.push(route as any)}><View style={styles.iconBox}><Icon color={GOLD} size={21}/></View><View style={{flex:1}}><Text style={styles.cardTitle}>{title}</Text><Text style={styles.cardSub}>{sub}</Text></View><ChevronRight color="#665F55" size={19}/></TouchableOpacity>)}</View>
  </ScrollView></SafeAreaView></View>
}

const styles=StyleSheet.create({screen:{flex:1,backgroundColor:BG},content:{padding:18,paddingBottom:110},eyebrow:{color:GOLD,fontWeight:'800',letterSpacing:2,fontSize:12},title:{color:'#fff',fontSize:40,fontWeight:'900',marginTop:3},subtitle:{color:'#999287',fontSize:15,lineHeight:22,marginTop:5,maxWidth:330},grid:{marginTop:22,gap:10},card:{backgroundColor:CARD,borderWidth:1,borderColor:BORDER,borderRadius:17,padding:14,flexDirection:'row',alignItems:'center',gap:12},iconBox:{width:42,height:42,borderRadius:13,backgroundColor:'#1E1C18',alignItems:'center',justifyContent:'center'},cardTitle:{color:'#fff',fontWeight:'900',fontSize:16},cardSub:{color:'#8D877D',fontSize:12,marginTop:3,lineHeight:17}})
