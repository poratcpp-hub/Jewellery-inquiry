'use client'

import { useState } from 'react'
import { Shell } from '@/components/layout/shell'
import { PageHeader } from '@/components/layout/page-header'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { FormField, FormGrid } from '@/components/ui/form-field'
import { useToast } from '@/components/ui/toast'
import { Database, Gem, Users, Mail, CheckCircle } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

const IS_DEMO =
  !process.env.NEXT_PUBLIC_SUPABASE_URL ||
  process.env.NEXT_PUBLIC_SUPABASE_URL === 'https://placeholder.supabase.co' ||
  process.env.NEXT_PUBLIC_DEMO_MODE === 'true'

function UserManagement() {
  const { toast } = useToast()
  const [inviteEmail, setInviteEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)

  const handleInvite = async () => {
    if (!inviteEmail.trim() || !inviteEmail.includes('@')) {
      toast({ type: 'error', title: 'נא להזין כתובת דוא"ל תקינה' })
      return
    }
    setLoading(true)
    try {
      const supabase = createClient()
      const { error } = await supabase.auth.admin.inviteUserByEmail(inviteEmail.trim())
      if (error) throw error
      setSent(true)
      setInviteEmail('')
      toast({ type: 'success', title: 'הזמנה נשלחה', description: `מייל הזמנה נשלח ל-${inviteEmail}` })
    } catch {
      // Fallback: create user with signUp
      try {
        const supabase = createClient()
        const tempPass = Math.random().toString(36).slice(2, 10) + 'A1!'
        const { error } = await supabase.auth.signUp({
          email: inviteEmail.trim(),
          password: tempPass,
          options: { emailRedirectTo: `${window.location.origin}/login` },
        })
        if (error) throw error
        setSent(true)
        setInviteEmail('')
        toast({ type: 'success', title: 'משתמש נוצר', description: 'נשלח מייל אישור לכתובת שהוזנה' })
      } catch (err2: unknown) {
        const msg = err2 instanceof Error ? err2.message : 'שגיאה'
        toast({ type: 'error', title: 'שגיאה בשליחת ההזמנה', description: msg })
      }
    }
    setLoading(false)
  }

  if (IS_DEMO) {
    return (
      <div className="p-4 bg-amber-50 rounded-lg border border-amber-200">
        <p className="text-sm text-amber-700">
          ניהול משתמשים זמין רק במצב Supabase מחובר. עבור לייצור כדי להזמין משתמשים.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-[#7a6a52]">
        הזמינו עובדים ושותפים למערכת. הם יקבלו מייל הזמנה עם קישור לרישום.
      </p>
      {sent && (
        <div className="flex items-center gap-2 p-3 bg-emerald-50 rounded-lg border border-emerald-200">
          <CheckCircle size={16} className="text-emerald-600 shrink-0" />
          <p className="text-sm text-emerald-700">הזמנה נשלחה בהצלחה!</p>
        </div>
      )}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Mail size={15} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#7a6a52]" />
          <Input
            className="pr-9"
            type="email"
            placeholder='כתובת דוא"ל של המשתמש החדש'
            value={inviteEmail}
            onChange={e => { setInviteEmail(e.target.value); setSent(false) }}
            onKeyDown={e => e.key === 'Enter' && handleInvite()}
          />
        </div>
        <Button onClick={handleInvite} disabled={loading}>
          {loading ? 'שולח...' : 'הזמן משתמש'}
        </Button>
      </div>
      <div className="p-3 bg-[#faf8f5] rounded-lg border border-[#e5ddd0]">
        <p className="text-xs text-[#7a6a52]">
          לניהול מתקדם של משתמשים (מחיקה, שינוי תפקידים, איפוס סיסמה) — השתמשו ב-{' '}
          <span className="font-mono text-[#b8934a]">Supabase Dashboard → Authentication → Users</span>
        </p>
      </div>
    </div>
  )
}

export default function SettingsPage() {
  return (
    <Shell title="הגדרות">
      <div className="max-w-3xl mx-auto">
        <PageHeader title="הגדרות" description="הגדרות המערכת" />

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Gem size={18} className="text-[#b8934a]" />
                פרטי העסק
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormGrid>
                <FormField label="שם העסק" htmlFor="biz_name">
                  <Input id="biz_name" defaultValue="PORAT Private Jeweler" />
                </FormField>
                <FormField label="טלפון" htmlFor="biz_phone">
                  <Input id="biz_phone" defaultValue="" placeholder="050-0000000" />
                </FormField>
                <FormField label='דוא"ל' htmlFor="biz_email">
                  <Input id="biz_email" defaultValue="info@porat-jeweler.co.il" type="email" />
                </FormField>
                <FormField label="כתובת" htmlFor="biz_address">
                  <Input id="biz_address" defaultValue="" placeholder="רחוב, עיר" />
                </FormField>
              </FormGrid>
              <Button>שמור שינויים</Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users size={18} className="text-[#b8934a]" />
                ניהול משתמשים
              </CardTitle>
            </CardHeader>
            <CardContent>
              <UserManagement />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database size={18} className="text-[#b8934a]" />
                חיבור Supabase
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-[#7a6a52]">
                כדי לחבר את המערכת לבסיס הנתונים, הגדירו את קובץ <code className="font-mono text-[#b8934a] bg-[#faf8f5] px-1 rounded">.env.local</code>:
              </p>
              <div className="bg-[#2c1810] rounded-xl p-4 font-mono text-sm text-[#d4a96a] space-y-1">
                <p>NEXT_PUBLIC_SUPABASE_URL=your_project_url</p>
                <p>NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key</p>
                <p>NEXT_PUBLIC_DEMO_MODE=false</p>
              </div>
              <FormGrid>
                <FormField label="Supabase URL" htmlFor="supa_url">
                  <Input id="supa_url" placeholder="https://xxx.supabase.co" />
                </FormField>
                <FormField label="Anon Key" htmlFor="supa_key">
                  <Input id="supa_key" placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." />
                </FormField>
              </FormGrid>
              <div className="p-3 bg-[#f5efe0] rounded-lg border border-[#e5ddd0]">
                <p className="text-xs text-[#7a6a52]">
                  קובץ ה-SQL לבסיס הנתונים:{' '}
                  <code className="font-mono text-[#b8934a] bg-white px-1 rounded">supabase/schema.sql</code>
                  {' '}· הרצו ב-Supabase SQL Editor.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </Shell>
  )
}
