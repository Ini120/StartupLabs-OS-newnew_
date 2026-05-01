import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { AppLayout } from "@/components/layout/AppLayout";
import Landing from "@/pages/Landing";
import DashboardRouter from "@/pages/dashboard/DashboardRouter";
import MyStartup from "@/pages/student/MyStartup";
import StartupDetail from "@/pages/student/StartupDetail";
import Milestones from "@/pages/student/Milestones";
import Documents from "@/pages/student/Documents";
import AssignedStartups from "@/pages/mentor/AssignedStartups";
import FeedbackPage from "@/pages/mentor/Feedback";
import AllStartups from "@/pages/admin/AllStartups";
import UserManagement from "@/pages/admin/UserManagement";
import MentorAssignments from "@/pages/admin/MentorAssignments";
import Analytics from "@/pages/admin/Analytics";
import Showcase from "@/pages/showcase/Showcase";
import Messages from "@/pages/Messages";
import Profile from "@/pages/Profile";
import People from "@/pages/People";
import SignIn from "@/pages/auth/SignIn";
import SignUp from "@/pages/auth/SignUp";
import SelectRole from "@/pages/auth/SelectRole";
import CompleteProfile from "@/pages/auth/CompleteProfile";
import AdminSignUp from "@/pages/auth/AdminSignUp";
import AdminSignIn from "@/pages/auth/AdminSignIn";
import AcceptInvite from "@/pages/auth/AcceptInvite";
import AdminInvites from "@/pages/admin/AdminInvites";
import NotFound from "./pages/NotFound.tsx";

const queryClient = new QueryClient();

function ProtectedAppLayout() {
  return (
    <ProtectedRoute>
      <AppLayout />
    </ProtectedRoute>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            {/* Public landing page */}
            <Route path="/" element={<Landing />} />

            {/* Public auth routes */}
            <Route path="/sign-in/*" element={<SignIn />} />
            <Route path="/sign-up/*" element={<SignUp />} />
            <Route path="/admin-sign-up" element={<AdminSignUp />} />
            <Route path="/admin-sign-in" element={<AdminSignIn />} />
            <Route path="/accept-invite" element={<AcceptInvite />} />
            <Route path="/select-role" element={<SelectRole />} />
            <Route path="/complete-profile" element={<CompleteProfile />} />

            {/* Protected routes */}
            <Route path="/home" element={<Navigate to="/dashboard" replace />} />
            <Route element={<ProtectedAppLayout />}>
              <Route path="/dashboard" element={<DashboardRouter />} />
              <Route path="/startup" element={<MyStartup />} />
              <Route path="/startup/:id" element={<StartupDetail />} />
              <Route path="/milestones" element={<Milestones />} />
              <Route path="/documents" element={<Documents />} />
              <Route path="/assigned-startups" element={<AssignedStartups />} />
              <Route path="/feedback" element={<FeedbackPage />} />
              <Route path="/all-startups" element={<AllStartups />} />
              <Route path="/users" element={<UserManagement />} />
              <Route path="/mentor-assignments" element={<MentorAssignments />} />
              <Route path="/analytics" element={<Analytics />} />
              <Route path="/showcase" element={<Showcase />} />
              <Route path="/messages" element={<Messages />} />
              <Route path="/people" element={<People />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="/profile/:userId" element={<Profile />} />
              <Route path="/admin-invites" element={<AdminInvites />} />
            </Route>
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
