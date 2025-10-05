import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AuthProvider } from "@/hooks/useAuth";
import { GlobalCodeProvider } from "@/hooks/useGlobalCodeContext";
import { GlobalChatSidebar } from "@/components/GlobalChatSidebar";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import NotFound from "./pages/NotFound";
import { MessageSquare } from "lucide-react";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AuthProvider>
        <GlobalCodeProvider>
          <BrowserRouter>
            <SidebarProvider>
              <div className="flex min-h-screen w-full flex-col">
                {/* Header with Chat Toggle */}
                <header className="h-12 flex items-center bg-background/80 backdrop-blur border-b border-border px-4 flex-shrink-0">
                  <SidebarTrigger className="flex items-center gap-2 text-sm">
                    <MessageSquare className="w-4 h-4" />
                    Chat IA
                  </SidebarTrigger>
                </header>

                {/* Main Layout with Sidebar */}
                <div className="flex flex-1 w-full overflow-hidden">
                  {/* Main Content */}
                  <main className="flex-1 overflow-auto">
                    <Routes>
                      <Route path="/" element={<Index />} />
                      <Route path="/auth" element={<Auth />} />
                      {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                      <Route path="*" element={<NotFound />} />
                    </Routes>
                  </main>

                  {/* Chat Sidebar */}
                  <GlobalChatSidebar />
                </div>
              </div>
              
              <Toaster />
              <Sonner />
            </SidebarProvider>
          </BrowserRouter>
        </GlobalCodeProvider>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;