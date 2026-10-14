/* eslint-disable @typescript-eslint/no-explicit-any */
"use client"

import { ProviderSetup } from "./provider-setup"
import { chat, loadConfig, type Config } from "@/lib/byok"
import { BlocksAi02 } from "@/components/blocks-so/ai/ai-02"
import { ThinkingState } from "@/components/beautiful-ui/thinking-state"
import { Orb } from "@/components/voice-agents/elevenlabs/orb"
import type { ReceivedMessage } from "@livekit/components-react"
import { Mic, MicOff, PhoneOff, Volume2, VolumeX } from "lucide-react"
import { useEffect, useRef, useState } from "react"

type VoiceState = "idle" | "listening" | "thinking" | "speaking"
const seed = [{ id: "welcome", timestamp: 1, from: { isLocal: false }, message: "Hi — what would you like to practise today?" }] as ReceivedMessage[]

export default function Home() {
  const [messages, setMessages] = useState<ReceivedMessage[]>(seed)
  const [thinking, setThinking] = useState(false)
  const [voice, setVoiceState] = useState<VoiceState>("idle")
  const voiceRef = useRef<VoiceState>("idle")
  const setVoice = (state: VoiceState) => { voiceRef.current = state; setVoiceState(state) }
  const [micOn, setMicOn] = useState(true)
  const [speakerOn, setSpeakerOn] = useState(true)
  const [files, setFiles] = useState<string[]>([])
  const [error, setError] = useState("")
  const recognition = useRef<any>(null)
  const [config, setConfig] = useState<Config | null>(null)
  const configRef = useRef<Config | null>(null)
  const [setup, setSetup] = useState(false)
  const pendingText = useRef<string | null>(null)
  const [pending, setPending] = useState(false)
  const pendingRef = useRef(false)
  const abortRef = useRef<AbortController | null>(null)
  const messagesRef = useRef(messages)
  useEffect(() => { messagesRef.current = messages }, [messages])
  useEffect(() => { const saved = loadConfig(); configRef.current = saved; setConfig(saved) }, [])
  const scroller = useRef<HTMLDivElement>(null)
  const pinned = useRef(true)
  useEffect(() => { if (pinned.current) scroller.current?.scrollTo({ top: scroller.current.scrollHeight, behavior: "smooth" }) }, [messages, thinking, voice])
  useEffect(() => () => { recognition.current?.abort?.(); abortRef.current?.abort(); if ("speechSynthesis" in window) window.speechSynthesis.cancel() }, [])

  const add = (text: string, local: boolean) => setMessages(m => [...m, { id: `${Date.now()}-${Math.random()}`, timestamp: Date.now(), from: { isLocal: local }, message: text } as ReceivedMessage])
  const send = async (text: string, configured: Config) => {
    if (pendingRef.current) return
    pendingRef.current = true; setPending(true); setError(""); setSetup(false)
    pinned.current = true
    const turns = messagesRef.current.filter(m => m.id !== "welcome").map(m => ({ role: m.from?.isLocal ? "user" as const : "assistant" as const, content: String(m.message) }))
    turns.push({ role: "user", content: text })
    add(text, true); setThinking(true)
    if (voiceRef.current !== "idle") setVoice("thinking")
    const controller = new AbortController(); abortRef.current = controller
    try {
      const reply = await chat(configured, turns, controller.signal)
      add(reply, false)
      if (voiceRef.current !== "idle") {
        setVoice("speaking")
        if (speakerOn && "speechSynthesis" in window) {
          const utterance = new SpeechSynthesisUtterance(reply)
          utterance.onend = utterance.onerror = () => { if (voiceRef.current !== "idle") setVoice("listening") }
          window.speechSynthesis.speak(utterance)
        } else setVoice("listening")
      }
    } catch (e) { setError(e instanceof Error ? e.message : "Chat request failed."); if (voiceRef.current !== "idle") setVoice("listening") }
    finally { setThinking(false); setPending(false); pendingRef.current = false; abortRef.current = null }
  }
  const answer = (text: string) => {
    if (!text.trim() || pendingRef.current) return
    const saved = configRef.current || loadConfig()
    if (!saved) { pendingText.current = text.trim(); setPending(true); setSetup(true); setError(""); return }
    configRef.current = saved; setConfig(saved)
    void send(text.trim(), saved)
  }
  const stopVoice = () => { recognition.current?.abort?.(); recognition.current = null; window.speechSynthesis?.cancel(); setVoice("idle"); abortRef.current?.abort(); setThinking(false) }
  const startVoice = () => {
    if (voice !== "idle") { stopVoice(); return }
    setError(""); setVoice("listening"); setMicOn(true)
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    if (!SpeechRecognition) { setError("Live speech transcription is unavailable in this browser. You can still type below."); return }
    try {
      const r = new SpeechRecognition(); r.continuous = true; r.interimResults = false; r.lang = "en-US"
      r.onresult = (event: any) => { for (let i = event.resultIndex; i < event.results.length; i++) if (event.results[i].isFinal) answer(event.results[i][0].transcript) }
      r.onerror = () => setError("Microphone unavailable. You can still type below. Check your browser microphone settings.")
      r.start(); recognition.current = r
    } catch { setError("Microphone unavailable. You can still type below. Check your browser microphone settings.") }
  }

  return <main className="ultraglot-chat">
    <div className="ug-shell">
      <div ref={scroller} className="ug-conversation" aria-label="Conversation" onScroll={e => { const el = e.currentTarget; pinned.current = el.scrollHeight - el.scrollTop - el.clientHeight < 80 }}>
        <div className="ug-thread" role="log" aria-live="polite" aria-relevant="additions">
          {messages.map(m => <div key={m.id} className={m.from?.isLocal ? "ug-message ug-message-user" : "ug-message ug-message-agent"}><p>{m.message}</p></div>)}
        </div>
        {error && <p role="alert" className="ug-error">{error}</p>}
        {thinking && <div className="ug-thinking"><ThinkingState title="Thinking" status="running" rows={[{ id: "reply", label: "Preparing a response", status: "running" }]} /></div>}
        {files.length > 0 && <p className="ug-files">Selected locally: {files.join(", ")}</p>}
        {voice !== "idle" && <section className="ug-voice" aria-label="Voice practice">
          <div className="ug-orb" aria-label={`Voice ${voice}`}><Orb agentState={voice === "speaking" ? "talking" : voice === "thinking" ? "thinking" : "listening"} volumeMode="manual" manualInput={voice === "listening" && micOn && !error ? .4 : 0} manualOutput={voice === "speaking" && speakerOn ? .5 : 0} /></div>
          <p className="ug-voice-state" aria-live="polite">{error ? "Voice unavailable" : voice === "listening" ? "Listening" : voice === "thinking" ? "Processing" : "Speaking"}</p>
          {error && <p role="alert" className="ug-error">{error}</p>}
          <div className="ug-voice-actions">
            <button type="button" aria-label={micOn ? "Mute microphone" : "Unmute microphone"} onClick={() => { setMicOn(!micOn); if (micOn) recognition.current?.stop?.(); else recognition.current?.start?.() }}><span>{micOn ? <Mic size={19}/> : <MicOff size={19}/>}</span><small>{micOn ? "Mute" : "Unmute"}</small></button>
            <button type="button" aria-label={speakerOn ? "Mute speaker" : "Unmute speaker"} onClick={() => { setSpeakerOn(!speakerOn); if (speakerOn) window.speechSynthesis?.cancel() }}><span>{speakerOn ? <Volume2 size={19}/> : <VolumeX size={19}/>}</span><small>{speakerOn ? "Sound on" : "Sound off"}</small></button>
            <button type="button" aria-label="End voice session" onClick={stopVoice}><span><PhoneOff size={19}/></span><small>End</small></button>
          </div>
        </section>}
      </div>
      <div className="ug-bottom">
        {setup && <ProviderSetup current={config} onRemove={() => { configRef.current = null; pendingText.current = null; setConfig(null); setSetup(false); setPending(false) }} onClose={() => { pendingText.current = null; setSetup(false); setPending(false) }} onSave={saved => { configRef.current = saved; setConfig(saved); setSetup(false); setPending(false); const text = pendingText.current; pendingText.current = null; if (text) void send(text, saved) }} />}
        <button className="ug-settings-trigger" type="button" onClick={() => setSetup(true)}>{config ? `Provider: ${config.provider} · Settings` : "Connect provider"}</button>
        {messages.length === 1 && <div className="ug-starters" aria-label="Send a conversation starter">
          {["Tell me about London in the spring", "Let's talk about the history of Paris", "What's a food you grew up with?"].map(text => <button key={text} type="button" onClick={() => answer(text)}>{text}</button>)}
        </div>}
        <BlocksAi02 className="ug-composer" voiceActive={voice !== "idle"} onVoiceStart={startVoice} onSubmit={answer} onFilesSelected={items => setFiles(f => [...f, ...items.map(x => x.name)])}/>
      </div>
    </div>
  </main>
}
