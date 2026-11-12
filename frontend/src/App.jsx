
import { Routes, Route, Link } from "react-router-dom";
import Navbar from "./components/Navbar.jsx";
import Results from "./pages/Results.jsx";

function HomePlaceholder() {
  return (
    <main className="min-h-screen flex items-center justify-center p-8">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-ink">
          GeM Compare
        </h1>

        <p className="mt-4 text-slate-500">
          Home page integration pending.
        </p>

        <Link
          to="/results"
          className="inline-block mt-6 rounded-xl bg-navy px-5 py-3 text-white"
        >
          Explore Results
        </Link>
      </div>
    </main>
  );
}

export default function App() {
  return (
    <div className="min-h-screen bg-canvas">
      <Navbar />

      <Routes>
        <Route path="/" element={<HomePlaceholder />} />
        <Route path="/results" element={<Results />} />
      </Routes>
    </div>
  );
}
