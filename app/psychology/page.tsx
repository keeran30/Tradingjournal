"use client"

import { useState, useEffect, useCallback, useMemo } from "react"
import Sidebar from "../components/Sidebar"
import AIAssistant from "../components/AIAssistant"
import { supabase } from "../lib/supabase"
import AppLoader from "../components/AppLoader"

// ═══════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════

interface Trade {
  id: string; asset: string; direction: string; entry: number; close_price: number
  size: number; pnl: number; emotion: string | null; created_at: string
}

interface EmotionStats {
  emotion: string; emoji: string; count: number; wins: number; losses: number
  winRate: number; totalPnL: number; avgPnL: number; riskRewardRatio: number
}

interface DailyMood {
  date: string; dayName: string; dominantEmotion: string; emotionEmoji: string
  tradeCount: number; dayPnL: number; winRate: number
}

interface BehavioralPattern {
  type: string; label: string; description: string; severity: "high" | "medium" | "low"
  occurrences: number; icon: string; recommendation: string
}

interface SessionAnalysis {
  session: string; trades: number; winRate: number; totalPnL: number; avgEmotionScore: number
}

interface WeeklyReport {
  weekStart: string; trades: number; winRate: number; pnl: number
  dominantEmotion: string; emotionalScore: number; improvement: string
}

interface PsychologyGoal {
  id: string; title: string; target: number; current: number; unit: string
  deadline: string; completed: boolean
}

// ═══════════════════════════════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════════════════════════════

const POSITIVE_EMOTIONS = ["Calm","Confident","Focused","Patient","Disciplined","Optimistic","Prepared","Mindful","Grateful","Motivated"]
const NEGATIVE_EMOTIONS = ["Anxious","Impatient","Fearful","Greedy","Stressed","Overconfident","Hesitant","Unsure","Tired","Panicked","Revengeful","Desperate","Euphoric","Frustrated","Angry"]

const EMOTION_EMOJI_MAP: Record<string, string> = {
  Calm:"😌",Confident:"😊",Focused:"🎯",Patient:"🧘",Disciplined:"💪",Optimistic:"🌟",Prepared:"📋",Mindful:"🧠",Grateful:"🙏",Motivated:"🔥",
  Anxious:"😰",Impatient:"😤",Fearful:"😨",Greedy:"🤑",Stressed:"😓",Overconfident:"😎",Hesitant:"🤔",Unsure:"🤷",Tired:"😴",Panicked:"😱",Revengeful:"😡",Desperate:"😩",Euphoric:"🤩",Frustrated:"😤",Angry:"🤬"
}

const TRADING_QUOTES = [
  { quote:"The market is a device for transferring money from the impatient to the patient.",author:"Warren Buffett" },
  { quote:"The key to trading success is emotional discipline.",author:"Victor Sperandeo" },
  { quote:"It is not whether you are right or wrong, but how much money you make when you are right.",author:"George Soros" },
  { quote:"Trading is 80% psychological and 20% methodological.",author:"Mark Douglas" },
  { quote:"Discipline is the bridge between goals and accomplishment.",author:"Jim Rohn" },
]

const PRE_TRADE_CHECKLIST = [
  { id:"mental",label:"Psychological Readiness",items:["I am in a calm and balanced emotional state","My trading environment is free from distractions","I am adequately rested and mentally alert","I have processed previous outcomes and am not carrying emotional baggage"] },
  { id:"technical",label:"Technical Preparation",items:["I have clearly identified entry and exit levels","Stop-loss orders are properly placed","Take-profit targets are established","I have reviewed the economic calendar for news events"] },
  { id:"risk",label:"Risk Management",items:["Position size is within my 1-2% risk parameters","I have not exceeded my daily loss limit","I have a contingency plan for adverse movement","This trade aligns with my documented strategy"] },
]

// ═══════════════════════════════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════════════════════════════

