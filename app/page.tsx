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
  const [voice, setVoice] = useState<VoiceState>("idle")
  const [micOn, setMicOn] = useState(true)
  const [speakerOn, setSpeakerOn] = useState(true)
  const [files, setFiles] = useState<string[]>([])
  const [error, setError] = useState("")
  const recognition = useRef<any>(null)
  const replyTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const scroller = useRef<HTMLDivElement>(null)
  useEffect(() => { scroller.current?.scrollTo({ top: scroller.current.scrollHeight, behavior: "smooth" }) }, [messages, thinking, voice])
  useEffect(() => () => { recognition.current?.abort?.(); if (replyTimer.current) clearTimeout(replyTimer.current); if ("speechSynthesis" in window) window.speechSynthesis.cancel() }, [])

  const add = (text: string, local: boolean) => setMessages(m => [...m, { id: `${Date.now()}-${Math.random()}`, timestamp: Date.now(), from: { isLocal: local }, message: text } as ReceivedMessage])
  const answer = (text: string) => {
    add(text, true); setThinking(true)
    if (voice !== "idle") setVoice("thinking")
    replyTimer.current = setTimeout(() => {
      setThinking(false); add(demoReply, false)
      if (voice !== "idle") {
        setVoice("speaking")
        if (speakerOn && "speechSynthesis" in window) {
          const utterance = new SpeechSynthesisUtterance(demoReply)
          utterance.onend = () => setVoice("listening")
          utterance.onerror = () => setVoice("listening")
          window.speechSynthesis.speak(utterance)
        } else setVoice("listening")
      }
    }, 750)
  }
  const stopVoice = () => { recognition.current?.abort?.(); recognition.current = null; window.speechSynthesis?.cancel(); setVoice("idle"); setThinking(false) }
  const startVoice = () => {
    if (voice !== "idle") { stopVoice(); return }
    setError(""); setVoice("listening"); setMicOn(true)
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    if (!SpeechRecognition) { setError("Live speech transcription is unavailable in this browser. You can still type while the voice bubble is open."); return }
    try {
      const r = new SpeechRecognition(); r.continuous = true; r.interimResults = false; r.lang = "en-US"
      r.onresult = (event: any) => { for (let i = event.resultIndex; i < event.results.length; i++) if (event.results[i].isFinal) answer(event.results[i][0].transcript) }
      r.onerror = () => setError("Microphone unavailable. You can still type while the voice bubble is open.")
      r.start(); recognition.current = r
    } catch { setError("Microphone unavailable. You can still type while the voice bubble is open.") }
  }

  return <main className="min-h-svh bg-background px-4 sm:px-10">
    <div className="mx-auto flex h-svh max-w-[980px] flex-col">
      <div ref={scroller} className="min-h-0 flex-1 overflow-y-auto pt-8 pb-5 sm:pt-12" aria-label="Conversation">
        <div className="space-y-6">
          {messages.map(m => <div key={m.id} className={m.from?.isLocal ? "ml-auto w-fit max-w-[85%] rounded-[24px] bg-blue-50 px-5 py-3 text-[15px] text-slate-800" : "max-w-[92%] px-1 py-2 text-[16px] leading-7"}>{m.message}</div>)}
        </div>
        {thinking && <div className="mt-4"><ThinkingState title="Thinking" status="running" rows={[{ id: "reply", label: "Preparing a response", status: "running" }]} /></div>}
        {files.length > 0 && <div className="mt-4 text-xs text-muted-foreground">Selected locally: {files.join(", ")}</div>}
        {voice !== "idle" && <div className="mx-auto mt-10 flex max-w-[420px] flex-col items-center gap-3 text-center">
          <div className="h-44 w-44" aria-label={`Voice ${voice}`}><Orb agentState={voice === "speaking" ? "talking" : voice === "thinking" ? "thinking" : "listening"} volumeMode="manual" manualInput={voice === "listening" && micOn ? .4 : 0} manualOutput={voice === "speaking" && speakerOn ? .5 : 0} /></div>
          <p className="text-sm text-muted-foreground" aria-live="polite">{voice === "listening" ? "Listening" : voice === "thinking" ? "Thinking" : "Speaking"}</p>
          {error && <p role="status" className="text-xs text-muted-foreground">{error}</p>}
          <div className="flex gap-3">
            <button type="button" aria-label={micOn ? "Mute microphone" : "Unmute microphone"} onClick={() => { setMicOn(!micOn); if (micOn) recognition.current?.stop?.(); else recognition.current?.start?.() }} className="rounded-full border p-3">{micOn ? <Mic size={18}/> : <MicOff size={18}/>}</button>
            <button type="button" aria-label={speakerOn ? "Mute speaker" : "Unmute speaker"} onClick={() => { setSpeakerOn(!speakerOn); if (speakerOn) window.speechSynthesis?.cancel() }} className="rounded-full border p-3">{speakerOn ? <Volume2 size={18}/> : <VolumeX size={18}/>}</button>
            <button type="button" aria-label="End voice session" onClick={stopVoice} className="rounded-full border p-3"><PhoneOff size={18}/></button>
          </div>
        </div>}
      </div>
      <div className="shrink-0 pb-[max(14px,env(safe-area-inset-bottom))]">
        <BlocksAi02 className="max-w-none" voiceActive={voice !== "idle"} onVoiceStart={startVoice} onSubmit={answer} onFilesSelected={items => setFiles(f => [...f, ...items.map(x => x.name)])}/>
      </div>
    </div>
  </main>
}
