
import React from 'react';
import { StudioTab } from '../types';

interface SidebarProps {
  activeTab: StudioTab;
  setActiveTab: (tab: StudioTab) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ activeTab, setActiveTab }) => {
  const tabs = [
    { id: StudioTab.CHAT, icon: 'M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z', label: 'Chat' },
    { id: StudioTab.VISION, icon: 'M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z', label: 'Vision' },
    { id: StudioTab.MOTION, icon: 'M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z', label: 'Motion' },
    { id: StudioTab.VOICE, icon: 'M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z', label: 'Voice' },
  ];

  return (
    <div className="w-20 md:w-64 h-full glass flex flex-col items-center md:items-stretch py-6 px-4 gap-8">
      <div className="flex items-center gap-3 px-2 mb-4">
        <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-500/30">
          <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
        </div>
        <span className="text-xl font-bold hidden md:block tracking-tight">Arman</span>
      </div>

      <nav className="flex flex-col gap-2">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-3 p-3 rounded-xl transition-all duration-200 group ${
              activeTab === tab.id 
                ? 'bg-indigo-600/20 text-indigo-400 ring-1 ring-indigo-500/50' 
                : 'text-slate-400 hover:bg-slate-800 hover:text-slate-100'
            }`}
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={tab.icon} />
            </svg>
            <span className="font-medium hidden md:block">{tab.label}</span>
          </button>
        ))}
      </nav>

      <div className="mt-auto hidden md:block px-2">
        <div className="p-4 rounded-xl bg-slate-800/50 border border-slate-700">
          <p className="text-xs text-slate-400 mb-2 uppercase tracking-widest font-bold">Arman Sol.</p>
          <p className="text-sm font-medium text-slate-200">Smart Operations</p>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;