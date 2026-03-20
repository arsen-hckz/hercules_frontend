import { useState, useRef, useEffect } from 'react'
import { useMutation } from '@tanstack/react-query'
import api from '../api/axios'
import useAuthStore from '../store/authStore'
import useLanguageStore from '../store/languageStore'
import { useT } from '../i18n'

/* ── small reusable components ─────────────────────────────────────── */

function SectionCard({ title, children }) {
  return (
    <div className="bg-white rounded-2xl shadow-[0_2px_16px_rgba(30,51,88,0.08)] overflow-hidden">
      <div className="px-6 py-4 border-b border-cream-100 bg-cream-50/60">
        <h3 className="font-display tracking-wide text-ink-900 text-sm">{title}</h3>
      </div>
      <div className="px-6 py-5">{children}</div>
    </div>
  )
}

function Input({ label, ...props }) {
  return (
    <div>
      <label className="block text-xs font-medium text-ink-500 mb-1.5 uppercase tracking-wide">{label}</label>
      <input
        {...props}
        className="w-full bg-cream-50 border border-cream-300 rounded-xl px-4 py-2.5 text-ink-900 text-sm focus:outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/15"
      />
    </div>
  )
}

function SaveButton({ loading, label, loadingLabel }) {
  return (
    <button
      type="submit"
      disabled={loading}
      className="bg-teal-500 hover:bg-teal-600 text-white font-display tracking-widest px-6 py-2.5 rounded-xl shadow-[0_4px_12px_rgba(59,191,191,0.25)] disabled:opacity-50 text-sm"
    >
      {loading ? loadingLabel : label}
    </button>
  )
}

function FeedbackMsg({ ok, err }) {
  if (!ok && !err) return null
  return (
    <p className={`text-xs font-medium mt-2 ${ok ? 'text-teal-600' : 'text-red-500'}`}>
      {ok || err}
    </p>
  )
}

/* ── sections ──────────────────────────────────────────────────────── */

function AvatarSection({ me, fetchMe, t }) {
  const fileRef = useRef(null)
  const [preview, setPreview] = useState(null)
  const [file, setFile]       = useState(null)
  const [ok, setOk]   = useState('')
  const [err, setErr] = useState('')

  function handleFile(e) {
    const f = e.target.files[0]
    if (!f) return
    setFile(f)
    setPreview(URL.createObjectURL(f))
  }

  const mutation = useMutation({
    mutationFn: () => {
      const fd = new FormData()
      fd.append('avatar', file)
      return api.patch('/auth/me/', fd)
    },
    onSuccess: () => { fetchMe(); setOk(t('saved')); setFile(null); setPreview(null) },
    onError:   () => setErr(t('error')),
  })

  const src = preview || me?.avatar

  return (
    <SectionCard title={t('settings_avatar')}>
      <p className="text-xs text-ink-500 mb-4">{t('settings_avatar_sub')}</p>
      <div className="flex items-center gap-5">
        <div
          className="relative flex-shrink-0 cursor-pointer group"
          onClick={() => fileRef.current?.click()}
        >
          {src
            ? <img src={src} alt="" className="w-20 h-20 rounded-2xl object-cover" />
            : <div className="w-20 h-20 rounded-2xl bg-navy-900 flex items-center justify-center text-white text-3xl font-display">
                {me?.username?.[0]?.toUpperCase()}
              </div>
          }
          <div className="absolute inset-0 rounded-2xl bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 text-white text-xs font-medium">
            Change
          </div>
        </div>
        <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />

        {file && (
          <div className="flex flex-col gap-2">
            <form onSubmit={e => { e.preventDefault(); mutation.mutate() }}>
              <SaveButton loading={mutation.isPending} label={t('settings_avatar_save')} loadingLabel={t('saving')} />
            </form>
            <button onClick={() => { setFile(null); setPreview(null) }} className="text-xs text-ink-400 hover:text-ink-700">
              {t('cancel')}
            </button>
          </div>
        )}
      </div>
      <FeedbackMsg ok={ok} err={err} />
    </SectionCard>
  )
}

function ProfileSection({ me, fetchMe, t }) {
  const [form, setForm] = useState({ first_name: '', last_name: '', bio: '' })
  const [ok, setOk]   = useState('')
  const [err, setErr] = useState('')

  useEffect(() => {
    if (me) setForm({ first_name: me.first_name || '', last_name: me.last_name || '', bio: me.bio || '' })
  }, [me])

  const mutation = useMutation({
    mutationFn: () => api.patch('/auth/me/', form),
    onSuccess: () => { fetchMe(); setOk(t('saved')) },
    onError:   () => setErr(t('error')),
  })

  return (
    <SectionCard title={t('settings_profile')}>
      <form onSubmit={e => { e.preventDefault(); setOk(''); setErr(''); mutation.mutate() }} className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <Input label={t('settings_firstname')} value={form.first_name} onChange={e => setForm(f => ({ ...f, first_name: e.target.value }))} />
          <Input label={t('settings_lastname')}  value={form.last_name}  onChange={e => setForm(f => ({ ...f, last_name:  e.target.value }))} />
        </div>
        <div>
          <label className="block text-xs font-medium text-ink-500 mb-1.5 uppercase tracking-wide">{t('settings_bio')}</label>
          <textarea
            value={form.bio}
            onChange={e => setForm(f => ({ ...f, bio: e.target.value }))}
            placeholder={t('settings_bio_placeholder')}
            rows={3}
            maxLength={200}
            className="w-full bg-cream-50 border border-cream-300 rounded-xl px-4 py-2.5 text-ink-900 text-sm focus:outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/15 resize-none"
          />
          <p className="text-xs text-ink-300 text-right mt-0.5">{form.bio.length}/200</p>
        </div>
        <div className="flex items-center gap-3">
          <SaveButton loading={mutation.isPending} label={t('settings_save')} loadingLabel={t('saving')} />
          <FeedbackMsg ok={ok} err={err} />
        </div>
      </form>
    </SectionCard>
  )
}

