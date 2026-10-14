import { NextResponse } from 'next/server'

export const runtime = 'nodejs'
export const maxDuration = 30
const origins: Record<string, { url: string; model: string }> = {
  OpenAI: { url: 'https://api.openai.com/v1/chat/completions', model: 'gpt-4o-mini' },
  Anthropic: { url: 'https://api.anthropic.com/v1/messages', model: 'claude-3-5-haiku-latest' },
  Gemini: { url: 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent', model: 'gemini-2.0-flash' },
  DeepSeek: { url: 'https://api.deepseek.com/v1/chat/completions', model: 'deepseek-chat' },
  Grok: { url: 'https://api.x.ai/v1/chat/completions', model: 'grok-3-mini' },
}
const noStore = { 'Cache-Control': 'no-store', 'Referrer-Policy': 'no-referrer' }
export async function POST(request: Request) {
  const origin = request.headers.get('origin')
  if (origin && origin !== new URL(request.url).origin) return NextResponse.json({ error: 'Origin not allowed' }, { status: 403, headers: noStore })
  if (Number(request.headers.get('content-length') || 0) > 120000) return NextResponse.json({ error: 'Message too large' }, { status: 413, headers: noStore })
  try {
    const { provider, key, turns } = await request.json()
    const target = origins[provider]
    if (!target || typeof key !== 'string' || !key.trim() || key.length > 400 || !Array.isArray(turns) || turns.length > 50 || turns.some((t: { role?: string; content?: string }) => !['user', 'assistant'].includes(t.role || '') || typeof t.content !== 'string' || t.content.length > 12000)) return NextResponse.json({ error: 'Invalid provider request' }, { status: 400, headers: noStore })
    let headers: Record<string, string>, body: unknown
    if (provider === 'Anthropic') {
      headers = { 'x-api-key': key, 'anthropic-version': '2023-06-01', 'Content-Type': 'application/json' }
      body = { model: target.model, max_tokens: 1024, messages: turns }
    } else if (provider === 'Gemini') {
      headers = { 'x-goog-api-key': key, 'Content-Type': 'application/json' }
      body = { contents: turns.map((t: { role: string; content: string }) => ({ role: t.role === 'assistant' ? 'model' : 'user', parts: [{ text: t.content }] })) }
    } else {
      headers = { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' }
      body = { model: target.model, messages: turns }
    }
    const upstream = await fetch(target.url, { method: 'POST', headers, body: JSON.stringify(body), cache: 'no-store', signal: AbortSignal.timeout(25000), redirect: 'error' })
    if (!upstream.ok) return NextResponse.json({ error: `Provider returned HTTP ${upstream.status}` }, { status: upstream.status >= 500 ? 502 : upstream.status, headers: noStore })
    const data = await upstream.json()
    const text = provider === 'Anthropic' ? data.content?.filter((p: { type: string }) => p.type === 'text').map((p: { text: string }) => p.text).join('\n') : provider === 'Gemini' ? data.candidates?.[0]?.content?.parts?.map((p: { text: string }) => p.text).join('\n') : data.choices?.[0]?.message?.content
    if (typeof text !== 'string' || !text.trim()) return NextResponse.json({ error: 'No text returned' }, { status: 502, headers: noStore })
    return NextResponse.json({ text }, { headers: noStore })
  } catch { return NextResponse.json({ error: 'Provider connection failed' }, { status: 502, headers: noStore }) }
}
