export type Provider = 'OpenAI' | 'Anthropic' | 'Gemini' | 'DeepSeek' | 'Grok' | 'Custom'
export type Config = { provider: Provider; key: string; url: string; remember: boolean }
export const providers: Provider[] = ['OpenAI', 'Anthropic', 'Gemini', 'DeepSeek', 'Grok', 'Custom']
const endpoints: Record<Provider, string> = { OpenAI: 'https://api.openai.com/v1', Anthropic: 'https://api.anthropic.com/v1', Gemini: 'https://generativelanguage.googleapis.com/v1beta', DeepSeek: 'https://api.deepseek.com/v1', Grok: 'https://api.x.ai/v1', Custom: '' }
const models: Record<Exclude<Provider, 'Custom'>, string> = { OpenAI: 'gpt-4o-mini', Anthropic: 'claude-3-5-haiku-latest', Gemini: 'gemini-2.0-flash', DeepSeek: 'deepseek-chat', Grok: 'grok-3-mini' }
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
  let endpoint: string, headers: Record<string, string>, body: unknown
  if (provider === 'Anthropic') {
    endpoint = `${url}/messages`
    headers = { 'x-api-key': key, 'anthropic-version': '2023-06-01', 'anthropic-dangerous-direct-browser-access': 'true' }
    body = { model: models.Anthropic, max_tokens: 1024, messages: turns }
  } else if (provider === 'Gemini') {
    endpoint = `${url}/models/${models.Gemini}:generateContent`
    headers = { 'x-goog-api-key': key }
    body = { contents: turns.map(t => ({ role: t.role === 'assistant' ? 'model' : 'user', parts: [{ text: t.content }] })) }
  } else {
    endpoint = `${url}/chat/completions`
    headers = { Authorization: `Bearer ${key}` }
    body = { model: provider === 'Custom' ? 'default' : models[provider], messages: turns }
  }
  let response: Response
  try { response = await fetch(endpoint, { method: 'POST', headers: { ...headers, 'Content-Type': 'application/json' }, body: JSON.stringify(body), signal, cache: 'no-store' }) }
  catch (error) { if (signal?.aborted) throw Error('Request cancelled.'); throw Error('Could not reach the provider. Check your connection and whether its API allows browser requests (CORS).') }
  if (!response.ok) throw Error(`Provider returned HTTP ${response.status}. Check your key, model, quota and endpoint.`)
  const data = await response.json()
  const text = provider === 'Anthropic' ? data.content?.filter((p: {type: string}) => p.type === 'text').map((p: {text: string}) => p.text).join('\n') : provider === 'Gemini' ? data.candidates?.[0]?.content?.parts?.map((p: {text: string}) => p.text).join('\n') : data.choices?.[0]?.message?.content
  if (typeof text !== 'string' || !text.trim()) throw Error('Provider returned no text. Check the model and provider settings.')
  return text
}
