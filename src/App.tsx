// src/App.tsx
import { Link } from 'react-router-dom' // falls schon vorhanden: lassen

export default function App() {
  return (
    <div className="p-6 space-y-4">
      <header className="flex gap-4">
        <Link to="/" className="underline">Home</Link>
        <Link to="/feed" className="underline">Feed</Link>
      </header>

      {/* …bestehender Inhalt bleibt … */}
    </div>
  )
}