function EmailSection({ me, fetchMe, t }) {
  const [email, setEmail] = useState('')
  const [ok, setOk]   = useState('')
  const [err, setErr] = useState('')

  useEffect(() => { if (me) setEmail(me.email || '') }, [me])

  const mutation = useMutation({
    mutationFn: () => api.patch('/auth/me/', { email }),
    onSuccess: () => { fetchMe(); setOk(t('saved')) },
    onError:   (e) => setErr(e.response?.data?.email?.[0] || t('error')),
  })

  return (
    <form onSubmit={e => { e.preventDefault(); setOk(''); setErr(''); mutation.mutate() }} className="space-y-4">
      <Input label={t('settings_email')} type="email" required value={email} onChange={e => setEmail(e.target.value)} />
      <div className="flex items-center gap-3">
        <SaveButton loading={mutation.isPending} label={t('settings_email_save')} loadingLabel={t('saving')} />
        <FeedbackMsg ok={ok} err={err} />
      </div>
    </form>
  )
}

function PasswordSection({ t }) {
  const [form, setForm] = useState({ old_password: '', new_password: '', confirm: '' })
  const [ok, setOk]   = useState('')
  const [err, setErr] = useState('')

  const mutation = useMutation({
    mutationFn: () => api.post('/auth/password-change/', {
      old_password:  form.old_password,
      new_password:  form.new_password,
    }),
    onSuccess: () => { setOk(t('saved')); setForm({ old_password: '', new_password: '', confirm: '' }) },
    onError:   (e) => setErr(e.response?.data?.old_password?.[0] || e.response?.data?.detail || t('error')),
  })

  function handleSubmit(e) {
    e.preventDefault()
    setOk(''); setErr('')
    if (form.new_password !== form.confirm) { setErr(t('passwords_no_match')); return }
    mutation.mutate()
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 pt-5 border-t border-cream-100">
      <h4 className="font-display text-xs tracking-widest text-ink-500">{t('settings_password')}</h4>
      <Input label={t('settings_old_password')}     type="password" required value={form.old_password} onChange={e => setForm(f => ({ ...f, old_password:  e.target.value }))} />
      <Input label={t('settings_new_password')}     type="password" required value={form.new_password} onChange={e => setForm(f => ({ ...f, new_password:  e.target.value }))} />
      <Input label={t('settings_confirm_password')} type="password" required value={form.confirm}       onChange={e => setForm(f => ({ ...f, confirm:        e.target.value }))} />
      <div className="flex items-center gap-3">
        <SaveButton loading={mutation.isPending} label={t('settings_password_save')} loadingLabel={t('saving')} />
        <FeedbackMsg ok={ok} err={err} />
      </div>
    </form>
  )
}

function PreferencesSection({ t }) {
  const { lang, setLang } = useLanguageStore()

  return (
    <SectionCard title={t('settings_preferences')}>
      <div>
        <p className="text-xs font-medium text-ink-500 mb-3 uppercase tracking-wide">{t('settings_language')}</p>
        <div className="flex gap-2">
          {[
            { value: 'en', label: t('settings_lang_en'), flag: '🇬🇧' },
            { value: 'el', label: t('settings_lang_el'), flag: '🇬🇷' },
          ].map(opt => (
            <button
              key={opt.value}
              onClick={() => setLang(opt.value)}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium border transition-all ${
                lang === opt.value
                  ? 'bg-teal-500 text-white border-teal-500 shadow-[0_4px_12px_rgba(59,191,191,0.25)]'
                  : 'bg-cream-50 text-ink-700 border-cream-300 hover:border-teal-400'
              }`}
            >
              <span>{opt.flag}</span>
              <span className="font-display tracking-wide text-xs">{opt.label}</span>
            </button>
          ))}
        </div>
      </div>
    </SectionCard>
  )
}

/* ── main page ─────────────────────────────────────────────────────── */

export default function Settings() {
  const { user: me, fetchMe } = useAuthStore()
  const t = useT()

  if (!me) return null

  return (
    <div className="max-w-2xl mx-auto space-y-5">
      <h2 className="text-2xl font-display tracking-wide text-ink-900">{t('settings_title')}</h2>

      <AvatarSection me={me} fetchMe={fetchMe} t={t} />
      <ProfileSection me={me} fetchMe={fetchMe} t={t} />

      <SectionCard title={t('settings_account')}>
        <EmailSection me={me} fetchMe={fetchMe} t={t} />
        <PasswordSection t={t} />
      </SectionCard>

      <PreferencesSection t={t} />
    </div>
  )
}
