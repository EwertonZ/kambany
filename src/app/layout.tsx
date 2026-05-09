import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { KanbanProvider } from "@/context/KanbanContext";
import { Toaster } from "sonner";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Kanban App",
  description: "Gerenciador de tarefas minimalista",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body className={`${inter.className} bg-slate-50 text-slate-900 h-screen overflow-hidden`}>
        <KanbanProvider>
          {children}
        </KanbanProvider>
        <Toaster position="bottom-right" richColors />
      </body>
    </html>
  );
}