function getEmotionEmoji(emotion: string): string {
  for (const [key, emoji] of Object.entries(EMOTION_EMOJI_MAP)) { if (emotion.includes(key)) return emoji }
  return "🧠"
}
function getEmotionCategory(emotion: string): "positive"|"negative"|"neutral" {
  if (POSITIVE_EMOTIONS.some(e=>emotion.includes(e))) return "positive"
  if (NEGATIVE_EMOTIONS.some(e=>emotion.includes(e))) return "negative"
  return "neutral"
}
function getDayName(d: string): string { return ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"][new Date(d).getDay()] }
function getRandomQuote() { return TRADING_QUOTES[Math.floor(Math.random()*TRADING_QUOTES.length)] }
function getWeekStart(d: Date): string { const x=new Date(d);x.setDate(x.getDate()-x.getDay());return x.toISOString().split("T")[0] }
function formatDate(d: string): string { return new Date(d).toLocaleDateString("en-US",{year:"numeric",month:"long",day:"numeric"}) }

// ═══════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════

export default function PsychologyPage() {
  const [trades, setTrades] = useState<Trade[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<"overview"|"emotions"|"patterns"|"sessions"|"checklist"|"goals"|"report">("overview")
  const [timeFilter, setTimeFilter] = useState<"all"|"week"|"month"|"quarter">("all")
  const [notification, setNotification] = useState<{message:string;type:"success"|"error"}|null>(null)
  const [checklistItems, setChecklistItems] = useState<Record<string,boolean>>({})
  const [goals, setGoals] = useState<PsychologyGoal[]>([])
  const [showGoalForm, setShowGoalForm] = useState(false)
  const [newGoal, setNewGoal] = useState({title:"",target:0,unit:"%",deadline:""})
  const [moodNote, setMoodNote] = useState("")
  const [moodNotes, setMoodNotes] = useState<{date:string;note:string}[]>([])
  const [dailyQuote] = useState(getRandomQuote())

  const showNotification = (msg:string,type:"success"|"error") => { setNotification({message:msg,type});setTimeout(()=>setNotification(null),3000) }

  // Load saved data
  useEffect(() => {
    if (typeof window !== "undefined") {
      try {
        const sc = localStorage.getItem("psych_checklist"); if (sc) setChecklistItems(JSON.parse(sc))
        const sg = localStorage.getItem("psych_goals"); if (sg) setGoals(JSON.parse(sg))
        const sn = localStorage.getItem("psych_notes"); if (sn) setMoodNotes(JSON.parse(sn))
      } catch(e){}
    }
  }, [])

  // Fetch trades — FILTERED BY USER
  const fetchTrades = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { setTrades([]); setLoading(false); return }
      
      let query = supabase.from("trades").select("*").eq("user_id", user.id).order("created_at",{ascending:false})
      const now = new Date()
      if (timeFilter==="week") query = query.gte("created_at",new Date(now.getTime()-7*86400000).toISOString())
      else if (timeFilter==="month") query = query.gte("created_at",new Date(now.getTime()-30*86400000).toISOString())
      else if (timeFilter==="quarter") query = query.gte("created_at",new Date(now.getTime()-90*86400000).toISOString())
      
      const { data, error } = await query
      if (error) console.error("Fetch error:",error)
      else setTrades(data||[])
    } catch(e){ console.error(e) }
    finally { setLoading(false) }
  }, [timeFilter])

  useEffect(() => { fetchTrades() }, [fetchTrades])

  // Computed
  const tradesWithEmotions = useMemo(() => trades.filter(t=>t.emotion), [trades])
  const emotionCoverage = trades.length>0 ? Math.round((tradesWithEmotions.length/trades.length)*100) : 0

  const emotionStats = useMemo((): EmotionStats[] => {
    const map: Record<string,{count:number;wins:number;losses:number;totalPnL:number;totalRR:number}> = {}
    tradesWithEmotions.forEach(t=>{
      if(!map[t.emotion!]) map[t.emotion!] = {count:0,wins:0,losses:0,totalPnL:0,totalRR:0}
      map[t.emotion!].count++; if(t.pnl>0) map[t.emotion!].wins++; else map[t.emotion!].losses++
      map[t.emotion!].totalPnL += t.pnl||0
      const risk = Math.abs((t.entry-t.close_price)*t.size)
      if(risk>0) map[t.emotion!].totalRR += (t.pnl||0)/risk
    })
    return Object.entries(map).map(([emotion,d])=>({
      emotion,emoji:getEmotionEmoji(emotion),count:d.count,wins:d.wins,losses:d.losses,
      winRate:Math.round((d.wins/d.count)*100),totalPnL:d.totalPnL,avgPnL:d.totalPnL/d.count,
      riskRewardRatio:d.totalRR/d.count
    })).sort((a,b)=>b.count-a.count)
  }, [tradesWithEmotions])

  const emotionalScore = useMemo(() => {
    if (tradesWithEmotions.length===0) return 50
    let pos=0,neg=0
    tradesWithEmotions.forEach(t=>{
      if(getEmotionCategory(t.emotion!)==="positive") pos++
      else if(getEmotionCategory(t.emotion!)==="negative") neg++
    })
    return Math.round((pos/(pos+neg||1))*100)
  }, [tradesWithEmotions])

  const dailyMoods = useMemo((): DailyMood[] => {
    const map: Record<string,{emotions:string[];trades:Trade[]}> = {}
    tradesWithEmotions.forEach(t=>{
      const date=t.created_at?.split("T")[0]||""
      if(!map[date]) map[date]={emotions:[],trades:[]}
      map[date].emotions.push(t.emotion!); map[date].trades.push(t)
    })
    return Object.entries(map).map(([date,data])=>{
      const freq: Record<string,number> = {}
      data.emotions.forEach(e=>freq[e]=(freq[e]||0)+1)
      const dominant = Object.entries(freq).sort((a,b)=>b[1]-a[1])[0][0]
      const wins = data.trades.filter(t=>t.pnl>0).length
      return {date,dayName:getDayName(date),dominantEmotion:dominant,emotionEmoji:getEmotionEmoji(dominant),tradeCount:data.trades.length,dayPnL:data.trades.reduce((s,t)=>s+(t.pnl||0),0),winRate:Math.round((wins/data.trades.length)*100)}
    }).sort((a,b)=>b.date.localeCompare(a.date))
  }, [tradesWithEmotions])

  const behavioralPatterns = useMemo((): BehavioralPattern[] => {
    const patterns: BehavioralPattern[] = []
    if(trades.length===0) return patterns
    const byDay: Record<string,Trade[]> = {}
    trades.forEach(t=>{const d=t.created_at?.split("T")[0]||"";if(!byDay[d]) byDay[d]=[];byDay[d].push(t)})
    let revengeDays=0
    Object.values(byDay).forEach(dt=>{if(dt.length>=3){if(dt.some(t=>t.pnl<0)&&dt.some(t=>t.emotion&&getEmotionCategory(t.emotion)==="negative"))revengeDays++}})
    if(revengeDays>0) patterns.push({type:"revenge",label:"Revenge Trading",description:`Detected on ${revengeDays} day(s).`,severity:revengeDays>3?"high":"medium",occurrences:revengeDays,icon:"😡",recommendation:"Step away for 15 minutes after any loss."})
    return patterns
  }, [trades,tradesWithEmotions])

  const sessionAnalysis = useMemo((): SessionAnalysis[] => {
    const sessions: Record<string,Trade[]> = {"Morning (6AM-12PM)":[],"Afternoon (12PM-5PM)":[],"Evening (5PM-10PM)":[],"Late Night":[]}
    tradesWithEmotions.forEach(t=>{
      const h=new Date(t.created_at).getHours()
      if(h>=6&&h<12) sessions["Morning (6AM-12PM)"].push(t)
      else if(h>=12&&h<17) sessions["Afternoon (12PM-5PM)"].push(t)
      else if(h>=17&&h<22) sessions["Evening (5PM-10PM)"].push(t)
      else sessions["Late Night"].push(t)
    })
    return Object.entries(sessions).filter(([,t])=>t.length>0).map(([session,trades])=>{
      const wins=trades.filter(t=>t.pnl>0).length
      const posCount=trades.filter(t=>getEmotionCategory(t.emotion!)==="positive").length
      return {session,trades:trades.length,winRate:Math.round((wins/trades.length)*100),totalPnL:trades.reduce((s,t)=>s+(t.pnl||0),0),avgEmotionScore:Math.round((posCount/trades.length)*100)}
    })
  }, [tradesWithEmotions])

  const weeklyReports = useMemo((): WeeklyReport[] => {
    const weeks: Record<string,Trade[]> = {}
    trades.forEach(t=>{const ws=getWeekStart(new Date(t.created_at));if(!weeks[ws]) weeks[ws]=[];weeks[ws].push(t)})
    return Object.entries(weeks).map(([ws,wt])=>{
      const wins=wt.filter(t=>t.pnl>0).length
      const we=wt.filter(t=>t.emotion)
      const freq: Record<string,number>={}
      we.forEach(t=>freq[t.emotion!]=(freq[t.emotion!]||0)+1)
      const dom=Object.entries(freq).sort((a,b)=>b[1]-a[1])[0]?.[0]||"None"
      const pos=we.filter(t=>getEmotionCategory(t.emotion!)==="positive").length
      return {weekStart:ws,trades:wt.length,winRate:Math.round((wins/wt.length)*100),pnl:wt.reduce((s,t)=>s+(t.pnl||0),0),dominantEmotion:dom,emotionalScore:we.length>0?Math.round((pos/we.length)*100):50,improvement:""}
    }).sort((a,b)=>b.weekStart.localeCompare(a.weekStart)).slice(0,8)
  }, [trades])

  const reportsWithTrend = useMemo(() => weeklyReports.map((r,i)=>{
    if(i<weeklyReports.length-1){const imp=r.emotionalScore-weeklyReports[i+1].emotionalScore;r.improvement=imp>0?`↑${imp}%`:imp<0?`↓${Math.abs(imp)}%`:"No Change"}
    else r.improvement="Baseline"
    return r
  }), [weeklyReports])

  // Goals
  const addGoal = () => {
    if(!newGoal.title||!newGoal.target) return
    const g: PsychologyGoal = {id:Date.now().toString(),title:newGoal.title,target:newGoal.target,current:0,unit:newGoal.unit,deadline:newGoal.deadline,completed:false}
    const u=[...goals,g]; setGoals(u); localStorage.setItem("psych_goals",JSON.stringify(u))
    setShowGoalForm(false); setNewGoal({title:"",target:0,unit:"%",deadline:""}); showNotification("Goal added!","success")
  }
  const updateGoalProgress = (id:string,inc:number) => {
    const u=goals.map(g=>g.id===id?{...g,current:Math.min(g.current+inc,g.target),completed:g.current+inc>=g.target}:g)
    setGoals(u); localStorage.setItem("psych_goals",JSON.stringify(u))
  }
  const deleteGoal = (id:string) => { const u=goals.filter(g=>g.id!==id); setGoals(u); localStorage.setItem("psych_goals",JSON.stringify(u)) }

  // Checklist
  const toggleChecklistItem = (item:string) => { const u={...checklistItems,[item]:!checklistItems[item]}; setChecklistItems(u); localStorage.setItem("psych_checklist",JSON.stringify(u)) }
  const resetChecklist = () => { setChecklistItems({}); localStorage.removeItem("psych_checklist"); showNotification("Checklist reset","success") }
  const checklistProgress = Object.values(checklistItems).filter(Boolean).length
  const checklistTotal = PRE_TRADE_CHECKLIST.reduce((s,c)=>s+c.items.length,0)

  // Mood Notes
  const saveMoodNote = () => {
    if(!moodNote.trim()) return
    const n={date:new Date().toISOString().split("T")[0],note:moodNote.trim()}
    const u=[n,...moodNotes].slice(0,50); setMoodNotes(u); localStorage.setItem("psych_notes",JSON.stringify(u))
    setMoodNote(""); showNotification("Journal entry saved","success")
  }

  // ─── EXPORT ──────────────────────────────────────────
  const exportAsText = () => {
    const rd=new Date().toISOString().split("T")[0]
    const tl=timeFilter==="all"?"All Time":timeFilter==="week"?"Past 7 Days":timeFilter==="month"?"Past 30 Days":"Past 90 Days"
    let txt="═══════════════════════════════════════════\n     TRADEVAULT PSYCHOLOGY REPORT\n═══════════════════════════════════════════\n\n"
    txt+=`Generated: ${rd}\nPeriod: ${tl}\nTotal Trades: ${trades.length}\nEmotional Score: ${emotionalScore}/100\n\nEMOTIONAL BREAKDOWN:\n`
    emotionStats.forEach((e,i)=>{txt+=`${i+1}. ${e.emotion} (${e.count} trades, ${e.winRate}% win, $${e.totalPnL.toFixed(2)})\n`})
    txt+="\n═══════════════════════════════════════════\n       Generated by TradeVault.pro\n═══════════════════════════════════════════\n"
    const blob=new Blob([txt],{type:"text/plain;charset=utf-8"});const url=URL.createObjectURL(blob);const a=document.createElement("a");a.href=url;a.download=`TradeVault_Psychology_${rd}.txt`;a.click();URL.revokeObjectURL(url)
    showNotification("Report downloaded as TXT","success")
  }

  const exportAsHTML = () => {
    const rd=new Date().toISOString().split("T")[0]
    const tl=timeFilter==="all"?"All Time":timeFilter==="week"?"Past 7 Days":timeFilter==="month"?"Past 30 Days":"Past 90 Days"
    const sc=emotionalScore>=70?"#22c55e":emotionalScore>=40?"#eab308":"#ef4444"
    let er=""
    emotionStats.forEach((e,i)=>{
      const wc=e.winRate>=50?"#22c55e":"#ef4444";const pc=e.totalPnL>=0?"#22c55e":"#ef4444"
      er+=`<tr style="border-bottom:1px solid #333"><td style="padding:10px">${i+1}</td><td style="padding:10px"><span style="font-size:18px">${e.emoji}</span> ${e.emotion}</td><td style="padding:10px;text-align:center">${e.count}</td><td style="padding:10px;text-align:center;color:${wc};font-weight:bold">${e.winRate}%</td><td style="padding:10px;text-align:center;color:${pc};font-weight:bold">$${e.totalPnL.toFixed(2)}</td><td style="padding:10px;text-align:center">$${e.avgPnL.toFixed(2)}</td></tr>`
    })
    const html=`<!DOCTYPE html><html><head><meta charset="utf-8"><title>TradeVault Psychology Report</title><style>body{font-family:'Segoe UI',Arial,sans-serif;background:#111;color:#eee;padding:50px;max-width:900px;margin:0 auto}h1{color:#eab308;text-align:center;font-size:28px;margin-bottom:5px}.subtitle{text-align:center;color:#888;margin-bottom:30px;font-size:13px}.summary{display:flex;justify-content:center;gap:25px;margin-bottom:35px;flex-wrap:wrap}.stat{text-align:center;background:#1a1a1a;padding:18px 24px;border-radius:12px;border:1px solid #333;min-width:100px}.stat .value{font-size:26px;font-weight:bold;color:#eab308}.stat .label{font-size:11px;color:#888;margin-top:4px;text-transform:uppercase}.score-circle{width:100px;height:100px;border-radius:50%;background:#1a1a1a;border:3px solid ${sc};display:flex;align-items:center;justify-content:center;margin:0 auto 10px}.score-circle span{font-size:28px;font-weight:bold;color:${sc}}h2{color:#eab308;margin-top:35px;font-size:18px;border-bottom:2px solid #eab308;padding-bottom:8px}table{width:100%;border-collapse:collapse;margin-top:15px}th{background:#1a1a1a;padding:12px;text-align:left;font-size:11px;color:#888;text-transform:uppercase;border-bottom:2px solid #eab308}td{font-size:13px}.insight-box{background:#1a1a1a;padding:15px;border-radius:10px;border-left:3px solid #eab308;margin:15px 0}.footer{text-align:center;margin-top:50px;color:#555;font-size:11px;border-top:1px solid #333;padding-top:20px}</style></head><body><h1>TRADEVAULT</h1><p class="subtitle">Trading Psychology Report · ${rd} · ${tl}</p><div class="summary"><div class="stat"><div class="score-circle"><span>${emotionalScore}</span></div><div class="label">Emotional Score</div></div><div class="stat"><div class="value">${trades.length}</div><div class="label">Total Trades</div></div><div class="stat"><div class="value">${tradesWithEmotions.length}</div><div class="label">With Emotions</div></div><div class="stat"><div class="value">${emotionCoverage}%</div><div class="label">Coverage</div></div></div><h2>EMOTIONAL STATE BREAKDOWN</h2><table><thead><tr><th>#</th><th>Emotion</th><th>Trades</th><th>Win Rate</th><th>Total P&L</th><th>Avg P&L</th></tr></thead><tbody>${er}</tbody></table><div class="insight-box"><p style="color:#eab308;font-weight:bold;margin-bottom:5px">Key Insight</p><p style="color:#ccc;font-size:14px">Your emotional score is ${emotionalScore}/100. ${emotionalScore>=70?'You maintain strong emotional control during trading.':emotionalScore>=40?'There is room to improve your emotional discipline.':'Emotional control needs significant attention.'}</p></div><p class="footer">Generated by TradeVault.pro</p></body></html>`
    const blob=new Blob([html],{type:"text/html;charset=utf-8"});const url=URL.createObjectURL(blob);const a=document.createElement("a");a.href=url;a.download=`TradeVault_Psychology_Report_${rd}.html`;a.click();URL.revokeObjectURL(url)
    showNotification("Professional report downloaded! Open with any browser.","success")
  }

  const exportReport = () => {
    const saved = typeof window !== "undefined" ? localStorage.getItem("user_settings") : null
    const premium = saved ? JSON.parse(saved).isPremium : false
    if (premium) {
      if (window.confirm("Click OK for Professional HTML Report, or Cancel for plain TXT")) exportAsHTML()
      else exportAsText()
    } else {
      exportAsText()
    }
  }

  // ─── LOADING ─────────────────────────────────────────
  if (loading) return <AppLoader message="Analyzing Trading Psychology" />

  // ─── RENDER ──────────────────────────────────────────
  return (
    <main className="min-h-screen bg-zinc-950 text-white flex flex-col md:flex-row">
      <Sidebar />
      <section className="flex-1 p-4 md:p-8 overflow-y-auto">
        {notification && <div className={`fixed top-4 right-4 z-50 px-6 py-3 rounded-xl font-bold shadow-lg ${notification.type==="success"?"bg-green-600":"bg-red-600"}`}>{notification.message}</div>}

        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold mb-2">Trading Psychology</h1>
            <p className="text-zinc-400">Behavioral Analytics & Emotional Intelligence</p>
          </div>
          <button onClick={exportReport} className="bg-zinc-800 hover:bg-zinc-700 text-white px-5 py-2.5 rounded-xl text-sm font-semibold flex items-center gap-2">
            📥 Export Report
          </button>
        </div>

        <div className="bg-gradient-to-r from-purple-950/40 via-blue-950/40 to-purple-950/40 border border-purple-500/20 rounded-2xl p-5 mb-6">
          <p className="text-purple-300 italic">&ldquo;{dailyQuote.quote}&rdquo;</p>
          <p className="text-purple-400/60 text-sm mt-2">— {dailyQuote.author}</p>
        </div>

        {/* Time Filter */}
        <div className="mb-6">
          <p className="text-xs text-zinc-500 uppercase tracking-widest mb-3 font-semibold">Reporting Period</p>
          <div className="flex gap-3 flex-wrap">
            {[{key:"all",label:"All Time",icon:"📅"},{key:"week",label:"This Week",icon:"📆"},{key:"month",label:"This Month",icon:"📊"},{key:"quarter",label:"This Quarter",icon:"📈"}].map(f=>(
              <button key={f.key} onClick={()=>setTimeFilter(f.key as any)} className={`px-5 py-3 rounded-xl font-semibold text-sm flex items-center gap-2 transition ${timeFilter===f.key?"bg-yellow-500 text-black shadow-lg shadow-yellow-500/20 scale-105":"bg-zinc-900 text-zinc-400 hover:bg-zinc-800 border border-zinc-800"}`}><span>{f.icon}</span>{f.label}</button>
            ))}
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 md:gap-2 mb-8 border-b border-zinc-800 overflow-x-auto pb-1">
          {[{key:"overview",label:"Overview",icon:"📊"},{key:"emotions",label:"Emotions",icon:"🎭"},{key:"patterns",label:"Patterns",icon:"🔍"},{key:"sessions",label:"Sessions",icon:"⏰"},{key:"checklist",label:"Checklist",icon:"✅"},{key:"goals",label:"Goals",icon:"🎯"},{key:"report",label:"Report",icon:"📋"}].map(t=>(
            <button key={t.key} onClick={()=>setActiveTab(t.key as any)} className={`pb-3 px-3 md:px-4 font-semibold text-sm whitespace-nowrap flex items-center gap-1.5 ${activeTab===t.key?"text-yellow-500 border-b-2 border-yellow-500":"text-zinc-500 hover:text-zinc-300"}`}><span className="hidden sm:inline">{t.icon}</span>{t.label}</button>
          ))}
        </div>

        {/* ─── OVERVIEW ─────────────────────────── */}
        {activeTab==="overview"&&(
          <div className="space-y-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {[{label:"Emotional Score",value:`${emotionalScore}/100`,color:emotionalScore>=70?"text-emerald-400":emotionalScore>=40?"text-amber-400":"text-red-400"},{label:"Emotions Tracked",value:tradesWithEmotions.length.toString(),color:"text-white"},{label:"Patterns Found",value:behavioralPatterns.length.toString(),color:behavioralPatterns.length>0?"text-amber-400":"text-emerald-400"},{label:"Best Mindset",value:emotionStats[0]?.emotion||"N/A",color:"text-emerald-400"}].map((c,i)=>(
                <div key={i} className="bg-zinc-900 p-4 rounded-2xl border border-zinc-800 text-center"><p className={`text-2xl font-bold ${c.color}`}>{c.value}</p><p className="text-zinc-400 text-xs mt-1">{c.label}</p></div>
              ))}
            </div>
            <div className="bg-zinc-900 p-5 rounded-2xl border border-zinc-800">
              <h3 className="font-semibold mb-4 text-sm">Emotional Balance Index</h3>
              <div className="w-full bg-zinc-800 rounded-full h-6 overflow-hidden relative">
                <div className={`h-full rounded-full transition-all duration-700 ${emotionalScore>=70?"bg-gradient-to-r from-emerald-600 to-emerald-400":emotionalScore>=40?"bg-gradient-to-r from-amber-600 to-amber-400":"bg-gradient-to-r from-red-600 to-red-400"}`} style={{width:`${emotionalScore}%`}}/>
                <span className="absolute inset-0 flex items-center justify-center text-xs font-bold text-white drop-shadow-md">{emotionalScore}/100</span>
              </div>
            </div>
            {dailyMoods.length>0&&(
              <div className="bg-zinc-900 p-5 rounded-2xl border border-zinc-800">
                <h3 className="font-semibold mb-4 text-sm">Recent Trading Days</h3>
                <div className="space-y-2">
                  {dailyMoods.slice(0,5).map(d=>(
                    <div key={d.date} className="flex items-center justify-between p-3 bg-zinc-800/40 rounded-xl flex-wrap gap-2">
                      <div className="flex items-center gap-3"><span className="text-zinc-500 text-xs">{d.date} ({d.dayName.slice(0,3)})</span><span className="text-xl">{d.emotionEmoji}</span><span className="text-xs text-zinc-300">{d.dominantEmotion}</span></div>
                      <div className="flex items-center gap-4"><span className="text-xs text-zinc-500">{d.tradeCount} trades</span><span className={`text-xs font-semibold ${d.winRate>=50?"text-emerald-400":"text-red-400"}`}>{d.winRate}%</span><span className={`text-sm font-bold ${d.dayPnL>=0?"text-emerald-400":"text-red-400"}`}>{d.dayPnL>=0?"+":""}${d.dayPnL.toFixed(2)}</span></div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            <div className="bg-zinc-900 p-5 rounded-2xl border border-zinc-800">
              <h3 className="font-semibold mb-3 text-sm">Mood Journal</h3>
              <div className="flex gap-2"><input type="text" value={moodNote} onChange={e=>setMoodNote(e.target.value)} placeholder="How are you feeling about your trading?" className="flex-1 p-3 bg-zinc-800 rounded-xl border border-zinc-700 focus:border-yellow-500 outline-none text-sm" onKeyDown={e=>e.key==="Enter"&&saveMoodNote()}/><button onClick={saveMoodNote} className="bg-yellow-500 hover:bg-yellow-400 text-black px-5 py-3 rounded-xl font-semibold text-sm">Save</button></div>
            </div>
          </div>
        )}

        {/* ─── EMOTIONS ────────────────────────── */}
        {activeTab==="emotions"&&(
          <div className="space-y-6">
            {emotionStats.length===0?<div className="text-center py-20 bg-zinc-900 rounded-2xl"><p className="text-6xl mb-6">🎭</p><p className="text-zinc-300 text-lg font-semibold mb-2">No Emotional Data</p><a href="/trades" className="bg-yellow-500 text-black px-6 py-3 rounded-xl font-semibold text-sm inline-block">Start Journaling →</a></div>:(
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {(()=>{const best=emotionStats.filter(e=>e.count>=2).sort((a,b)=>b.winRate-a.winRate)[0];const worst=emotionStats.filter(e=>e.count>=2).sort((a,b)=>a.winRate-b.winRate)[0];return(<>{best&&<div className="bg-emerald-950/20 border border-emerald-500/20 p-5 rounded-2xl"><p className="text-emerald-400 font-semibold text-xs uppercase mb-3">Optimal State</p><p className="text-4xl mb-2">{best.emoji}</p><p className="text-xl font-bold text-white">{best.emotion}</p><p className="text-emerald-400 text-2xl font-bold">{best.winRate}% Win</p></div>}{worst&&<div className="bg-red-950/20 border border-red-500/20 p-5 rounded-2xl"><p className="text-red-400 font-semibold text-xs uppercase mb-3">Challenging State</p><p className="text-4xl mb-2">{worst.emoji}</p><p className="text-xl font-bold text-white">{worst.emotion}</p><p className="text-red-400 text-2xl font-bold">{worst.winRate}% Win</p></div>}</>)})()}
                </div>
                <div className="bg-zinc-900 rounded-2xl border border-zinc-800 overflow-x-auto">
                  <div className="min-w-[700px]">
                    <div className="grid grid-cols-7 gap-3 p-4 border-b border-zinc-800 text-zinc-500 text-xs font-semibold uppercase"><div>Emotion</div><div className="text-center">Trades</div><div className="text-center">Win Rate</div><div className="text-center">Total P&L</div><div className="text-center">Avg P&L</div><div className="text-center">Risk/Reward</div><div className="text-center">Verdict</div></div>
                    {emotionStats.map(e=>(
                      <div key={e.emotion} className="grid grid-cols-7 gap-3 p-3.5 border-b border-zinc-800/50 hover:bg-zinc-800/30 text-sm">
                        <div className="flex items-center gap-2"><span className="text-lg">{e.emoji}</span><span className="font-medium truncate">{e.emotion}</span></div>
                        <div className="text-center">{e.count}</div><div className={`text-center font-bold ${e.winRate>=50?"text-emerald-400":"text-red-400"}`}>{e.winRate}%</div>
                        <div className={`text-center font-bold ${e.totalPnL>=0?"text-emerald-400":"text-red-400"}`}>${e.totalPnL.toFixed(2)}</div>
                        <div className="text-center">${e.avgPnL.toFixed(2)}</div><div className="text-center">{e.riskRewardRatio.toFixed(2)}</div>
                        <div className="text-center"><span className={`px-2 py-0.5 rounded text-xs font-bold ${e.winRate>=60?"bg-emerald-900/50 text-emerald-400":e.winRate>=40?"bg-amber-900/50 text-amber-400":"bg-red-900/50 text-red-400"}`}>{e.winRate>=60?"Strong":e.winRate>=40?"Neutral":"Weak"}</span></div>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>
        )}

        {/* ─── PATTERNS ────────────────────────── */}
        {activeTab==="patterns"&&(
          <div className="space-y-4">
            {behavioralPatterns.length===0?<div className="text-center py-20 bg-zinc-900 rounded-2xl"><p className="text-6xl mb-6">🎉</p><p className="text-emerald-400 text-lg font-bold">No Negative Patterns</p></div>:behavioralPatterns.map((p,i)=>(
              <div key={i} className={`p-5 rounded-2xl border ${p.severity==="high"?"bg-red-950/20 border-red-500/20":p.severity==="medium"?"bg-amber-950/20 border-amber-500/20":"bg-blue-950/20 border-blue-500/20"}`}>
                <div className="flex items-start gap-4"><span className="text-3xl">{p.icon}</span><div><h3 className={`font-bold text-base ${p.severity==="high"?"text-red-400":"text-amber-400"}`}>{p.label}</h3><p className="text-zinc-300 text-sm mt-1">{p.description}</p><div className="bg-zinc-800/50 p-3 rounded-xl mt-3"><p className="text-emerald-400 text-xs font-bold uppercase">Fix</p><p className="text-zinc-300 text-sm">{p.recommendation}</p></div></div></div>
              </div>
            ))}
          </div>
        )}

        {/* ─── SESSIONS ────────────────────────── */}
        {activeTab==="sessions"&&(
          <div className="space-y-6">
            {sessionAnalysis.length===0?<div className="text-center py-20 bg-zinc-900 rounded-2xl"><p className="text-6xl mb-6">⏰</p><p className="text-zinc-300 text-lg font-semibold">Insufficient Data</p></div>:(
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {sessionAnalysis.map(s=>{const isBest=s.totalPnL===Math.max(...sessionAnalysis.map(x=>x.totalPnL))&&s.totalPnL>0;return(
                  <div key={s.session} className={`p-5 rounded-2xl border ${isBest?"bg-emerald-950/20 border-emerald-500/30":"bg-zinc-900 border-zinc-800"}`}>
                    <div className="flex justify-between mb-4"><h3 className="font-semibold text-sm">{s.session}</h3>{isBest&&<span className="text-xs bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded-full font-bold">Best</span>}</div>
                    <div className="grid grid-cols-2 gap-4"><div><p className="text-zinc-500 text-xs">Trades</p><p className="text-xl font-bold">{s.trades}</p></div><div><p className="text-zinc-500 text-xs">Win Rate</p><p className={`text-xl font-bold ${s.winRate>=50?"text-emerald-400":"text-red-400"}`}>{s.winRate}%</p></div><div><p className="text-zinc-500 text-xs">P&L</p><p className={`text-xl font-bold ${s.totalPnL>=0?"text-emerald-400":"text-red-400"}`}>${s.totalPnL.toFixed(2)}</p></div><div><p className="text-zinc-500 text-xs">Emotion Score</p><p className="text-xl font-bold">{s.avgEmotionScore}/100</p></div></div>
                  </div>
                )})}
              </div>
            )}
          </div>
        )}

        {/* ─── CHECKLIST ───────────────────────── */}
        {activeTab==="checklist"&&(
          <div className="space-y-6">
            <div className="bg-zinc-900 p-5 rounded-2xl border border-zinc-800 text-center">
              <p className="text-5xl mb-3">✅</p><p className="text-zinc-400 text-sm">Pre-Trade Readiness</p>
              <p className="text-3xl font-bold text-yellow-400">{checklistProgress}/{checklistTotal}</p>
              <div className="w-full bg-zinc-800 rounded-full h-3 mt-4 overflow-hidden"><div className="h-full bg-gradient-to-r from-yellow-500 to-emerald-500 rounded-full transition-all" style={{width:`${(checklistProgress/checklistTotal)*100}%`}}/></div>
              <button onClick={resetChecklist} className="text-xs text-zinc-500 hover:text-zinc-300 mt-3 underline">Reset</button>
            </div>
            {PRE_TRADE_CHECKLIST.map(c=>(
              <div key={c.id} className="bg-zinc-900 p-5 rounded-2xl border border-zinc-800">
                <h3 className="font-semibold mb-4 text-sm">{c.label}</h3>
                <div className="space-y-2">{c.items.map(item=>(
                  <label key={item} className={`flex items-center gap-3 p-3.5 rounded-xl cursor-pointer transition ${checklistItems[item]?"bg-emerald-950/20 border border-emerald-500/30":"bg-zinc-800/50 border border-transparent hover:bg-zinc-800"}`}>
                    <input type="checkbox" checked={!!checklistItems[item]} onChange={()=>toggleChecklistItem(item)} className="w-5 h-5 rounded accent-yellow-500"/>
                    <span className={`text-sm ${checklistItems[item]?"text-emerald-400 line-through":"text-zinc-300"}`}>{item}</span>
                  </label>
                ))}</div>
              </div>
            ))}
          </div>
        )}

        {/* ─── GOALS ───────────────────────────── */}
        {activeTab==="goals"&&(
          <div className="space-y-6">
            <div className="flex justify-between"><h2 className="font-bold text-lg">Psychology Goals</h2><button onClick={()=>setShowGoalForm(!showGoalForm)} className={`px-4 py-2.5 rounded-xl text-sm font-semibold ${showGoalForm?"bg-zinc-800 text-zinc-300":"bg-yellow-500 text-black"}`}>{showGoalForm?"Cancel":"+ Create Goal"}</button></div>
            {showGoalForm&&(
              <div className="bg-zinc-900 p-5 rounded-2xl border border-zinc-800 space-y-3">
                <input type="text" placeholder="Goal title" value={newGoal.title} onChange={e=>setNewGoal({...newGoal,title:e.target.value})} className="w-full p-3 bg-zinc-800 rounded-xl border border-zinc-700 text-sm"/>
                <div className="flex gap-3"><input type="number" placeholder="Target" value={newGoal.target||""} onChange={e=>setNewGoal({...newGoal,target:parseInt(e.target.value)||0})} className="flex-1 p-3 bg-zinc-800 rounded-xl border border-zinc-700 text-sm"/><select value={newGoal.unit} onChange={e=>setNewGoal({...newGoal,unit:e.target.value})} className="p-3 bg-zinc-800 rounded-xl border border-zinc-700 text-sm"><option value="%">%</option><option value="days">Days</option><option value="trades">Trades</option></select></div>
                <input type="date" value={newGoal.deadline} onChange={e=>setNewGoal({...newGoal,deadline:e.target.value})} className="w-full p-3 bg-zinc-800 rounded-xl border border-zinc-700 text-sm"/>
                <button onClick={addGoal} className="w-full bg-emerald-600 hover:bg-emerald-700 py-2.5 rounded-xl font-semibold text-sm">Create Goal</button>
              </div>
            )}
            {goals.length===0&&!showGoalForm?<div className="text-center py-16 bg-zinc-900 rounded-2xl"><p className="text-5xl mb-4">🎯</p><p className="text-zinc-300 font-semibold">No Goals Set</p></div>:(
              <div className="space-y-3">{goals.map(g=>(
                <div key={g.id} className={`p-5 rounded-2xl border ${g.completed?"bg-emerald-950/20 border-emerald-500/30":"bg-zinc-900 border-zinc-800"}`}>
                  <div className="flex justify-between mb-3"><div><h3 className={`font-bold ${g.completed?"text-emerald-400 line-through":"text-white"}`}>{g.title}</h3><p className="text-xs text-zinc-500">Target: {g.target}{g.unit}</p></div><button onClick={()=>deleteGoal(g.id)} className="text-zinc-600 hover:text-red-400">🗑️</button></div>
                  <div className="w-full bg-zinc-800 rounded-full h-3 overflow-hidden mb-2"><div className={`h-full rounded-full transition-all ${g.completed?"bg-emerald-500":"bg-yellow-500"}`} style={{width:`${Math.min((g.current/g.target)*100,100)}%`}}/></div>
                  <div className="flex justify-between"><span className="text-xs text-zinc-500">{g.current}/{g.target}{g.unit}</span>{!g.completed&&<div className="flex gap-1.5"><button onClick={()=>updateGoalProgress(g.id,1)} className="text-xs bg-zinc-800 hover:bg-zinc-700 px-2.5 py-1 rounded-lg">+1</button><button onClick={()=>updateGoalProgress(g.id,5)} className="text-xs bg-zinc-800 hover:bg-zinc-700 px-2.5 py-1 rounded-lg">+5</button></div>}</div>
                </div>
              ))}</div>
            )}
          </div>
        )}

        {/* ─── REPORT ───────────────────────────── */}
        {activeTab==="report"&&(
          <div className="space-y-6">
            <div className="bg-zinc-900 p-5 rounded-2xl border border-zinc-800">
              <h3 className="font-semibold mb-4 text-sm">Weekly Summary</h3>
              {reportsWithTrend.length===0?<p className="text-zinc-500 text-sm text-center py-8">No data yet.</p>:(
                <div className="overflow-x-auto"><div className="min-w-[650px]">
                  <div className="grid grid-cols-7 gap-3 p-3 border-b border-zinc-800 text-zinc-500 text-xs font-semibold uppercase"><div>Week</div><div className="text-center">Trades</div><div className="text-center">Win Rate</div><div className="text-center">P&L</div><div className="text-center">Emotion</div><div className="text-center">Score</div><div className="text-center">Trend</div></div>
                  {reportsWithTrend.map((r,i)=>(
                    <div key={i} className="grid grid-cols-7 gap-3 p-3 border-b border-zinc-800/50 text-sm hover:bg-zinc-800/30">
                      <div className="text-zinc-400">{r.weekStart}</div><div className="text-center">{r.trades}</div><div className={`text-center font-semibold ${r.winRate>=50?"text-emerald-400":"text-red-400"}`}>{r.winRate}%</div>
                      <div className={`text-center font-bold ${r.pnl>=0?"text-emerald-400":"text-red-400"}`}>${r.pnl.toFixed(2)}</div><div className="text-center">{r.dominantEmotion}</div>
                      <div className="text-center">{r.emotionalScore}/100</div><div className={`text-center font-bold ${r.improvement.includes("↑")?"text-emerald-400":r.improvement.includes("↓")?"text-red-400":"text-zinc-500"}`}>{r.improvement}</div>
                    </div>
                  ))}
                </div></div>
              )}
            </div>
            <div className="text-center pb-8">
              <button onClick={exportReport} className="bg-yellow-500 hover:bg-yellow-400 text-black px-8 py-3.5 rounded-xl font-bold text-sm inline-flex items-center gap-2 shadow-lg shadow-yellow-500/20">
                📥 Download Full Report
              </button>
            </div>
          </div>
        )}

        {trades.length===0&&(
          <div className="text-center py-20 bg-zinc-900 rounded-2xl border border-zinc-800 mt-6">
            <p className="text-6xl mb-6">🧠</p><p className="text-zinc-300 text-lg font-semibold mb-2">Begin Your Psychology Journey</p>
            <a href="/trades" className="bg-yellow-500 text-black px-8 py-3.5 rounded-xl font-bold text-sm inline-block">Start Journaling →</a>
          </div>
        )}
      </section>
      <AIAssistant />
    </main>
  )
}