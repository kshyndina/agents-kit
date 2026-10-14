"use client"
import { useState } from 'react'
import { clearConfig, providers, saveConfig, validate, type Config, type Provider } from '@/lib/byok'
export function ProviderSetup({ current, onSave, onClose, onRemove }: { current: Config | null; onSave: (config: Config) => void; onClose: () => void; onRemove: () => void }) {
  const [provider, setProvider] = useState<Provider>(current?.provider || 'OpenAI')
  const [key, setKey] = useState('')
  const [url, setUrl] = useState(current?.provider === 'Custom' ? current.url : '')
  const [remember, setRemember] = useState(current?.remember || false)
  const [error, setError] = useState('')
  return <section className="ug-provider" aria-label="Connect AI provider">
    <div className="ug-provider-head"><h2>Connect an AI provider</h2><button type="button" onClick={onClose} aria-label="Close provider setup">×</button></div>
    <p>Use your own API key to chat. With “Remember” off, it stays in this tab’s browser session; with it on, it stays in this device’s browser storage. The key is relayed through this demo’s server to the selected provider for each request and is not saved by the server. Browser storage is readable by scripts on this site and people with access to this device. Custom endpoints connect directly from your browser and may require CORS access.</p>
    <form onSubmit={event => { event.preventDefault(); try { const config = { ...validate(provider, key || (provider === current?.provider ? current.key : ''), url), remember }; saveConfig(config); onSave(config) } catch (e) { setError(e instanceof Error ? e.message : 'Unable to save browser settings.') } }}>
      <label htmlFor="ug-provider-choice">Provider</label><select id="ug-provider-choice" value={provider} onChange={e => setProvider(e.target.value as Provider)}>{providers.map(p => <option key={p}>{p}</option>)}</select>
      {provider === 'Custom' && <><label htmlFor="ug-provider-url">OpenAI-compatible base URL</label><input id="ug-provider-url" type="url" required value={url} onChange={e => setUrl(e.target.value)} placeholder="https://example.com/v1" /></>}
      <label htmlFor="ug-provider-key">API key</label><input id="ug-provider-key" type="password" autoComplete="off" spellCheck={false} value={key} onChange={e => setKey(e.target.value)} placeholder={current ? 'Leave empty to retain current key' : 'Paste API key'} />
      <label className="ug-provider-check"><input type="checkbox" checked={remember} onChange={e => setRemember(e.target.checked)} /> Remember on this device (localStorage); otherwise this tab session only</label>
      {error && <p role="alert" className="ug-error">{error}</p>}
      <div className="ug-provider-actions"><button type="button" onClick={() => { try { clearConfig(); onRemove() } catch { setError('Could not clear browser storage.') } }}>Remove key</button><button type="submit">Save &amp; chat</button></div>
    </form>
  </section>
}
