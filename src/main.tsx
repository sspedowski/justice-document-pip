import { createRoot } from 'react-dom/client'
import { ErrorBoundary } from "react-error-boundary";
import { Toaster } from 'sonner'

// Initialize Spark fallback before importing components  
import '@/lib/sparkFallback'

import App from './App.tsx'
import { ErrorFallback } from './ErrorFallback.tsx'

// Import CSS files
import "./main.css"
import "./styles/theme.css"
import "./index.css"

createRoot(document.getElementById('root')!).render(
  <ErrorBoundary FallbackComponent={ErrorFallback}>
    <App />
    <Toaster />
   </ErrorBoundary>
)
