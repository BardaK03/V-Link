export function FeedSkeleton() {
  return (
    <div className="space-y-4">
      {Array.from({ length: 5 }).map((_, i) => (
        <div
          key={i}
          className="rounded-xl p-5 animate-pulse"
          style={{
            backgroundColor: 'var(--vl-surface)',
            border: '1px solid var(--vl-border)',
            borderRadius: 'var(--vl-radius-lg)',
          }}
        >
          <div className="flex items-center gap-2 mb-3">
            <div
              className="rounded-full"
              style={{ width: 28, height: 28, background: 'var(--vl-border)' }}
            />
            <div
              className="rounded"
              style={{ width: 100, height: 12, background: 'var(--vl-border)' }}
            />
          </div>
          <div className="flex justify-between gap-4">
            <div className="flex-1 space-y-2">
              <div
                className="rounded"
                style={{ width: '60%', height: 16, background: 'var(--vl-border)' }}
              />
              <div
                className="rounded"
                style={{ width: '40%', height: 12, background: 'var(--vl-border)' }}
              />
              <div
                className="rounded"
                style={{ width: '30%', height: 12, background: 'var(--vl-border)' }}
              />
            </div>
            <div
              className="rounded"
              style={{ width: 52, height: 40, background: 'var(--vl-border)' }}
            />
          </div>
          <div className="mt-3 flex gap-2">
            <div
              className="rounded-full"
              style={{ width: 80, height: 22, background: 'var(--vl-border)' }}
            />
            <div
              className="rounded-full"
              style={{ width: 100, height: 22, background: 'var(--vl-border)' }}
            />
          </div>
        </div>
      ))}
    </div>
  )
}
