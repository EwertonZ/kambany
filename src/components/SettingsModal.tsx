"use client";

import { useEffect, useState } from "react";
import { useTheme } from "@/context/ThemeContext";
import { toast } from "sonner";

export default function SettingsModal({ onClose }: { onClose: () => void }) {
  const { isDark } = useTheme();
  const [key, setKey] = useState("");

  useEffect(() => {
    if (typeof window !== "undefined") {
      setKey(localStorage.getItem("google-ai-key") || "");
    }
  }, []);

  const save = () => {
    if (typeof window === "undefined") return;
    localStorage.setItem("google-ai-key", key);
    toast.success("API Key salva");
    onClose();
  };

  const clear = () => {
    if (typeof window === "undefined") return;
    localStorage.removeItem("google-ai-key");
    setKey("");
    toast.success("API Key removida");
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className={`rounded-2xl shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto flex flex-col transition-colors ${isDark ? "bg-slate-800" : "bg-white"}`}>
        <div className={`flex justify-between items-center p-6 border-b transition-colors ${isDark ? "border-slate-700" : "border-slate-100"}`}>
          <h2 className={`text-lg font-semibold ${isDark ? "text-slate-100" : "text-slate-800"}`}>Settings - Google AI</h2>
          <button onClick={onClose} className={`p-2 rounded-full transition-colors ${isDark ? "hover:bg-slate-700 text-slate-400" : "hover:bg-slate-100 text-slate-500"}`}>✕</button>
        </div>

        <div className="p-6 space-y-4">
          <div>
            <label className={`block text-sm font-medium mb-1 ${isDark ? "text-slate-200" : "text-slate-900"}`}>Google AI API Key</label>
            <input value={key} type="password" onChange={e => setKey(e.target.value)} placeholder="Insira sua API Key"
              className={`w-full px-4 py-2 rounded-lg border focus:ring-2 outline-none transition-all ${isDark ? "bg-slate-700 text-slate-100 border-slate-600 focus:border-blue-500 focus:ring-blue-900" : "bg-white text-slate-900 border-slate-200 focus:border-blue-500 focus:ring-blue-100"}`} />
            <p className={`text-xs mt-2 ${isDark ? "text-slate-400" : "text-slate-500"}`}>A chave é salva apenas localmente no seu navegador.</p>
            <div className="mt-3">
              <a href="https://aistudio.google.com/" target="_blank" rel="noreferrer" className="w-full block text-center px-4 py-2 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700">Cria sua API KEY</a>
            </div>
          </div>

          <div className="flex gap-2 justify-end">
            <button onClick={clear} className={`px-4 py-2 rounded-lg transition-colors ${isDark ? "text-slate-300 hover:bg-slate-700" : "text-slate-500 hover:bg-slate-100"}`}>Limpar</button>
            <button onClick={save} className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700">Salvar</button>
          </div>
        </div>
      </div>
    </div>
  );
}
