// src/app/feed/page.tsx
import ErrorBanner from '../../components/ErrorBanner'

{err && (
  <ErrorBanner
    message={err}
    onRetry={loadFirst}
    className="mt-2"
  />
)}