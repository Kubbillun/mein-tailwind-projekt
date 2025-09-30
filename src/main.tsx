// ~/Projects/quickstart-crew/src/main.tsx
import React from 'react'
import ReactDOM from 'react-dom/client'
import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import App from './App'
import FeedPage from './app/feed/page'

const router = createBrowserRouter([
  { path: '/', element: <App /> },
  { path: '/feed', element: <FeedPage /> },
])

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <RouterProvider router={router} />
  </React.StrictMode>,
)