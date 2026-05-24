"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { v4 as uuidv4 } from "uuid";
import { Board, KanbanState, Card, Column, Comment } from "@/types/kanban";
import { toast } from "sonner";

interface KanbanContextData {
  state: KanbanState;
  activeBoard: Board | null;
  setActiveBoard: (id: string) => void;
  createBoard: (name: string) => void;
  deleteBoard: (id: string) => void;
  createColumn: (title: string) => void;
  deleteColumn: (id: string) => void;
  createCard: (columnId: string, title: string, description?: string) => void;
  updateCard: (columnId: string, cardId: string, updates: Partial<Card>) => void;
  deleteCard: (columnId: string, cardId: string) => void;
  createBoardFromTemplate: (name: string, template: any) => void;
  moveCard: (cardId: string, sourceColId: string, destColId: string, newIndex: number) => void;
  addComment: (columnId: string, cardId: string, text: string) => void;
  deleteComment: (columnId: string, cardId: string, commentId: string) => void;
  exportData: () => void;
  importData: (file: File) => void;
}

const KanbanContext = createContext<KanbanContextData | undefined>(undefined);

export const KanbanProvider = ({ children }: { children: React.ReactNode }) => {
  const [state, setState] = useState<KanbanState>({ boards: [], activeBoardId: null });
  const [isLoaded, setIsLoaded] = useState(false);

  // Carregar do LocalStorage
  useEffect(() => {
    const saved = localStorage.getItem("kanban-data");
    if (saved) {
      try {
        setState(JSON.parse(saved));
      } catch (e) {
        console.error("Erro ao carregar dados", e);
      }
    } else {
      // Estado Inicial Default
      const defaultBoard: Board = {
        id: uuidv4(),
        name: "Meu Primeiro Board",
        createdAt: Date.now(),
        columns: [
          { id: uuidv4(), title: "To Do", cards: [] },
          { id: uuidv4(), title: "Doing", cards: [] },
          { id: uuidv4(), title: "Done", cards: [] },
        ],
      };
      setState({ boards: [defaultBoard], activeBoardId: defaultBoard.id });
    }
    setIsLoaded(true);
  }, []);

  // Salvar no LocalStorage
  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem("kanban-data", JSON.stringify(state));
    }
  }, [state, isLoaded]);

  const activeBoard = state.boards.find((b) => b.id === state.activeBoardId) || null;

  const updateBoard = (updater: (board: Board) => Board) => {
    if (!activeBoard) return;
    setState((prev) => ({
      ...prev,
      boards: prev.boards.map((b) => (b.id === activeBoard.id ? updater(b) : b)),
    }));
  };

  // Funções de Board
  const setActiveBoard = (id: string) => setState((prev) => ({ ...prev, activeBoardId: id }));
  const createBoard = (name: string) => {
    const newBoard: Board = { id: uuidv4(), name, createdAt: Date.now(), columns: [] };
    setState((prev) => ({
      boards: [...prev.boards, newBoard],
      activeBoardId: newBoard.id,
    }));
    toast.success("Board criado com sucesso!");
  };
  const deleteBoard = (id: string) => {
    setState((prev) => {
      const newBoards = prev.boards.filter((b) => b.id !== id);
      return { boards: newBoards, activeBoardId: newBoards.length > 0 ? newBoards[0].id : null };
    });
    toast.success("Board excluído.");
  };

  // Funções de Coluna
  const createColumn = (title: string) => {
    updateBoard((b) => ({ ...b, columns: [...b.columns, { id: uuidv4(), title, cards: [] }] }));
  };
  const deleteColumn = (id: string) => {
    updateBoard((b) => ({ ...b, columns: b.columns.filter((c) => c.id !== id) }));
  };

  // Funções de Card
  const createCard = (columnId: string, title: string, description = "") => {
    const newCard: Card = { id: uuidv4(), title, description, type: "TASK", parentId: null, createdAt: Date.now(), comments: [] };
    updateBoard((b) => ({
      ...b,
      columns: b.columns.map((c) => (c.id === columnId ? { ...c, cards: [...c.cards, newCard] } : c)),
    }));
  };

  // Criar board completo a partir de um template gerado pela IA
  const createBoardFromTemplate = (name: string, template: any) => {
    try {
      const newBoard: Board = { id: uuidv4(), name, createdAt: Date.now(), columns: [] };

      const titleToIdMap: Record<string, string> = {};
      const idSet = new Set<string>();

      // Criar colunas e cards sem parentId primeiro, preservando ids se fornecidos
      newBoard.columns = (template.columns || []).map((col: any) => {
        const colId = col.id || uuidv4();
        idSet.add(colId);
        const newCol: Column = { id: colId, title: col.title || "", cards: [] };
        newCol.cards = (col.cards || []).map((card: any) => {
          const cardId = card.id || uuidv4();
          idSet.add(cardId);
          const newCard: Card = {
            id: cardId,
            title: card.title || "",
            description: card.description || "",
            type: card.type || "TASK",
            parentId: null,
            createdAt: Date.now(),
            comments: [],
          };
          // Map by title to help resolve parents later
          if (newCard.title) titleToIdMap[newCard.title] = newCard.id;
          return newCard;
        });
        return newCol;
      });

      // Resolver parentId usando parentId direto ou parentTitle
      // Percorrer template e newBoard em paralelo para suportar parent info por card
      for (let colIndex = 0; colIndex < (template.columns || []).length; colIndex++) {
        const tmplCol = template.columns[colIndex] || { cards: [] };
        const newCol = newBoard.columns[colIndex];
        if (!newCol) continue;
        for (let cardIndex = 0; cardIndex < (tmplCol.cards || []).length; cardIndex++) {
          const tmplCard = tmplCol.cards[cardIndex] || {};
          const newCard = newCol.cards[cardIndex];
          if (!newCard) continue;

          // Prefer explicit parentId if provided
          if (tmplCard.parentId) {
            const pid = tmplCard.parentId;
            // if parentId is a title string, resolve by title
            if (typeof pid === 'string') {
              if (idSet.has(pid)) {
                newCard.parentId = pid;
              } else if (titleToIdMap[pid]) {
                newCard.parentId = titleToIdMap[pid];
              }
            }
          } else if (tmplCard.parentTitle) {
            const pt = tmplCard.parentTitle;
            if (pt && titleToIdMap[pt]) newCard.parentId = titleToIdMap[pt];
          }
        }
      }

      setState((prev) => ({ boards: [...prev.boards, newBoard], activeBoardId: newBoard.id }));
      toast.success("Board gerado com sucesso a partir da IA!");
    } catch (err) {
      console.error(err);
      toast.error("Erro ao criar board a partir do template.");
    }
  };
  
  const updateCard = (columnId: string, cardId: string, updates: Partial<Card>) => {
    updateBoard((b) => ({
      ...b,
      columns: b.columns.map((c) =>
        c.id === columnId
          ? { ...c, cards: c.cards.map((card) => (card.id === cardId ? { ...card, ...updates } : card)) }
          : c
      ),
    }));
  };

  const deleteCard = (columnId: string, cardId: string) => {
    updateBoard((b) => ({
      ...b,
      columns: b.columns.map((c) =>
        c.id === columnId ? { ...c, cards: c.cards.filter((card) => card.id !== cardId) } : c
      ),
    }));
  };

  const moveCard = (cardId: string, sourceColId: string, destColId: string, newIndex: number) => {
    updateBoard((b) => {
      const sourceCol = b.columns.find((c) => c.id === sourceColId);
      const destCol = b.columns.find((c) => c.id === destColId);
      if (!sourceCol || !destCol) return b;

      const card = sourceCol.cards.find((c) => c.id === cardId);
      if (!card) return b;

      const newSourceCards = sourceCol.cards.filter((c) => c.id !== cardId);
      const newDestCards = [...destCol.cards];
      
      if (sourceColId === destColId) {
        newSourceCards.splice(newIndex, 0, card);
        return {
          ...b,
          columns: b.columns.map((c) => (c.id === sourceColId ? { ...c, cards: newSourceCards } : c)),
        };
      } else {
        newDestCards.splice(newIndex, 0, card);
        return {
          ...b,
          columns: b.columns.map((c) => {
            if (c.id === sourceColId) return { ...c, cards: newSourceCards };
            if (c.id === destColId) return { ...c, cards: newDestCards };
            return c;
          }),
        };
      }
    });
  };

  // Comentários
  const addComment = (columnId: string, cardId: string, text: string) => {
    const comment: Comment = { id: uuidv4(), text, createdAt: Date.now() };
    updateBoard((b) => ({
      ...b,
      columns: b.columns.map((c) =>
        c.id === columnId ? {
          ...c, cards: c.cards.map((card) => 
            card.id === cardId ? { ...card, comments: [...card.comments, comment] } : card
          )
        } : c
      ),
    }));
  };

  const deleteComment = (columnId: string, cardId: string, commentId: string) => {
    updateBoard((b) => ({
      ...b,
      columns: b.columns.map((c) =>
        c.id === columnId ? {
          ...c, cards: c.cards.map((card) => 
            card.id === cardId ? { ...card, comments: card.comments.filter(cm => cm.id !== commentId) } : card
          )
        } : c
      ),
    }));
  };

  // Backup e Restauração
  const exportData = () => {
    const dataStr = JSON.stringify(state, null, 2);
    const blob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `kanban-backup-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    toast.success("Backup exportado com sucesso!");
  };

  const importData = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const json = JSON.parse(e.target?.result as string);
        if (json.boards && Array.isArray(json.boards)) {
          setState(json);
          toast.success("Backup restaurado com sucesso!");
        } else {
          toast.error("Arquivo JSON inválido.");
        }
      } catch (err) {
        toast.error("Erro ao ler o arquivo JSON.");
      }
    };
    reader.readAsText(file);
  };

  if (!isLoaded) return null;

  return (
    <KanbanContext.Provider value={{
      state, activeBoard, setActiveBoard, createBoard, createBoardFromTemplate, deleteBoard,
      createColumn, deleteColumn, createCard, updateCard, deleteCard,
      moveCard, addComment, deleteComment, exportData, importData
    }}>
      {children}
    </KanbanContext.Provider>
  );
};

export const useKanban = () => {
  const context = useContext(KanbanContext);
  if (!context) throw new Error("useKanban deve ser usado dentro de KanbanProvider");
  return context;
};