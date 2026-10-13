/* eslint-disable @typescript-eslint/no-explicit-any */
"use client"

import { BlocksAi02 } from "@/components/blocks-so/ai/ai-02"
import { ThinkingState } from "@/components/beautiful-ui/thinking-state"
import { Orb } from "@/components/voice-agents/elevenlabs/orb"
import type { ReceivedMessage } from "@livekit/components-react"
import { Mic, MicOff, PhoneOff, Volume2, VolumeX } from "lucide-react"
import { useEffect, useRef, useState } from "react"

type VoiceState = "idle" | "listening" | "thinking" | "speaking"
const seed = [{ id: "welcome", timestamp: 1, from: { isLocal: false }, message: "Hi — what would you like to practise today?" }] as ReceivedMessage[]
const demoReply = "Nice. Let's practise that together. Tell me a little more and we'll keep the conversation going."

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
  const [suggestedDraft, setSuggestedDraft] = useState<{ text: string; id: number }>()
  const recognition = useRef<any>(null)
  const replyTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const scroller = useRef<HTMLDivElement>(null)
  const pinned = useRef(true)
  useEffect(() => { if (pinned.current) scroller.current?.scrollTo({ top: scroller.current.scrollHeight, behavior: "smooth" }) }, [messages, thinking, voice])
  useEffect(() => () => { recognition.current?.abort?.(); if (replyTimer.current) clearTimeout(replyTimer.current); if ("speechSynthesis" in window) window.speechSynthesis.cancel() }, [])

  const add = (text: string, local: boolean) => setMessages(m => [...m, { id: `${Date.now()}-${Math.random()}`, timestamp: Date.now(), from: { isLocal: local }, message: text } as ReceivedMessage])
  const answer = (text: string) => {
    pinned.current = true
    add(text, true); setThinking(true)
    if (voiceRef.current !== "idle") setVoice("thinking")
    if (replyTimer.current) clearTimeout(replyTimer.current)
    replyTimer.current = setTimeout(() => {
      setThinking(false); add(demoReply, false)
      if (voiceRef.current !== "idle") {
        setVoice("speaking")
        if (speakerOn && "speechSynthesis" in window) {
          const utterance = new SpeechSynthesisUtterance(demoReply)
          utterance.onend = () => { if (voiceRef.current !== "idle") setVoice("listening") }
          utterance.onerror = () => { if (voiceRef.current !== "idle") setVoice("listening") }
          window.speechSynthesis.speak(utterance)
        } else setVoice("listening")
      }
    }, 750)
  }
  const stopVoice = () => { recognition.current?.abort?.(); recognition.current = null; window.speechSynthesis?.cancel(); setVoice("idle"); setThinking(false); if (replyTimer.current) clearTimeout(replyTimer.current) }
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
        {messages.length === 1 && <div className="ug-starters" aria-label="Conversation starters">
          {["Tell me about London in the spring", "Let's talk about the history of Paris", "What's a food you grew up with?"].map(text => <button key={text} type="button" onClick={() => setSuggestedDraft({ text, id: Date.now() })}>{text}</button>)}
        </div>}
        <div className="ug-thread" role="log" aria-live="polite" aria-relevant="additions">
          {messages.map(m => <div key={m.id} className={m.from?.isLocal ? "ug-message ug-message-user" : "ug-message ug-message-agent"}><p>{m.message}</p></div>)}
        </div>
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
      <div className="ug-bottom"><BlocksAi02 className="ug-composer" suggestedDraft={suggestedDraft} voiceActive={voice !== "idle"} onVoiceStart={startVoice} onSubmit={answer} onFilesSelected={items => setFiles(f => [...f, ...items.map(x => x.name)])}/></div>
    </div>
  </main>
}
