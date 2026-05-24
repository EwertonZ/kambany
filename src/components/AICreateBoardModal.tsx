"use client";

import { useState } from "react";
import { useTheme } from "@/context/ThemeContext";
import { useKanban } from "@/context/KanbanContext";
import { generateBoard } from "@/lib/googleAI";
import { toast } from "sonner";

export default function AICreateBoardModal({ onClose }: { onClose: () => void }) {
  const { isDark } = useTheme();
  const { createBoardFromTemplate } = useKanban() as any;
  const [prompt, setPrompt] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);

  const hasKey = typeof window !== "undefined" && !!localStorage.getItem("google-ai-key");

  const handleGenerate = async () => {
    if (!prompt.trim()) return toast.error("Escreva um prompt para gerar o board.");
    if (!hasKey) return toast.error("Insira a Google AI API Key em Settings antes.");

    setLoading(true);
    try {
      const template = await generateBoard(prompt);
      const boardName = name.trim() || `IA Board`;
      await createBoardFromTemplate(boardName, template);
      onClose();
    } catch (err: any) {
      console.error(err);
      toast.error(err?.message || "Erro ao gerar board com IA.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className={`rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto flex flex-col transition-colors ${isDark ? "bg-slate-800" : "bg-white"}`}>
        <div className={`flex justify-between items-center p-6 border-b transition-colors ${isDark ? "border-slate-700" : "border-slate-100"}`}>
          <h2 className={`text-xl font-semibold ${isDark ? "text-slate-100" : "text-slate-800"}`}>Gerar Board com IA</h2>
          <button onClick={onClose} className={`p-2 rounded-full transition-colors ${isDark ? "hover:bg-slate-700 text-slate-400" : "hover:bg-slate-100 text-slate-500"}`}>✕</button>
        </div>

        <div className="p-6 space-y-4">
          <div>
            <label className={`block text-sm font-medium mb-1 ${isDark ? "text-slate-200" : "text-slate-900"}`}>Nome do board (opcional)</label>
            <input value={name} onChange={e => setName(e.target.value)} placeholder="Nome do novo board"
              className={`w-full px-4 py-2 rounded-lg border focus:ring-2 outline-none transition-all ${isDark ? "bg-slate-700 text-slate-100 border-slate-600 focus:border-blue-500 focus:ring-blue-900" : "bg-white text-slate-900 border-slate-200 focus:border-blue-500 focus:ring-blue-100"}`} />
          </div>

          <div>
            <label className={`block text-sm font-medium mb-1 ${isDark ? "text-slate-200" : "text-slate-900"}`}>Descreva o projeto / produto</label>
            <textarea value={prompt} onChange={e => setPrompt(e.target.value)} rows={6} placeholder="Ex: Aplicativo de entregas ... crie epics, histórias e tarefas"
              className={`w-full px-4 py-2 rounded-lg border focus:ring-2 outline-none transition-all resize-none ${isDark ? "bg-slate-700 text-slate-100 border-slate-600 focus:border-blue-500 focus:ring-blue-900" : "bg-white text-slate-900 border-slate-200 focus:border-blue-500 focus:ring-blue-100"}`} />
          </div>

          <div className="flex gap-2 justify-end">
            <button onClick={onClose} className={`px-4 py-2 rounded-lg transition-colors ${isDark ? "text-slate-300 hover:bg-slate-700" : "text-slate-500 hover:bg-slate-100"}`}>Cancelar</button>
            <button onClick={handleGenerate} disabled={loading} className="px-4 py-2 rounded-lg bg-green-600 text-white hover:bg-green-700 disabled:opacity-60">{loading ? 'Gerando...' : 'Gerar com IA'}</button>
          </div>
        </div>
      </div>
    </div>
  );
}
