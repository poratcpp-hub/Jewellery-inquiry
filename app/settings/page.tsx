'use client'

import { Shell } from '@/components/layout/shell'
import { PageHeader } from '@/components/layout/page-header'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { FormField, FormGrid } from '@/components/ui/form-field'
import { Database, Gem } from 'lucide-react'

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
                  <Input id="biz_name" defaultValue="יהלומי פרמיום" />
                </FormField>
                <FormField label="טלפון" htmlFor="biz_phone">
                  <Input id="biz_phone" defaultValue="03-0000000" />
                </FormField>
                <FormField label='דוא"ל' htmlFor="biz_email">
                  <Input id="biz_email" defaultValue="info@jewels.co.il" type="email" />
                </FormField>
                <FormField label="כתובת" htmlFor="biz_address">
                  <Input id="biz_address" defaultValue="בורסת היהלומים, רמת גן" />
                </FormField>
              </FormGrid>
              <Button>שמור שינויים</Button>
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
                כדי לחבר את המערכת לבסיס הנתונים, הוסיפו את משתני הסביבה הבאים:
              </p>
              <div className="bg-[#2c1810] rounded-xl p-4 font-mono text-sm text-[#d4a96a] space-y-1">
                <p>NEXT_PUBLIC_SUPABASE_URL=your_url</p>
                <p>NEXT_PUBLIC_SUPABASE_ANON_KEY=your_key</p>
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
                  קובץ ה-SQL לבסיס הנתונים נמצא בנתיב:{' '}
                  <code className="font-mono text-[#b8934a] bg-white px-1 rounded">supabase/schema.sql</code>
                </p>
                <p className="text-xs text-[#7a6a52] mt-1">
                  הרצו אותו ב-Supabase SQL Editor כדי ליצור את כל הטבלאות.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </Shell>
  )
}
