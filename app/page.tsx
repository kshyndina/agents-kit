"use client"

import { BlocksAi02 } from "@/components/blocks-so/ai/ai-02"
import { ThinkingState } from "@/components/beautiful-ui/thinking-state"
import { VoiceAgentSession } from "@/components/voice-agents/session"
import type { ReceivedMessage } from "@livekit/components-react"
import { useMemo, useState } from "react"

const starter = [
  { id: "u1", timestamp: Date.now() - 9000, from: { isLocal: true }, message: "Na-na-na-na, na-na-na-na-na-na" },
  { id: "a1", timestamp: Date.now() - 8000, from: { isLocal: false }, message: "That little hook is catchy. I can help you explore it. What would you like to do next?" },
] as ReceivedMessage[]

export default function Home() {
  const [messages, setMessages] = useState<ReceivedMessage[]>(starter)
  const [thinking, setThinking] = useState(false)
  const [voiceState, setVoiceState] = useState<"idle" | "listening" | "thinking" | "speaking" | "disconnected">("idle")
  const [mic, setMic] = useState(true)
  const [speaker, setSpeaker] = useState(true)
  const [files, setFiles] = useState<string[]>([])
  const voiceMessages = useMemo(() => messages, [messages])

  const respond = (text: string) => {
    const now = Date.now()
    setMessages((m) => [...m, { id: `u-${now}`, timestamp: now, from: { isLocal: true }, message: text } as ReceivedMessage])
    setThinking(true)
    setTimeout(() => {
      setThinking(false)
      setMessages((m) => [...m, { id: `a-${Date.now()}`, timestamp: Date.now(), from: { isLocal: false }, message: "Here is a helpful next step from Kate. This is a demo response, ready to be replaced by your BYOK model." } as ReceivedMessage])
    }, 750)
  }

  return (
    <main className="min-h-svh bg-background-default px-3 py-3 sm:px-8 sm:py-6">
      <section className="mx-auto flex min-h-[calc(100svh-1.5rem)] max-w-[1240px] flex-col overflow-hidden rounded-[28px] border border-border-separator bg-background-default shadow-sm sm:min-h-[calc(100svh-3rem)]">
        <header className="flex items-center justify-between border-b border-border-separator px-5 py-4 sm:px-8">
          <div><p className="text-sm font-medium">Kate</p><p className="text-text-secondary mt-1 text-xs">Chat and voice</p></div>
          <span className="text-text-secondary text-xs">BYOK ready · demo mode</span>
        </header>
        <div className="flex-1 overflow-auto px-4 py-6 sm:px-10 sm:py-8">
          <div className="mx-auto grid max-w-[1080px] gap-8 lg:grid-cols-[1.12fr_.88fr] lg:items-start">
            <div className="min-w-0">
              <div className="space-y-5">
                {messages.map((m) => <div key={m.id} className={m.from.isLocal ? "ml-auto max-w-[82%] rounded-[22px] bg-blue-50 px-5 py-3 text-sm text-slate-800" : "max-w-[88%] px-1 py-2 text-[15px] leading-7"}>{m.message}</div>)}
              </div>
              {thinking && <div className="mt-5"><ThinkingState title="Thinking" status="running" rows={[{ id: "one", label: "Reading the conversation", status: "complete" }, { id: "two", label: "Preparing a response", status: "running" }]} /></div>}
              {files.length > 0 && <div className="mt-4 text-xs text-text-secondary">Attached: {files.join(", ")}</div>}
              <div className="mt-8"><BlocksAi02 className="max-w-none" onSubmit={(text) => respond(text)} onFilesSelected={(items) => setFiles((f) => [...f, ...items.map((x) => x.name)])} /></div>
            </div>
            <div className="min-w-0 lg:sticky lg:top-4"><VoiceAgentSession name="Kate" state={voiceState} messages={voiceMessages} microphoneEnabled={mic} speakerEnabled={speaker} inputLevel={voiceState === "listening" ? .55 : 0} outputLevel={voiceState === "speaking" ? .65 : 0} onMicrophoneChange={setMic} onSpeakerChange={setSpeaker} onDisconnect={() => setVoiceState("disconnected")} onConnect={() => { setVoiceState("listening"); setTimeout(() => setVoiceState("speaking"), 900); setTimeout(() => setVoiceState("listening"), 2200) }} statusText={voiceState === "idle" ? "Ready when you are" : undefined} /></div>
          </div>
        </div>
      </section>
    </main>
  )
}
