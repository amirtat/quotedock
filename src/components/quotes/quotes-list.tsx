'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { STATUS_LABELS } from '@/lib/utils'
import { Quote } from '@/lib/types'
import { Archive, ArchiveRestore, Copy, Trash2 } from 'lucide-react'
import { format } from 'date-fns'
import { duplicateQuote, bulkDeleteQuotes, bulkArchiveQuotes, bulkUnarchiveQuotes } from '@/app/actions/quote-actions'
import { useT } from '@/lib/lang-context'
import { useLang } from '@/lib/lang-context'
import { useConfirm } from '@/components/ui/confirm-dialog'

interface QuotesListProps {
  activeQuotes: Quote[]
  archivedQuotes: Quote[]
}

export function QuotesList({ activeQuotes: initialActive, archivedQuotes: initialArchived }: QuotesListProps) {
  const T = useT()
  const lang = useLang()
  const { dialog: confirmDialog, openConfirm } = useConfirm()
  const [activeQuotes, setActiveQuotes] = useState(initialActive)
  const [archivedQuotes, setArchivedQuotes] = useState(initialArchived)
  const [tab, setTab] = useState<'active' | 'archived'>('active')
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [, startTransition] = useTransition()

  const quotes = tab === 'active' ? activeQuotes : archivedQuotes

  function toggleOne(id: string) {
    setSelected(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  function toggleAll() {
    setSelected(prev => prev.size === quotes.length ? new Set() : new Set(quotes.map(q => q.id)))
  }

  function switchTab(next: 'active' | 'archived') {
    setTab(next)
    setSelected(new Set())
  }

  function handleBulkDelete() {
    const ids = [...selected]
    openConfirm({
      title: T.bulk_delete,
      message: T.bulk_delete_confirm,
      confirmLabel: T.bulk_delete,
      cancelLabel: T.cancel,
      variant: 'danger',
      onConfirm: () => {
        startTransition(async () => {
          await bulkDeleteQuotes(ids)
          if (tab === 'active') setActiveQuotes(prev => prev.filter(q => !ids.includes(q.id)))
          else setArchivedQuotes(prev => prev.filter(q => !ids.includes(q.id)))
          setSelected(new Set())
        })
      },
    })
  }

  function handleBulkArchive() {
    const ids = [...selected]
    openConfirm({
      title: T.bulk_archive,
      message: T.bulk_archive_confirm,
      confirmLabel: T.bulk_archive,
      cancelLabel: T.cancel,
      variant: 'default',
      onConfirm: () => {
        startTransition(async () => {
          await bulkArchiveQuotes(ids)
          const moving = activeQuotes.filter(q => ids.includes(q.id))
          setActiveQuotes(prev => prev.filter(q => !ids.includes(q.id)))
          setArchivedQuotes(prev => [...moving, ...prev])
          setSelected(new Set())
        })
      },
    })
  }

  function handleBulkUnarchive() {
    const ids = [...selected]
    openConfirm({
      title: T.bulk_unarchive,
      message: T.bulk_unarchive_confirm,
      confirmLabel: T.bulk_unarchive,
      cancelLabel: T.cancel,
      variant: 'default',
      onConfirm: () => {
        startTransition(async () => {
          await bulkUnarchiveQuotes(ids)
          const moving = archivedQuotes.filter(q => ids.includes(q.id))
          setArchivedQuotes(prev => prev.filter(q => !ids.includes(q.id)))
          setActiveQuotes(prev => [...moving, ...prev])
          setSelected(new Set())
        })
      },
    })
  }

  const allSelected = selected.size > 0 && selected.size === quotes.length

  return (
    <>
      {confirmDialog}

      {/* Tabs */}
      <div className="flex gap-1 mb-4 bg-gray-100 rounded-lg p-1 w-fit">
        <button
          onClick={() => switchTab('active')}
          className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${tab === 'active' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
        >
          {T.tab_active}
          {activeQuotes.length > 0 && (
            <span className={`ml-1.5 text-xs px-1.5 py-0.5 rounded-full ${tab === 'active' ? 'bg-indigo-100 text-indigo-700' : 'bg-gray-200 text-gray-500'}`}>
              {activeQuotes.length}
            </span>
          )}
        </button>
        <button
          onClick={() => switchTab('archived')}
          className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${tab === 'archived' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
        >
          {T.tab_archived}
          {archivedQuotes.length > 0 && (
            <span className={`ml-1.5 text-xs px-1.5 py-0.5 rounded-full ${tab === 'archived' ? 'bg-indigo-100 text-indigo-700' : 'bg-gray-200 text-gray-500'}`}>
              {archivedQuotes.length}
            </span>
          )}
        </button>
      </div>

      {/* Bulk action bar */}
      {selected.size > 0 && (
        <div className="flex items-center justify-between bg-indigo-50 border border-indigo-100 rounded-xl px-4 py-2.5 mb-4 flex-wrap gap-2">
          <span className="text-sm text-indigo-700 font-medium">
            {selected.size} {T.selected_suffix}
          </span>
          <div className="flex items-center gap-3">
            {tab === 'active' ? (
              <button
                onClick={handleBulkArchive}
                className="flex items-center gap-1.5 text-sm text-gray-600 hover:text-gray-800 font-medium transition-colors"
              >
                <Archive className="h-4 w-4" />
                {T.bulk_archive}
              </button>
            ) : (
              <button
                onClick={handleBulkUnarchive}
                className="flex items-center gap-1.5 text-sm text-gray-600 hover:text-gray-800 font-medium transition-colors"
              >
                <ArchiveRestore className="h-4 w-4" />
                {T.bulk_unarchive}
              </button>
            )}
            <button
              onClick={handleBulkDelete}
              className="flex items-center gap-1.5 text-sm text-red-600 hover:text-red-700 font-medium transition-colors"
            >
              <Trash2 className="h-4 w-4" />
              {T.bulk_delete}
            </button>
          </div>
        </div>
      )}

      {quotes.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <Archive className="h-10 w-10 mx-auto mb-3 opacity-40" />
          <p className="text-sm">{T.no_archived_quotes}</p>
        </div>
      ) : (
        <Card>
          <CardContent className="p-0">
            {/* Mobile card list */}
            <div className="sm:hidden divide-y divide-gray-100">
              {quotes.map((quote) => {
                const statusInfo = STATUS_LABELS[quote.status]
                const href = `/dashboard/quotes/${quote.id}`
                const isSelected = selected.has(quote.id)
                return (
                  <div key={quote.id} className={`flex items-center gap-3 px-4 py-3 ${isSelected ? 'bg-indigo-50/60' : ''}`}>
                    <label className="flex items-center shrink-0 cursor-pointer p-1 -m-1">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleOne(quote.id)}
                        className="h-5 w-5 rounded border-2 border-gray-400 accent-indigo-600 shrink-0 cursor-pointer"
                      />
                    </label>
                    <Link href={href} className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900 truncate">{quote.title}</p>
                      <p className="text-xs text-gray-500 mt-0.5 truncate">
                        {(quote as any).client?.name || '-'} · {format(new Date(quote.created_at), 'dd/MM/yy')}
                      </p>
                    </Link>
                    <div className="flex items-center gap-2 shrink-0">
                      <Badge className={statusInfo.color}>{statusInfo[lang]}</Badge>
                      {tab === 'active' && (
                        <form action={duplicateQuote.bind(null, quote.id)}>
                          <button type="submit" title={T.duplicate} className="p-1.5 text-gray-300 hover:text-indigo-500 transition-colors rounded-lg hover:bg-indigo-50">
                            <Copy className="h-4 w-4" />
                          </button>
                        </form>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Desktop table */}
            <table className="hidden sm:table w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="px-4 py-3 w-10">
                    <input
                      type="checkbox"
                      checked={allSelected}
                      onChange={toggleAll}
                      className="h-4 w-4 rounded border-gray-300 accent-indigo-600"
                    />
                  </th>
                  <th className="text-right px-5 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">{T.quote_title}</th>
                  <th className="text-right px-5 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">{T.client}</th>
                  <th className="text-right px-5 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">{T.quote_number}</th>
                  <th className="text-right px-5 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">{T.quote_date}</th>
                  <th className="text-right px-5 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">{T.quote_status}</th>
                  <th className="w-10" />
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {quotes.map((quote) => {
                  const statusInfo = STATUS_LABELS[quote.status]
                  const href = `/dashboard/quotes/${quote.id}`
                  const isSelected = selected.has(quote.id)
                  return (
                    <tr key={quote.id} className={`hover:bg-gray-50 transition-colors cursor-pointer ${isSelected ? 'bg-indigo-50/60' : ''}`}>
                      <td className="px-4 py-0">
                        <div className="py-3.5">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => toggleOne(quote.id)}
                            className="h-4 w-4 rounded border-gray-300 accent-indigo-600"
                          />
                        </div>
                      </td>
                      <td className="px-5 py-0">
                        <Link href={href} className="block py-3.5 font-medium text-gray-900">{quote.title}</Link>
                      </td>
                      <td className="px-5 py-0">
                        <Link href={href} className="block py-3.5 text-gray-600">{(quote as any).client?.name || '-'}</Link>
                      </td>
                      <td className="px-5 py-0">
                        <Link href={href} className="block py-3.5 text-gray-500 font-mono text-xs">{quote.number}</Link>
                      </td>
                      <td className="px-5 py-0">
                        <Link href={href} className="block py-3.5 text-gray-500">{format(new Date(quote.created_at), 'dd/MM/yyyy')}</Link>
                      </td>
                      <td className="px-5 py-0">
                        <Link href={href} className="block py-3.5">
                          <Badge className={statusInfo.color}>{statusInfo[lang]}</Badge>
                        </Link>
                      </td>
                      <td className="px-2 py-0">
                        {tab === 'active' && (
                          <form action={duplicateQuote.bind(null, quote.id)}>
                            <button type="submit" title={T.duplicate} className="p-2 text-gray-300 hover:text-indigo-500 transition-colors rounded-lg hover:bg-indigo-50">
                              <Copy className="h-4 w-4" />
                            </button>
                          </form>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </CardContent>
        </Card>
      )}
    </>
  )
}
