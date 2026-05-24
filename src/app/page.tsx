"use client";

import { useKanban } from "@/context/KanbanContext";
import { useTheme } from "@/context/ThemeContext";
import KanbanBoard from "@/components/KanbanBoard";
import { LayoutDashboard, Download, Upload, Plus, Trash2, Moon, Sun } from "lucide-react";
import { useState, useRef } from "react";
import AICreateBoardModal from "../components/AICreateBoardModal";
import SettingsModal from "../components/SettingsModal";

export default function Home() {
  const { state, activeBoard, setActiveBoard, createBoard, deleteBoard, exportData, importData } = useKanban();
  const { isDark, toggleTheme } = useTheme();
  const [newBoardName, setNewBoardName] = useState("");
  const [showAIModal, setShowAIModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  return (
    <main className="flex h-screen w-full">
      {/* Sidebar */}
      <aside className={`w-64 flex flex-col h-full shrink-0 transition-colors ${isDark ? "bg-slate-950 text-slate-300 border-r border-slate-800" : "bg-slate-900 text-slate-300 border-r border-slate-800"}`}>
        <div className="p-6">
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            <LayoutDashboard size={24} className="text-blue-500" /> Kanbany
          </h1>
        </div>

        <div className="px-4 py-2">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-4 px-2">Meus Boards</p>
          <div className="space-y-1">
            {state.boards.map((board) => (
              <div key={board.id} className={`flex items-center justify-between rounded-lg px-3 py-2 cursor-pointer group transition-colors ${activeBoard?.id === board.id ? "bg-blue-600 text-white" : "hover:bg-slate-800"}`} onClick={() => setActiveBoard(board.id)}>
                <span className="truncate text-sm font-medium">{board.name}</span>
                {state.boards.length > 1 && (
                  <button onClick={(e) => { e.stopPropagation(); if(confirm("Excluir board?")) deleteBoard(board.id); }} className="opacity-0 group-hover:opacity-100 hover:text-red-400 transition-opacity">
                    <Trash2 size={14} />
                  </button>
                )}
              </div>
            ))}
          </div>

          <div className="mt-4 px-2 flex gap-2">
            <input value={newBoardName} onChange={e => setNewBoardName(e.target.value)} placeholder="Novo board..."
              className={`w-full text-sm px-3 py-2 rounded-lg outline-none border transition-colors ${isDark ? "bg-slate-800 text-white border-slate-700 focus:border-blue-500" : "bg-slate-800 text-white border-slate-700 focus:border-blue-500"}`}
              onKeyDown={e => { if(e.key === "Enter" && newBoardName) { createBoard(newBoardName); setNewBoardName(""); } }} />
            <div className="flex items-center gap-2">
              <button onClick={() => { if(newBoardName) { createBoard(newBoardName); setNewBoardName(""); } }} className="bg-blue-600 p-2 rounded-lg text-white hover:bg-blue-700">
                <Plus size={24} />
              </button>
              <button title="Gerar com I.A" onClick={() => setShowAIModal(true)} className="bg-green-600 p-2 rounded-lg text-white hover:bg-green-700 flex items-center justify-center">
                I.A
              </button>
            </div>
          </div>
        </div>

        <div className="mt-auto p-6 space-y-3">
          <button onClick={toggleTheme} className={`w-full flex items-center justify-center gap-2 text-sm py-2.5 rounded-xl transition-colors ${isDark ? "bg-slate-800 hover:bg-slate-700" : "bg-slate-800 hover:bg-slate-700"}`}>
            {isDark ? <Sun size={16} /> : <Moon size={16} />} {isDark ? "Modo Claro" : "Modo Escuro"}
          </button>
          <button onClick={() => setShowSettingsModal(true)} className={`w-full flex items-center justify-center gap-2 text-sm py-2.5 rounded-xl transition-colors ${isDark ? "bg-slate-800 hover:bg-slate-700" : "bg-slate-800 hover:bg-slate-700"}`}>
            Google AI API-KEY
          </button>
          <button onClick={exportData} className={`w-full flex items-center justify-center gap-2 text-sm py-2.5 rounded-xl transition-colors ${isDark ? "bg-slate-800 hover:bg-slate-700" : "bg-slate-800 hover:bg-slate-700"}`}>
            <Download size={16} /> Exportar Backup
          </button>
          <button onClick={() => fileInputRef.current?.click()} className={`w-full flex items-center justify-center gap-2 text-sm py-2.5 rounded-xl transition-colors ${isDark ? "bg-slate-800 hover:bg-slate-700" : "bg-slate-800 hover:bg-slate-700"}`}>
            <Upload size={16} /> Importar Backup
          </button>
          <input type="file" accept=".json" className="hidden" ref={fileInputRef} onChange={e => { const file = e.target.files?.[0]; if(file) { importData(file); e.target.value = ''; } }} />
        </div>
      </aside>

      {showAIModal && <AICreateBoardModal onClose={() => setShowAIModal(false)} />}
      {showSettingsModal && <SettingsModal onClose={() => setShowSettingsModal(false)} />}

      {/* Main Área */}
      <section className={`flex-1 flex flex-col min-w-0 transition-colors ${isDark ? "bg-slate-900" : "bg-slate-50"}`}>
        <header className={`h-16 flex items-center px-8 shadow-sm z-10 shrink-0 transition-colors ${isDark ? "bg-slate-800 border-b border-slate-700" : "bg-white border-b border-slate-200"}`}>
          <h2 className={`text-lg font-bold ${isDark ? "text-slate-50" : "text-slate-800"}`}>{activeBoard?.name || "Nenhum Board Selecionado"}</h2>
        </header>
        <KanbanBoard />
      </section>
    </main>
  );
}