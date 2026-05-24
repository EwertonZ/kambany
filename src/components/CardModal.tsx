"use client";

import { Card, CardType, cardTypeColors } from "@/types/kanban";
import { useKanban } from "@/context/KanbanContext";
import { useTheme } from "@/context/ThemeContext";
import { useEffect, useState } from "react";
import { X, Trash2, MessageSquare } from "lucide-react";
import { format } from "date-fns";

const CARD_TYPES: CardType[] = ["EPIC", "HISTORY", "TASK"];

export default function CardModal({ card, columnId, onClose, onCardClick }: { card: Card; columnId: string; onClose: () => void; onCardClick?: (card: Card, colId: string) => void }) {
  const { activeBoard, updateCard, deleteCard, addComment, deleteComment } = useKanban();
  const { isDark } = useTheme();
  const [comment, setComment] = useState("");
  const [selectedType, setSelectedType] = useState<CardType>(card.type);
  const [selectedParentId, setSelectedParentId] = useState<string>(card.parentId || "");
  const [title, setTitle] = useState<string>(card.title);
  const [description, setDescription] = useState<string>(card.description || "");

  const currentCard = activeBoard?.columns
    .find((col) => col.id === columnId)
    ?.cards.find((c) => c.id === card.id) || card;

  useEffect(() => {
    setSelectedType(currentCard.type);
    setSelectedParentId(currentCard.parentId ?? "");
    setTitle(currentCard.title);
    setDescription(currentCard.description || "");
    setComment("");
  }, [card.id, currentCard.id, currentCard.type, currentCard.parentId, currentCard.title, currentCard.description]);

  const epicParents = activeBoard?.columns.flatMap((col) => col.cards.filter((c) => c.type === "EPIC" && c.id !== currentCard.id)) ?? [];
  const historyParents = activeBoard?.columns.flatMap((col) => col.cards.filter((c) => c.type === "HISTORY" && c.id !== currentCard.id)) ?? [];

  const parentOptions = selectedType === "HISTORY" ? epicParents : selectedType === "TASK" ? historyParents : [];

  const childCards = currentCard.type === "EPIC" 
    ? activeBoard?.columns.flatMap((col) => col.cards.filter((c) => c.type === "HISTORY" && c.parentId === currentCard.id)) ?? []
    : currentCard.type === "HISTORY"
    ? activeBoard?.columns.flatMap((col) => col.cards.filter((c) => c.type === "TASK" && c.parentId === currentCard.id)) ?? []
    : [];

  const parentCard = currentCard.parentId
    ? activeBoard?.columns.flatMap((col) => col.cards).find((c) => c.id === currentCard.parentId) ?? null
    : null;

  const parentColumnId = currentCard.parentId
    ? activeBoard?.columns.find((col) => col.cards.some((c) => c.id === currentCard.parentId))?.id
    : undefined;

  const handleSave = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const type = formData.get("type") as CardType;
    const parentId = type === "EPIC" ? null : (formData.get("parentId") as string) || null;

    updateCard(columnId, currentCard.id, {
      title,
      description,
      type,
      parentId,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className={`rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto flex flex-col transition-colors ${isDark ? "bg-slate-800" : "bg-white"}`}>
        <div className={`flex justify-between items-center p-6 border-b transition-colors ${isDark ? "border-slate-700" : "border-slate-100"}`}>
          <h2 className={`text-xl font-semibold ${isDark ? "text-slate-100" : "text-slate-800"}`}>Editar Tarefa</h2>
          <button onClick={onClose} className={`p-2 rounded-full transition-colors ${isDark ? "hover:bg-slate-700 text-slate-400" : "hover:bg-slate-100 text-slate-500"}`}>
            <X size={20} />
          </button>
        </div>

        <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="col-span-2 space-y-6">
            <form id="card-form" onSubmit={handleSave} className="space-y-4">
              <div>
                <label className={`block text-sm font-medium mb-1 ${isDark ? "text-slate-200" : "text-slate-900"}`}>Título</label>
                <input name="title" value={title} onChange={(e) => setTitle(e.target.value)} autoFocus
                  className={`w-full px-4 py-2 rounded-lg border focus:ring-2 outline-none transition-all ${isDark ? "bg-slate-700 text-slate-100 border-slate-600 focus:border-blue-500 focus:ring-blue-900" : "bg-white text-slate-900 border-slate-200 focus:border-blue-500 focus:ring-blue-100"}`} />
              </div>
              <div>
                <label className={`block text-sm font-medium mb-1 ${isDark ? "text-slate-200" : "text-slate-900"}`}>Tipo</label>
                <select name="type" value={selectedType} onChange={(e) => {
                  const value = e.target.value as CardType;
                  setSelectedType(value);
                  setSelectedParentId("");
                }}
                  className={`w-full px-4 py-2 rounded-lg border focus:ring-2 outline-none transition-all ${isDark ? "bg-slate-700 text-slate-100 border-slate-600 focus:border-blue-500 focus:ring-blue-900" : "bg-white text-slate-900 border-slate-200 focus:border-blue-500 focus:ring-blue-100"}`}>
                  {CARD_TYPES.map(type => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </select>
              </div>
              {selectedType !== "EPIC" && (
                <div>
                  <label className={`block text-sm font-medium mb-1 ${isDark ? "text-slate-200" : "text-slate-900"}`}>
                    {selectedType === "HISTORY" ? "Epic pai" : "History pai"}
                  </label>
                  <select name="parentId" value={selectedParentId} onChange={(e) => setSelectedParentId(e.target.value)}
                    className={`w-full px-4 py-2 rounded-lg border focus:ring-2 outline-none transition-all ${isDark ? "bg-slate-700 text-slate-100 border-slate-600 focus:border-blue-500 focus:ring-blue-900" : "bg-white text-slate-900 border-slate-200 focus:border-blue-500 focus:ring-blue-100"}`}>
                    <option value="">Sem parent</option>
                    {parentOptions.map((parent) => (
                      <option key={parent.id} value={parent.id}>{parent.title}</option>
                    ))}
                  </select>
                </div>
              )}
              <div>
                <label className={`block text-sm font-medium mb-1 ${isDark ? "text-slate-200" : "text-slate-900"}`}>Descrição</label>
                <textarea name="description" value={description} onChange={(e) => setDescription(e.target.value)} rows={4}
                  className={`w-full px-4 py-2 rounded-lg border focus:ring-2 outline-none transition-all resize-none ${isDark ? "bg-slate-700 text-slate-100 border-slate-600 focus:border-blue-500 focus:ring-blue-900" : "bg-white text-slate-900 border-slate-200 focus:border-blue-500 focus:ring-blue-100"}`} />
              </div>
            </form>

            <div className={`pt-6 border-t transition-colors ${isDark ? "border-slate-700" : "border-slate-100"}`}>
              <div className={`flex items-center gap-2 mb-4 ${isDark ? "text-slate-100" : "text-slate-900"}`}>
                <MessageSquare size={18} />
                <h3 className={`font-medium ${isDark ? "text-slate-100" : "text-slate-900"}`}>Comentários</h3>
              </div>
              <div className="space-y-3 mb-4">
                {currentCard.comments.map(c => (
                  <div key={c.id} className={`p-3 rounded-lg flex justify-between items-start group transition-colors ${isDark ? "bg-slate-700" : "bg-slate-50"}`}>
                    <div>
                      <p className={`text-sm ${isDark ? "text-slate-200" : "text-slate-900"}`}>{c.text}</p>
                      <span className={`text-xs mt-1 block ${isDark ? "text-slate-500" : "text-slate-400"}`}>{format(c.createdAt, "dd/MM/yyyy HH:mm")}</span>
                    </div>
                    <button onClick={() => deleteComment(columnId, currentCard.id, c.id)} className="text-slate-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
              </div>
              <div className="flex gap-2">
                <input value={comment} onChange={e => setComment(e.target.value)} placeholder="Adicione um comentário..."
                  className={`flex-1 px-4 py-2 text-sm rounded-lg border outline-none transition-all ${isDark ? "bg-slate-700 text-slate-100 border-slate-600 focus:border-blue-500" : "bg-white text-slate-900 border-slate-200 focus:border-blue-500"}`} />
                <button onClick={() => { if(comment.trim()){ addComment(columnId, card.id, comment); setComment(""); } }}
                  className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${isDark ? "bg-blue-600 text-white hover:bg-blue-700" : "bg-slate-800 text-white hover:bg-slate-700"}`}>
                  Enviar
                </button>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className={`p-4 rounded-xl transition-colors ${isDark ? "bg-slate-700" : "bg-slate-50"}`}>
              <p className={`text-xs mb-1 ${isDark ? "text-slate-400" : "text-slate-500"}`}>Criado em</p>
              <p className={`text-sm font-medium ${isDark ? "text-slate-100" : "text-slate-900"}`}>{format(card.createdAt, "dd/MM/yyyy")}</p>
            </div>
            <button form="card-form" type="submit" className="w-full py-2.5 bg-blue-600 text-white font-medium rounded-xl hover:bg-blue-700 transition-colors">
              Salvar Alterações
            </button>
            <button onClick={() => { if(confirm("Tem certeza que deseja excluir este card?")){ deleteCard(columnId, card.id); onClose(); } }}
              className={`w-full py-2.5 font-medium rounded-xl transition-colors flex justify-center items-center gap-2 ${isDark ? "bg-red-900/30 text-red-400 hover:bg-red-900/50" : "bg-red-50 text-red-600 hover:bg-red-100"}`}>
              <Trash2 size={16} /> Excluir Card
            </button>
            {parentCard && parentColumnId ? (
              <div className={`pt-6 border-t transition-colors ${isDark ? "border-slate-700" : "border-slate-100"}`}>
                <h3 className={`font-medium mb-4 ${isDark ? "text-slate-100" : "text-slate-900"}`}>Card pai</h3>
                <button
                  onClick={() => {
                    onClose();
                    onCardClick?.(parentCard, parentColumnId);
                  }}
                  className={`w-full text-left p-3 rounded-lg border-l-4 transition-all hover:shadow-md ${isDark ? "bg-slate-700 hover:bg-slate-600 border border-slate-600" : "bg-slate-50 hover:bg-slate-100 border border-slate-200"}`}
                  style={{ borderLeftColor: cardTypeColors[parentCard.type] }}
                >
                  <p className={`text-sm font-medium ${isDark ? "text-slate-100" : "text-slate-800"}`}>{parentCard.title}</p>
                  {parentCard.description && <p className={`text-xs mt-1 ${isDark ? "text-slate-400" : "text-slate-500"}`}>{parentCard.description}</p>}
                </button>
              </div>
            ) : null}
            <div className={`pt-6 border-t transition-colors ${isDark ? "border-slate-700" : "border-slate-100"}`}>
              <h3 className={`font-medium mb-4 ${isDark ? "text-slate-100" : "text-slate-900"}`}>
                {currentCard.type === "EPIC" ? "Historias" : "Tarefas"} ({childCards.length})
              </h3>
              {childCards.length > 0 ? (
                <div className="space-y-2">
                  {childCards.map((child) => {
                    const childColumnId = activeBoard?.columns.find(col => col.cards.some(c => c.id === child.id))?.id || columnId;
                    return (
                      <button
                        key={child.id}
                        onClick={() => {
                          onClose();
                          onCardClick?.(child, childColumnId);
                        }}
                        className={`w-full text-left p-3 rounded-lg border-l-4 transition-all hover:shadow-md ${isDark ? "bg-slate-700 hover:bg-slate-600 border border-slate-600" : "bg-slate-50 hover:bg-slate-100 border border-slate-200"}`}
                        style={{ borderLeftColor: cardTypeColors[child.type] }}
                      >
                        <p className={`text-sm font-medium ${isDark ? "text-slate-100" : "text-slate-800"}`}>{child.title}</p>
                        {child.description && <p className={`text-xs mt-1 ${isDark ? "text-slate-400" : "text-slate-500"}`}>{child.description}</p>}
                      </button>
                    );
                  })}
                </div>
              ) : (
                <p className={`text-sm ${isDark ? "text-slate-500" : "text-slate-400"}`}>Nenhum {currentCard.type === "EPIC" ? "historia" : "tarefa"} associado.</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}