import React, { useState } from 'react';
import AdminView from './views/AdminView';
import FrontendView from './views/FrontendView';
import { Settings, Monitor } from 'lucide-react';

export default function App() {
  const [view, setView] = useState<'frontend' | 'admin'>('frontend');

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col font-sans">
      {/* Dev Mode Toolbar - only to toggle views in this preview */}
      <div className="bg-slate-900 text-white p-2 flex justify-center items-center gap-4 text-sm font-medium z-50 shadow-md sticky top-0">
        <span className="text-slate-400 mr-4 font-bold text-xs uppercase tracking-wider">Modo Previsualização:</span>
        <button 
          onClick={() => setView('frontend')}
          className={`flex items-center gap-2 px-3 py-1.5 rounded transition-colors ${view === 'frontend' ? 'bg-blue-600 text-white shadow-inner' : 'hover:bg-slate-800 text-slate-300'}`}
        >
          <Monitor className="w-4 h-4" />
          Visão do Cliente (Shortcode no site)
        </button>
        <button 
          onClick={() => setView('admin')}
          className={`flex items-center gap-2 px-3 py-1.5 rounded transition-colors ${view === 'admin' ? 'bg-orange-600 text-white shadow-inner' : 'hover:bg-slate-800 text-slate-300'}`}
        >
          <Settings className="w-4 h-4" />
          Painel de Administração (WP-Admin)
        </button>
      </div>

      <div className="flex-1 overflow-auto">
        {view === 'admin' ? <AdminView /> : <FrontendView />}
      </div>
    </div>
  );
}
