'use client'

import { Button } from '@/components/ui/button'
import { Printer } from 'lucide-react'

export default function PrintButton() {
  return (
    <Button variant="outline" onClick={() => window.print()}>
      <Printer className="h-4 w-4" />
      הדפס / PDF
    </Button>
  )
}
