import * as React from 'react'
import { cn } from '@/lib/utils'

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: string
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, error, ...props }, ref) => {
    return (
      <div className="w-full">
        <input
          type={type}
          className={cn(
            'flex h-9 w-full rounded-lg border border-border bg-white px-3 py-1 text-sm text-ink placeholder:text-muted/60 transition-colors focus:border-saffron focus:outline-none focus:ring-2 focus:ring-saffron/15 disabled:cursor-not-allowed disabled:opacity-50 disabled:bg-surface',
            error && 'border-danger focus:border-danger focus:ring-danger/15',
            className
          )}
          ref={ref}
          {...props}
        />
        {error && <p className="mt-1 text-xs text-danger">{error}</p>}
      </div>
    )
  }
)
Input.displayName = 'Input'

export { Input }
