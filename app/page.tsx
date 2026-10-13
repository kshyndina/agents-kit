"use client"

import { BlocksAi02 } from "@/components/blocks-so/ai/ai-02"
import { ThinkingState } from "@/components/beautiful-ui/thinking-state"
import { VoiceAgentSession } from "@/components/voice-agents/session"
import type { ReceivedMessage } from "@livekit/components-react"
import { useState } from "react"

const starter = [{ id: "a1", timestamp: Date.now(), from: { isLocal: false }, message: "Hi — what would you like to practise today?" }] as ReceivedMessage[]

export default function Home() {
  const [messages, setMessages] = useState<ReceivedMessage[]>(starter)
  const [thinking, setThinking] = useState(false)
  const [voiceState, setVoiceState] = useState<"idle" | "listening" | "thinking" | "speaking" | "disconnected">("idle")
  const [mic, setMic] = useState(true)
  const [speaker, setSpeaker] = useState(true)
  const [files, setFiles] = useState<string[]>([])

  const respond = (text: string) => {
    const now = Date.now()
    setMessages((m) => [...m, { id: `u-${now}`, timestamp: now, from: { isLocal: true }, message: text } as ReceivedMessage])
    setThinking(true)
    setTimeout(() => {
      setThinking(false)
      setMessages((m) => [...m, { id: `a-${Date.now()}`, timestamp: Date.now(), from: { isLocal: false }, message: "Nice. Let’s practise that together — tell me a little more and I’ll keep the conversation going." } as ReceivedMessage])
    }, 750)
  }

  const startVoice = () => {
    setVoiceState("listening")
    setTimeout(() => setVoiceState("speaking"), 1000)
    setTimeout(() => setVoiceState("listening"), 2600)
  }

  return (
    <main className="min-h-svh bg-background-default px-3 sm:px-8">
      <section className="mx-auto flex min-h-svh max-w-[1120px] flex-col">
        <div className="flex-1 overflow-auto px-1 py-8 sm:px-10 sm:py-12">
          <div className="mx-auto max-w-[820px]">
            <div className="space-y-6">
              {messages.map((m) => <div key={m.id} className={m.from?.isLocal ? "ml-auto max-w-[82%] rounded-[24px] bg-blue-50 px-5 py-3 text-[15px] text-slate-800" : "max-w-[88%] px-1 py-2 text-[16px] leading-7"}>{m.message}</div>)}
            </div>
            {thinking && <div className="mt-5"><ThinkingState title="Thinking" status="running" rows={[{ id: "one", label: "Reading the conversation", status: "complete" }, { id: "two", label: "Preparing a response", status: "running" }]} /></div>}
            {files.length > 0 && <div className="mt-4 text-xs text-text-secondary">Attached: {files.join(", ")}</div>}
            {voiceState !== "idle" && voiceState !== "disconnected" && <div className="mt-10"><VoiceAgentSession name="" state={voiceState} messages={messages} microphoneEnabled={mic} speakerEnabled={speaker} inputLevel={voiceState === "listening" ? .55 : 0} outputLevel={voiceState === "speaking" ? .65 : 0} onMicrophoneChange={setMic} onSpeakerChange={setSpeaker} onDisconnect={() => setVoiceState("disconnected")} statusText={voiceState === "listening" ? "Listening" : voiceState === "speaking" ? "Speaking" : "Thinking"} /></div>}
            <div className="mt-8">
              <BlocksAi02 className="max-w-none" onVoiceStart={startVoice} onSubmit={respond} onFilesSelected={(items) => setFiles((f) => [...f, ...items.map((x) => x.name)])} />
            </div>
            <div className="mt-5 flex flex-wrap justify-center gap-2 text-sm">
              <button className="rounded-full border px-4 py-2" onClick={() => respond("I want to practise speaking about a topic.")}>Practise a topic</button>
              <button className="rounded-full border px-4 py-2" onClick={() => respond("Let’s practise a new flashcard deck.")}>Practise a flashcard deck</button>
              <button className="rounded-full border px-4 py-2" onClick={() => respond("Can you help me practise this language?")}>Practise this language</button>
            </div>
          </div>
        </div>
      </section>
    </main>
  )
}
