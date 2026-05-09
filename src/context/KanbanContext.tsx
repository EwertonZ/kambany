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
    const newCard: Card = { id: uuidv4(), title, description, createdAt: Date.now(), comments: [] };
    updateBoard((b) => ({
      ...b,
      columns: b.columns.map((c) => (c.id === columnId ? { ...c, cards: [...c.cards, newCard] } : c)),
    }));
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
      state, activeBoard, setActiveBoard, createBoard, deleteBoard,
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