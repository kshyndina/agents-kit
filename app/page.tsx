import { HomeChatPreview } from "@/components/gallery/home-chat-preview"
import { HomeVoicePreview } from "@/components/gallery/home-voice-preview"
import { ThinkingState } from "@/components/beautiful-ui/thinking-state"

export default function Home() {
  return (
    <main className="min-h-svh bg-background-default px-4 py-5 sm:px-8 sm:py-8">
      <section className="mx-auto flex min-h-[calc(100svh-2.5rem)] max-w-[1180px] flex-col rounded-[28px] border border-border-separator bg-background-default shadow-sm">
        <div className="flex items-center justify-between border-b border-border-separator px-5 py-4 sm:px-8">
          <div>
            <p className="text-sm font-medium">Kate</p>
            <p className="text-text-secondary mt-1 text-xs">Chat · voice · files</p>
          </div>
          <span className="text-text-secondary text-xs">Ready for BYOK</span>
        </div>
        <div className="flex-1 overflow-auto px-4 py-6 sm:px-10 sm:py-10">
          <div className="mx-auto grid max-w-[980px] gap-8 lg:grid-cols-[1.2fr_.8fr] lg:items-end">
            <div className="min-w-0">
              <HomeChatPreview />
              <div className="mt-5">
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
            <div className="min-w-0">
              <HomeVoicePreview />
            </div>
          </div>
        </div>
        <div className="border-t border-border-separator px-4 py-4 sm:px-8">
          <p className="text-text-secondary text-center text-xs">Attach a file, type a message, or start listening.</p>
        </div>
      </section>
    </main>
  )
}
