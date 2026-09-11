import { useState } from 'react'
import { supabase } from '../lib/supabase'

export function Login({ onSuccess }: { onSuccess: () => void }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState('')
  const [resetMode, setResetMode] = useState(false)

  async function submit(e: React.FormEvent) {
    e.preventDefault(); setBusy(true); setMessage('')
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) throw error
      onSuccess()
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Giriş başarısız')
    } finally { setBusy(false) }
  }

  async function sendReset(e: React.FormEvent) {
    e.preventDefault(); setBusy(true); setMessage('')
    try {
      const redirectTo = `${window.location.origin}/`
      const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo })
      if (error) throw error
      setMessage('Şifre sıfırlama bağlantısı e-posta adresinize gönderildi. E-postadaki bağlantıyı açıp yeni şifrenizi belirleyebilirsiniz.')
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Şifre sıfırlama bağlantısı gönderilemedi')
    } finally { setBusy(false) }
  }

  return <div className="login-shell"><div className="login-card">
    <div className="brand-mark">ZK</div><h1>Deneme Takip Yönetim Sistemi</h1><p>Admin ve kurum operasyonları için merkezi yönetim paneli</p>
    {!resetMode ? <>
      <form onSubmit={submit}>
        <label>E-posta<input type="email" value={email} onChange={e=>setEmail(e.target.value)} required /></label>
        <label>Şifre<input type="password" minLength={6} value={password} onChange={e=>setPassword(e.target.value)} required /></label>
        <button className="primary wide" disabled={busy}>{busy?'İşleniyor...':'Giriş Yap'}</button>
      </form>
      <button type="button" className="link-button wide" onClick={()=>{setResetMode(true);setMessage('')}}>Şifremi Unuttum</button>
    </> : <>
      <form onSubmit={sendReset}>
        <label>E-posta<input type="email" value={email} onChange={e=>setEmail(e.target.value)} required /></label>
        <button className="primary wide" disabled={busy}>{busy?'Gönderiliyor...':'Sıfırlama Bağlantısı Gönder'}</button>
      </form>
      <button type="button" className="link-button wide" onClick={()=>{setResetMode(false);setMessage('')}}>Giriş ekranına dön</button>
    </>}
    {message && <div className="notice">{message}</div>}
  </div></div>
}
