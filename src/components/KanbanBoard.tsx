"use client";

import { useKanban } from "@/context/KanbanContext";
import { DndContext, DragEndEvent, DragOverlay, DragStartEvent, PointerSensor, useDroppable, useSensor, useSensors } from "@dnd-kit/core";
import { SortableContext, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useState } from "react";
import { Card, Column } from "@/types/kanban";
import { Plus, GripVertical, MessageSquare, X } from "lucide-react";
import CardModal from "./CardModal";

export default function KanbanBoard() {
  const { activeBoard, createColumn, moveCard } = useKanban();
  const [activeCard, setActiveCard] = useState<Card | null>(null);
  const [editingCardInfo, setEditingCardInfo] = useState<{ card: Card, colId: string } | null>(null);
  const [newColTitle, setNewColTitle] = useState("");

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  if (!activeBoard) return <div className="flex-1 flex items-center justify-center text-slate-400">Crie ou selecione um board.</div>;

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    const cardId = active.id as string;
    for (const col of activeBoard.columns) {
      const card = col.cards.find(c => c.id === cardId);
      if (card) { setActiveCard(card); break; }
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveCard(null);
    const { active, over } = event;
    if (!over) return;

    const activeId = active.id as string;
    const overId = over.id as string;

    let sourceColId = "";
    let destColId = "";
    
    // Identificar a origem
    activeBoard.columns.forEach(col => {
      if (col.cards.some(c => c.id === activeId)) sourceColId = col.id;
    });

    // Identificar o destino (pode ser o ID de um card no destino ou da própria coluna)
    activeBoard.columns.forEach(col => {
      if (col.id === overId) destColId = col.id;
      if (col.cards.some(c => c.id === overId)) destColId = col.id;
    });

    if (sourceColId && destColId) {
      const destCol = activeBoard.columns.find(c => c.id === destColId)!;
      const newIndex = destCol.cards.findIndex(c => c.id === overId);
      const finalIndex = newIndex >= 0 ? newIndex : destCol.cards.length;
      moveCard(activeId, sourceColId, destColId, finalIndex);
    }
  };

  return (
    <div className="flex-1 h-full overflow-x-auto p-6 flex gap-6">
      <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
        {activeBoard.columns.map((col) => (
          <ColumnView key={col.id} column={col} onCardClick={(card) => setEditingCardInfo({ card, colId: col.id })} />
        ))}
        <DragOverlay>
          {activeCard ? <CardItem card={activeCard} isOverlay /> : null}
        </DragOverlay>
      </DndContext>

      {/* Nova Coluna */}
      <div className="min-w-[300px] shrink-0">
        <div className="bg-slate-100/50 border border-dashed border-slate-300 rounded-xl p-3 flex gap-2">
          <input value={newColTitle} onChange={e => setNewColTitle(e.target.value)} placeholder="Nova Coluna..."
            className="flex-1 bg-transparent outline-none px-2 text-sm text-slate-900"
            onKeyDown={e => { if(e.key === "Enter" && newColTitle) { createColumn(newColTitle); setNewColTitle(""); } }} />
          <button onClick={() => { if(newColTitle) { createColumn(newColTitle); setNewColTitle(""); } }} className="p-1 text-slate-500 hover:text-slate-800">
            <Plus size={20} />
          </button>
        </div>
      </div>

      {editingCardInfo && (
        <CardModal card={editingCardInfo.card} columnId={editingCardInfo.colId} onClose={() => setEditingCardInfo(null)} />
      )}
    </div>
  );
}

// Sub-componente: Coluna
function ColumnView({ column, onCardClick }: { column: Column, onCardClick: (card: Card) => void }) {
  const { createCard, deleteColumn } = useKanban();
  const [newTitle, setNewTitle] = useState("");
  const [isAdding, setIsAdding] = useState(false);
  const { setNodeRef: setDroppableNodeRef, isOver } = useDroppable({ id: column.id });

  return (
    <div className="flex flex-col bg-slate-100 rounded-2xl w-[320px] shrink-0 max-h-full">
      <div className="p-4 flex justify-between items-center group">
        <h3 className="font-semibold text-slate-900">{column.title} <span className="text-xs font-normal text-slate-400 ml-2">{column.cards.length}</span></h3>
        <button onClick={() => { if(confirm("Excluir coluna?")) deleteColumn(column.id) }} className="text-slate-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity">
          <X size={16} />
        </button>
      </div>

      <div ref={setDroppableNodeRef} className={`flex-1 overflow-y-auto px-3 pb-3 space-y-3 custom-scrollbar ${isOver ? 'bg-slate-200/70' : ''}`}>
        <SortableContext id={column.id} items={column.cards.map(c => c.id)} strategy={verticalListSortingStrategy}>
          {column.cards.map(card => (
            <SortableCard key={card.id} card={card} onClick={() => onCardClick(card)} />
          ))}
        </SortableContext>
        
        {isAdding ? (
          <div className="bg-white p-3 rounded-xl shadow-sm border border-blue-200">
            <input autoFocus value={newTitle} onChange={e => setNewTitle(e.target.value)} placeholder="Título da tarefa..."
              className="w-full text-sm outline-none mb-2 text-slate-900"
              onKeyDown={e => { if(e.key === "Enter" && newTitle) { createCard(column.id, newTitle); setNewTitle(""); setIsAdding(false); } }} />
            <div className="flex gap-2">
              <button onClick={() => { if(newTitle) createCard(column.id, newTitle); setNewTitle(""); setIsAdding(false); }} className="text-xs bg-blue-600 text-white px-3 py-1.5 rounded-lg">Salvar</button>
              <button onClick={() => setIsAdding(false)} className="text-xs text-slate-500 hover:bg-slate-100 px-3 py-1.5 rounded-lg">Cancelar</button>
            </div>
          </div>
        ) : (
          <button onClick={() => setIsAdding(true)} className="w-full py-2.5 flex items-center justify-center gap-2 text-sm font-medium text-slate-500 hover:bg-slate-200/50 hover:ext-slate-900 rounded-xl transition-colors">
            <Plus size={16} /> Adicionar Card
          </button>
        )}
      </div>
    </div>
  );
}

// Sub-componente: Card Sortable
function SortableCard({ card, onClick }: { card: Card, onClick: () => void }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: card.id });
  const style = { transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.4 : 1 };

  return (
    <div ref={setNodeRef} style={style} {...attributes} className="relative group">
      <div {...listeners} className="absolute left-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 cursor-grab active:cursor-grabbing p-1 text-slate-300 hover:text-slate-500 z-10 transition-opacity">
        <GripVertical size={16} />
      </div>
      <div onClick={onClick} className="bg-white p-4 rounded-xl shadow-sm hover:shadow-md border border-slate-100 cursor-pointer pl-8 transition-shadow">
        <h4 className="text-sm font-medium text-slate-800">{card.title}</h4>
        {card.description && <p className="text-xs text-slate-500 mt-1 line-clamp-2">{card.description}</p>}
        {card.comments.length > 0 && (
          <div className="flex items-center gap-1 mt-3 text-xs text-slate-400">
            <MessageSquare size={12} /> {card.comments.length}
          </div>
        )}
      </div>
    </div>
  );
}

// Sub-componente: Card visual para o DragOverlay
function CardItem({ card, isOverlay }: { card: Card, isOverlay?: boolean }) {
  return (
    <div className={`bg-white p-4 rounded-xl shadow-xl border-2 border-blue-500 cursor-grabbing pl-8 ${isOverlay ? 'rotate-2 scale-105' : ''}`}>
      <h4 className="text-sm font-medium text-slate-800">{card.title}</h4>
    </div>
  );
}