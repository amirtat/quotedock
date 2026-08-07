import ReactMarkdown from 'react-markdown'
import remarkBreaks from 'remark-breaks'

const mdComponents = {
  ul: ({ children }: any) => <ul className="list-disc list-inside space-y-0.5">{children}</ul>,
  ol: ({ children }: any) => <ol className="list-decimal list-inside space-y-0.5">{children}</ol>,
  strong: ({ children }: any) => <strong className="font-semibold text-gray-900">{children}</strong>,
  p: ({ children }: any) => <p className="mb-1 last:mb-0">{children}</p>,
}

export function Markdown({ children }: { children: string }) {
  return (
    <div className="text-sm text-gray-700 leading-relaxed">
      <ReactMarkdown remarkPlugins={[remarkBreaks]} components={mdComponents}>
        {children}
      </ReactMarkdown>
    </div>
  )
}
