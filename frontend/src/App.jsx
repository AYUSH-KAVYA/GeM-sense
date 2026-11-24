import { useEffect } from 'react';
import { BrowserRouter, HashRouter, Routes, Route, useNavigate } from 'react-router-dom';
import Navbar from './components/Navbar.jsx';
import Footer from './components/Footer.jsx';
import Home from './pages/Home.jsx';
import Results from './pages/Results.jsx';

// Use HashRouter for Electron's file:// protocol to avoid blank page route errors,
// while retaining BrowserRouter on web/Vercel deployments.
const isFileProtocol = typeof window !== 'undefined' && window.location.protocol === 'file:';
const Router = isFileProtocol ? HashRouter : BrowserRouter;

/**
 * Listens for OS-level search requests dispatched from Electron's main process
 * (via global hotkey CommandOrControl+Shift+G, system tray, or clipboard watcher).
 */
function DesktopSearchListener() {
  const navigate = useNavigate();

  useEffect(() => {
    if (typeof window !== 'undefined' && window.electronAPI?.onTriggerSearch) {
      const unsubscribe = window.electronAPI.onTriggerSearch((query) => {
        if (query) {
          navigate(`/results?q=${encodeURIComponent(query)}`);
        }
      });

      return () => {
        if (typeof unsubscribe === 'function') {
          unsubscribe();
        }
      };
    }
  }, [navigate]);

  return null;
}

export default function App() {
  return (
    <Router>
      <DesktopSearchListener />
      <div className="min-h-screen flex flex-col bg-slate-50 text-slate-800 font-sans">
        <Navbar />

        <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/results" element={<Results />} />
          </Routes>
        </main>

        <Footer />
      </div>
    </Router>
  );
}
