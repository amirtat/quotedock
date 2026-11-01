'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Copy, Check } from 'lucide-react'
import { useT } from '@/lib/lang-context'

export default function CopyLinkButton({ url }: { url: string }) {
  const T = useT()
  const [copied, setCopied] = useState(false)

  async function handleCopy() {
    const fullUrl = url.startsWith('/') ? `${window.location.origin}${url}` : url
    await navigator.clipboard.writeText(fullUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <Button variant="outline" size="sm" onClick={handleCopy}>
      {copied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
      {copied ? T.copied : T.copy_link}
    </Button>
  )
}
