import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import AuthPrompt from "@/components/AuthPrompt";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { HashRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import Course from "./pages/Course";
import Upload from "./pages/Upload";
import Admin from "./pages/Admin";
import AdminRequests from "./pages/AdminRequests";
import Auth from "./pages/Auth";
import Bookmarks from "./pages/Bookmarks";
import About from "./pages/About";
import RequestResource from "./pages/RequestResource";
import StudyAssistant from "./pages/StudyAssistant";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
      <TooltipProvider>
      <Toaster />
      <Sonner />
      <HashRouter>
        <AuthPrompt />
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/course/:courseCode" element={<Course />} />
          <Route path="/upload" element={<Upload />} />
          <Route path="/admin" element={<Admin />} />
          <Route path="/admin/requests" element={<AdminRequests />} />
          <Route path="/auth" element={<Auth />} />
          <Route path="/bookmarks" element={<Bookmarks />} />
          <Route path="/about" element={<About />} />
          <Route path="/request" element={<RequestResource />} />
          <Route path="/study-assistant" element={<StudyAssistant />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
  </HashRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
