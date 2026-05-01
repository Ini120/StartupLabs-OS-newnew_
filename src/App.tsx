import { lazy, Suspense } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { AppLayout } from "@/components/layout/AppLayout";

// Lazy load public pages
const Landing = lazy(() => import("@/pages/Landing"));
const SignIn = lazy(() => import("@/pages/auth/SignIn"));
const SignUp = lazy(() => import("@/pages/auth/SignUp"));
const SelectRole = lazy(() => import("@/pages/auth/SelectRole"));
const CompleteProfile = lazy(() => import("@/pages/auth/CompleteProfile"));
const AdminSignUp = lazy(() => import("@/pages/auth/AdminSignUp"));
const AdminSignIn = lazy(() => import("@/pages/auth/AdminSignIn"));
const AcceptInvite = lazy(() => import("@/pages/auth/AcceptInvite"));
const NotFound = lazy(() => import("@/pages/NotFound"));

// Lazy load protected pages
const DashboardRouter = lazy(() => import("@/pages/dashboard/DashboardRouter"));
const MyStartup = lazy(() => import("@/pages/student/MyStartup"));
const StartupDetail = lazy(() => import("@/pages/student/StartupDetail"));
const Milestones = lazy(() => import("@/pages/student/Milestones"));
const Documents = lazy(() => import("@/pages/student/Documents"));
const AssignedStartups = lazy(() => import("@/pages/mentor/AssignedStartups"));
const FeedbackPage = lazy(() => import("@/pages/mentor/Feedback"));
const AllStartups = lazy(() => import("@/pages/admin/AllStartups"));
const UserManagement = lazy(() => import("@/pages/admin/UserManagement"));
const MentorAssignments = lazy(() => import("@/pages/admin/MentorAssignments"));
const Analytics = lazy(() => import("@/pages/admin/Analytics"));
const Showcase = lazy(() => import("@/pages/showcase/Showcase"));
const Messages = lazy(() => import("@/pages/Messages"));
const Profile = lazy(() => import("@/pages/Profile"));
const People = lazy(() => import("@/pages/People"));
const AdminInvites = lazy(() => import("@/pages/admin/AdminInvites"));

// Loading fallback component
const PageLoader = () => (
  <div className="flex items-center justify-center min-h-screen">
    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
  </div>
);

// Optimized QueryClient configuration
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 10 * 60 * 1000, // 10 minutes (formerly cacheTime)
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

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
          <Suspense fallback={<PageLoader />}>
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
          </Suspense>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
