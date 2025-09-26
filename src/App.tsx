// src/App.tsx
import { BrowserRouter, Routes, Route, Link } from "react-router-dom";
import Home from "./pages/Home";
import Market from "./pages/Market";
import FeedItems from "./pages/FeedItems";
import HealthCheck from "./pages/HealthCheck";
import TestSupabase from "./pages/TestSupabase";
import Todos from "./pages/Todos";
import CardDetail from "./pages/CardDetail";
import Ops from "./pages/Ops";

export default function App() {
  return (
    <BrowserRouter>
      <nav style={{ display: "flex", gap: 12, padding: 12, borderBottom: "1px solid #ddd" }}>
        <Link to="/">Home</Link>
        <Link to="/market">Market</Link>
        <Link to="/feed">Feed</Link>
        <Link to="/health">Health</Link>
        <Link to="/test-supabase">TestSupabase</Link>
        <Link to="/todos">Todos</Link>
        <Link to="/card">Card</Link>
        <Link to="/ops">Ops</Link>
      </nav>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/market" element={<Market />} />
        <Route path="/feed" element={<FeedItems />} />
        <Route path="/health" element={<HealthCheck />} />
        <Route path="/test-supabase" element={<TestSupabase />} />
        <Route path="/todos" element={<Todos />} />
        <Route path="/card" element={<CardDetail />} />
        <Route path="/ops" element={<Ops />} />
      </Routes>
    </BrowserRouter>
  );
}