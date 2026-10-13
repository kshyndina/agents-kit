import { HomeChatPreview } from "@/components/gallery/home-chat-preview"
import { HomeVoicePreview } from "@/components/gallery/home-voice-preview"
import { ThinkingState } from "@/components/beautiful-ui/thinking-state"
import { PublicHeader } from "@/components/gallery/public-header"

export default function Home() {
  return (
    <>
      <PublicHeader />
      <main className="mx-auto max-w-[1120px] px-5 py-10 sm:px-8 sm:py-16">
        <section className="mx-auto max-w-[760px] text-center">
          <p className="text-text-secondary text-xs">Kate · Agents Kit</p>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight sm:text-5xl">
            Chat and voice, together.
          </h1>
          <p className="text-text-secondary mx-auto mt-4 max-w-xl text-sm leading-6">
            One conversation surface for messages, files, thinking, listening,
            and voice responses.
          </p>
        </section>
        <section className="mx-auto mt-10 grid max-w-[900px] gap-6 lg:grid-cols-[1.15fr_.85fr]">
          <div className="min-w-0 rounded-2xl border border-border-separator bg-background-secondary-default p-4 sm:p-6">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">Conversation</p>
                <p className="text-text-secondary mt-1 text-xs">
                  Messages · attachments · thinking
                </p>
              </div>
              <span className="text-text-secondary text-xs">Ready</span>
            </div>
            <HomeChatPreview />
            <div className="mt-6 border-t border-border-separator pt-5">
              <ThinkingState
                variant="steps"
                title="Thinking"
                status="running"
                rows={[
                  { id: "listen", label: "Listening", status: "complete" },
                  { id: "context", label: "Reading conversation and files", status: "complete" },
                  { id: "answer", label: "Preparing response", status: "running" },
                ]}
              />
            </div>
          </div>
          <div className="min-w-0 rounded-2xl border border-border-separator bg-background-secondary-default p-4 sm:p-6">
            <div className="mb-4">
              <p className="text-sm font-medium">Voice</p>
              <p className="text-text-secondary mt-1 text-xs">
                Listening · speaking · transcript
              </p>
            </div>
            <HomeVoicePreview />
          </div>
        </section>
      </main>
    </>
  )
}
