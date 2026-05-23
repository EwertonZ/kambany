export type CardType = "EPIC" | "HISTORY" | "TASK";

export const cardTypeColors: Record<CardType, string> = {
  EPIC: "#9333ea",    // Roxo
  HISTORY: "#3b82f6", // Azul
  TASK: "#eab308",    // Amarelo
};

export interface Comment {
  id: string;
  text: string;
  createdAt: number;
}

export interface Card {
  id: string;
  title: string;
  description: string;
  type: CardType;
  createdAt: number;
  comments: Comment[];
}

export interface Column {
  id: string;
  title: string;
  cards: Card[];
}

export interface Board {
  id: string;
  name: string;
  columns: Column[];
  createdAt: number;
}

export interface KanbanState {
  boards: Board[];
  activeBoardId: string | null;
}