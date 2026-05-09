import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { KanbanProvider } from "@/context/KanbanContext";
import { ThemeProvider } from "@/context/ThemeContext";
import { Toaster } from "sonner";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Kanban App",
  description: "Gerenciador de tarefas minimalista",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <body className={`${inter.className} bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-50 h-screen overflow-hidden transition-colors`}>
        <ThemeProvider>
          <KanbanProvider>
            {children}
          </KanbanProvider>
        </ThemeProvider>
        <Toaster position="bottom-right" richColors />
      </body>
    </html>
  );
}