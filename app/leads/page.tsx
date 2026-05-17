'use client'

import { useState, useMemo } from 'react'
import { Shell } from '@/components/layout/shell'
import { PageHeader } from '@/components/layout/page-header'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { Badge, getStatusBadgeVariant } from '@/components/ui/badge'
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table'
import { LeadForm } from '@/components/leads/lead-form'
import { formatCurrency, formatDate, isOverdue } from '@/lib/utils'
import { demoLeads, demoCustomers } from '@/lib/demo-data'
import type { Lead } from '@/lib/types'
import { Plus, Search, Pencil, ArrowLeftRight, AlertTriangle } from 'lucide-react'

export default function LeadsPage() {
  const [leads, setLeads] = useState<Lead[]>(
    demoLeads.map(l => ({
      ...l,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      customers: demoCustomers.find(c => c.id === l.customer_id)
        ? { ...demoCustomers.find(c => c.id === l.customer_id)!, created_at: '', updated_at: '' }
        : undefined,
    }))
  )
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<Lead | undefined>()

  const filtered = useMemo(() => {
    return leads.filter(l => {
      const q = search.toLowerCase()
      const matchSearch = (l.full_name || '').toLowerCase().includes(q) ||
        (l.phone || '').includes(q)
      const matchStatus = !statusFilter || l.lead_status === statusFilter
      return matchSearch && matchStatus
    })
  }, [leads, search, statusFilter])

  const handleSave = (data: Partial<Lead>) => {
    if (editing) {
      setLeads(prev => prev.map(l => l.id === editing.id ? { ...l, ...data, updated_at: new Date().toISOString() } : l))
    } else {
      const newLead: Lead = {
        ...data as Lead,
        id: Math.random().toString(36).slice(2),
        lead_status: data.lead_status || 'חדש',
        priority: data.priority || 'בינוני',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }
      setLeads(prev => [newLead, ...prev])
    }
    setEditing(undefined)
  }

  const convertToQuote = (lead: Lead) => {
    setLeads(prev => prev.map(l => l.id === lead.id ? { ...l, lead_status: 'הומר' } : l))
    alert(`הליד "${lead.full_name}" הומר להצעת מחיר! ניתן להוסיף אותו בדף הצעות המחיר.`)
  }

  return (
    <Shell title="לידים">
      <div className="max-w-7xl mx-auto">
        <PageHeader
          title="לידים"
          description={`${leads.length} לידים במערכת`}
          action={
            <Button onClick={() => { setEditing(undefined); setFormOpen(true) }}>
              <Plus size={16} />
              ליד חדש
            </Button>
          }
        />

        <div className="flex gap-3 mb-4">
          <div className="relative flex-1">
            <Search size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#7a6a52]" />
            <Input
              className="pr-9"
              placeholder="חיפוש לפי שם, טלפון..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          <Select
            className="w-40"
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
          >
            <option value="">כל הסטטוסים</option>
            {['חדש', 'בטיפול', 'ממתין', 'הומר', 'נסגר'].map(s => (
              <option key={s} value={s}>{s}</option>
            ))}
          </Select>
        </div>

        <div className="bg-white rounded-xl border border-[#e5ddd0] shadow-[0_1px_8px_rgba(26,18,9,0.06)] overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>שם</TableHead>
                <TableHead className="hidden sm:table-cell">טלפון</TableHead>
                <TableHead className="hidden md:table-cell">סוג תכשיט</TableHead>
                <TableHead className="hidden lg:table-cell">תקציב</TableHead>
                <TableHead>סטטוס</TableHead>
                <TableHead>עדיפות</TableHead>
                <TableHead className="hidden md:table-cell">מעקב</TableHead>
                <TableHead>פעולות</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 && (
                <TableRow>
                  <TableCell colSpan={8} className="text-center text-[#7a6a52] py-12">
                    לא נמצאו לידים
                  </TableCell>
                </TableRow>
              )}
              {filtered.map(lead => {
                const overdue = lead.follow_up_date && isOverdue(lead.follow_up_date) &&
                  !['הומר', 'נסגר'].includes(lead.lead_status)
                return (
                  <TableRow key={lead.id}>
                    <TableCell>
                      <div className="font-medium text-[#2c1810]">{lead.full_name || '—'}</div>
                      {lead.source && <div className="text-xs text-[#7a6a52]">{lead.source}</div>}
                    </TableCell>
                    <TableCell className="hidden sm:table-cell">{lead.phone || '—'}</TableCell>
                    <TableCell className="hidden md:table-cell">
                      {lead.jewelry_type || '—'}
                      {lead.gold_type && <span className="text-[#7a6a52]"> · {lead.gold_type}</span>}
                    </TableCell>
                    <TableCell className="hidden lg:table-cell">
                      {lead.budget ? formatCurrency(lead.budget) : '—'}
                    </TableCell>
                    <TableCell>
                      <Badge variant={getStatusBadgeVariant(lead.lead_status)}>
                        {lead.lead_status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={getStatusBadgeVariant(lead.priority)}>
                        {lead.priority}
                      </Badge>
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      {lead.follow_up_date ? (
                        <span className={overdue ? 'text-red-600 flex items-center gap-1' : 'text-[#7a6a52]'}>
                          {overdue && <AlertTriangle size={12} />}
                          {formatDate(lead.follow_up_date)}
                        </span>
                      ) : '—'}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => { setEditing(lead); setFormOpen(true) }}
                          title="עריכה"
                        >
                          <Pencil size={15} />
                        </Button>
                        {!['הומר', 'נסגר'].includes(lead.lead_status) && (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => convertToQuote(lead)}
                            title="המר להצעת מחיר"
                            className="text-[#b8934a]"
                          >
                            <ArrowLeftRight size={15} />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </div>

        <LeadForm
          open={formOpen}
          onClose={() => { setFormOpen(false); setEditing(undefined) }}
          lead={editing}
          onSave={handleSave}
        />
      </div>
    </Shell>
  )
}
