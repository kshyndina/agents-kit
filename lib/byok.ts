export type Provider = 'OpenAI' | 'Anthropic' | 'Gemini' | 'DeepSeek' | 'Grok' | 'Custom'
export type Config = { provider: Provider; key: string; url: string; remember: boolean }
export const providers: Provider[] = ['OpenAI', 'Anthropic', 'Gemini', 'DeepSeek', 'Grok', 'Custom']
const endpoints: Record<Provider, string> = { OpenAI: 'https://api.openai.com/v1', Anthropic: 'https://api.anthropic.com/v1', Gemini: 'https://generativelanguage.googleapis.com/v1beta', DeepSeek: 'https://api.deepseek.com/v1', Grok: 'https://api.x.ai/v1', Custom: '' }
const storageKey = 'kate-chat.byok.v1'
export function validate(provider: Provider, key: string, url: string): Config {
  if (!providers.includes(provider)) throw Error('Choose a supported provider.')
  if (!key.trim()) throw Error('Enter an API key.')
  const endpoint = provider === 'Custom' ? url.trim().replace(/\/$/, '') : endpoints[provider]
  if (provider === 'Custom') {
    let parsed: URL
    try { parsed = new URL(endpoint) } catch { throw Error('Enter a valid custom endpoint URL.') }
    if (parsed.username || parsed.password || parsed.search || parsed.hash || (parsed.protocol !== 'https:' && !(parsed.protocol === 'http:' && ['localhost', '127.0.0.1', '[::1]'].includes(parsed.hostname)))) throw Error('Use HTTPS (or localhost for development), without credentials or query parameters.')
  }
  return { provider, key: key.trim(), url: endpoint, remember: false }
}
export function loadConfig(): Config | null {
  for (const store of [sessionStorage, localStorage]) {
    try {
      const raw = store.getItem(storageKey)
      if (!raw) continue
      const value = JSON.parse(raw)
      const config = validate(value.provider, value.key, value.url)
      return { ...config, remember: store === localStorage }
    } catch { /* malformed or unavailable storage */ }
  }
  return null
}
export function saveConfig(config: Config) {
  sessionStorage.removeItem(storageKey)
  localStorage.removeItem(storageKey)
  ;(config.remember ? localStorage : sessionStorage).setItem(storageKey, JSON.stringify(config))
}
export function clearConfig() { sessionStorage.removeItem(storageKey); localStorage.removeItem(storageKey) }
type Turn = { role: 'user' | 'assistant'; content: string }
export async function chat(config: Config, turns: Turn[], signal?: AbortSignal): Promise<string> {
  const { provider, key, url } = config
  if (provider === 'Custom') {
    const response = await fetch(`${url}/chat/completions`, { method: 'POST', headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ model: 'default', messages: turns }), signal, cache: 'no-store' })
    if (!response.ok) throw Error(`Custom provider returned HTTP ${response.status}. Check your endpoint, key and model.`)
    const data = await response.json()
    const text = data.choices?.[0]?.message?.content
    if (typeof text !== 'string' || !text.trim()) throw Error('Custom provider returned no text.')
    return text
  }
  let response: Response
  try { response = await fetch('/api/chat', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ provider, key, url, turns }), signal, cache: 'no-store' }) }
  catch (error) { if (signal?.aborted) throw Error('Request cancelled.'); throw Error('Could not reach the chat service. Check your connection.') }
  if (!response.ok) throw Error(`Provider returned HTTP ${response.status}. Check your key, model, quota and endpoint.`)
  const data = await response.json()
  const text = data.text
  if (typeof text !== 'string' || !text.trim()) throw Error('Provider returned no text. Check the model and provider settings.')
  return text
}
