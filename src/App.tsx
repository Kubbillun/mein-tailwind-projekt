// ~/Projects/quickstart-crew/src/App.tsx
import { Link } from 'react-router-dom'

export default function App() {
  return (
    <main className="mx-auto max-w-3xl p-6 space-y-6">
      <h1 className="text-2xl font-semibold">Quickstart Crew</h1>
      <nav className="space-x-4">
        <Link to="/" className="text-blue-600 underline-offset-2 hover:underline">
          Home
        </Link>
        <Link to="/feed" className="text-blue-600 underline-offset-2 hover:underline">
          Feed
        </Link>
      </nav>
      <p className="text-gray-700 mt-4">
        Willkommen in der Quickstart Crew App. Über das Menü oben kannst du die Feed-Seite öffnen.
      </p>
    </main>
  )
}