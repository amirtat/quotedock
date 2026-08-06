'use client'

import { Button } from '@/components/ui/button'
import { Printer } from 'lucide-react'

export default function PrintButton() {
  function handlePrint() {
    const doc = document.querySelector('.print-doc')
    if (!doc) return window.print()

    const styles = [...document.querySelectorAll('link[rel="stylesheet"], style')]
      .map(el => el.outerHTML)
      .join('\n')

    const win = window.open('', '_blank', 'width=900,height=700')
    if (!win) return window.print()

    win.document.write(`<!DOCTYPE html>
<html dir="rtl" lang="he">
<head>
  <meta charset="UTF-8">
  ${styles}
  <style>body { background: white; margin: 0; padding: 15mm; } @page { margin: 15mm; size: A4; }</style>
</head>
<body>${doc.outerHTML}</body>
</html>`)
    win.document.close()
    setTimeout(() => { win.focus(); win.print(); win.close() }, 300)
  }

  return (
    <Button variant="outline" onClick={handlePrint}>
      <Printer className="h-4 w-4" />
      הדפס / PDF
    </Button>
  )
}
