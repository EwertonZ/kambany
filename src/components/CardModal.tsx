"use client";

import { Card } from "@/types/kanban";
import { useKanban } from "@/context/KanbanContext";
import { useState } from "react";
import { X, Trash2, MessageSquare } from "lucide-react";
import { format } from "date-fns";

export default function CardModal({ card, columnId, onClose }: { card: Card; columnId: string; onClose: () => void }) {
  const { activeBoard, updateCard, deleteCard, addComment, deleteComment } = useKanban();
  const [comment, setComment] = useState("");

  const currentCard = activeBoard?.columns
    .find((col) => col.id === columnId)
    ?.cards.find((c) => c.id === card.id) || card;

  const handleSave = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    updateCard(columnId, currentCard.id, {
      title: formData.get("title") as string,
      description: formData.get("description") as string,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto flex flex-col">
        <div className="flex justify-between items-center p-6 border-b border-slate-100">
          <h2 className="text-xl font-semibold text-slate-800">Editar Tarefa</h2>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-500">
            <X size={20} />
          </button>
        </div>

        <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="col-span-2 space-y-6">
            <form id="card-form" onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-900 mb-1">Título</label>
                <input name="title" defaultValue={currentCard.title} autoFocus
                  className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all text-slate-900" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-900 mb-1">Descrição</label>
                <textarea name="description" defaultValue={currentCard.description} rows={4}
                  className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all resize-none text-slate-900" />
              </div>
            </form>

            <div className="pt-6 border-t border-slate-100">
              <div className="flex items-center gap-2 mb-4 text-slate-900">
                <MessageSquare size={18} />
                <h3 className="font-medium text-slate-900">Comentários</h3>
              </div>
              <div className="space-y-3 mb-4">
                {currentCard.comments.map(c => (
                  <div key={c.id} className="bg-slate-50 p-3 rounded-lg flex justify-between items-start group">
                    <div>
                      <p className="text-sm text-slate-900">{c.text}</p>
                      <span className="text-xs text-slate-400 mt-1 block">{format(c.createdAt, "dd/MM/yyyy HH:mm")}</span>
                    </div>
                    <button onClick={() => deleteComment(columnId, currentCard.id, c.id)} className="text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
              </div>
              <div className="flex gap-2">
                <input value={comment} onChange={e => setComment(e.target.value)} placeholder="Adicione um comentário..."
                  className="flex-1 px-4 py-2 text-sm rounded-lg border border-slate-200 focus:border-blue-500 outline-none text-slate-900" />
                <button onClick={() => { if(comment.trim()){ addComment(columnId, card.id, comment); setComment(""); } }}
                  className="px-4 py-2 bg-slate-800 text-white text-sm font-medium rounded-lg hover:bg-slate-700 transition-colors">
                  Enviar
                </button>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="bg-slate-50 p-4 rounded-xl">
              <p className="text-xs text-slate-500 mb-1">Criado em</p>
              <p className="text-sm font-medium text-slate-900">{format(card.createdAt, "dd/MM/yyyy")}</p>
            </div>
            <button form="card-form" type="submit" className="w-full py-2.5 bg-blue-600 text-white font-medium rounded-xl hover:bg-blue-700 transition-colors">
              Salvar Alterações
            </button>
            <button onClick={() => { if(confirm("Tem certeza que deseja excluir este card?")){ deleteCard(columnId, card.id); onClose(); } }}
              className="w-full py-2.5 bg-red-50 text-red-600 font-medium rounded-xl hover:bg-red-100 transition-colors flex justify-center items-center gap-2">
              <Trash2 size={16} /> Excluir Card
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}