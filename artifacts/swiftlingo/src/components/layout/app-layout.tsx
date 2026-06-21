import { ReactNode } from "react";
import Header from "./header";
import BottomNav from "./bottom-nav";

export default function AppLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-[100dvh] bg-background text-foreground flex flex-col pb-16">
      <Header />
      <main className="flex-1 w-full max-w-3xl mx-auto p-4 animate-in fade-in duration-300">
        {children}
      </main>
      <BottomNav />
    </div>
  );
}
