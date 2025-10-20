import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import StatsCard from "@/components/admin/StatsCard";
import {
  Users,
  UserCheck,
  Clock,
  TrendingUp,
  LogOut,
  Settings,
  BookOpen,
  Armchair,
  MessageSquare,
  Menu,
  X,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const AdminDashboard = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [menuOpen, setMenuOpen] = useState(false);
  const [stats, setStats] = useState({
    totalStudents: 0,
    presentToday: 0,
    avgDuration: "0h",
    weeklyGrowth: "+0%",
  });

  useEffect(() => {
    checkAuth();
    fetchStats();
  }, []);

  // ✅ Check if admin is authenticated
  const checkAuth = async () => {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (!session) {
      navigate("/login");
      return;
    }

    const { data: roleData, error: roleError } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", session.user.id)
      .single();

    if (roleError || !roleData || roleData.role !== "admin") {
      navigate("/student");
    }
  };

  // ✅ Fetch Dashboard Stats
  const fetchStats = async () => {
    try {
      const { count: studentCount } = await supabase
        .from("user_roles" as any)
        .select("*", { count: "exact", head: true })
        .eq("role", "student");

      const today = new Date().toISOString().split("T")[0];
      const { count: todayCount } = await supabase
        .from("attendance" as any)
        .select("*", { count: "exact", head: true })
        .gte("check_in", `${today}T00:00:00`)
        .lte("check_in", `${today}T23:59:59`);

      setStats({
        totalStudents: studentCount || 0,
        presentToday: todayCount || 0,
        avgDuration: "2h 30m",
        weeklyGrowth: "+12%",
      });
    } catch (error) {
      console.error("Error fetching stats:", error);
    } finally {
      setLoading(false);
    }
  };

  // ✅ Logout
  const handleLogout = async () => {
    await supabase.auth.signOut();
    toast({
      title: "Logged out",
      description: "You have been successfully logged out.",
    });
    navigate("/login");
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted mt-8">
      {/* ✅ Header Section */}
      <header className="border-b border-border/50 bg-card/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          {/* Left Logo */}
          <div className="flex items-center gap-3">
            <BookOpen className="h-8 w-8 text-primary" />
            <div className="hidden sm:block">
              <h1 className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
              XYZ Library
              </h1>
              <p className="text-sm text-muted-foreground">Admin Dashboard</p>
            </div>
          </div>

          {/* Desktop Buttons */}
          <div className="hidden lg:flex gap-2">
            <Button
              variant="outline"
              onClick={() => navigate("/admin/students")}
              className="hover:border-black hover:text-black transition-colors"
            >
              <Users className="h-4 w-4 md:mr-2" />
              <span className="hidden md:inline">Manage Students</span>
            </Button>
            <Button
              variant="outline"
              onClick={() => navigate("/admin/attendance")}
              className="hover:border-black hover:text-black transition-colors"
            >
              <UserCheck className="h-4 w-4 md:mr-2" />
              <span className="hidden md:inline">Attendance</span>
            </Button>
            <Button
              variant="outline"
              onClick={() => navigate("/admin/bookings")}
              className="hover:border-black hover:text-black transition-colors"
            >
              <Armchair className="h-4 w-4 md:mr-2" />
              <span className="hidden md:inline">Bookings</span>
            </Button>
            <Button
              variant="outline"
              onClick={() => navigate("/admin/feedback")}
              className="hover:border-black hover:text-black transition-colors"
            >
              <MessageSquare className="h-4 w-4 md:mr-2" />
              <span className="hidden md:inline">Feedback</span>
            </Button>
            <Button
              variant="outline"
              onClick={() => navigate("/admin/settings")}
              className="hover:border-black hover:text-black transition-colors"
            >
              <Settings className="h-4 w-4 md:mr-2" />
              <span className="hidden md:inline">Settings</span>
            </Button>
            <Button
              variant="outline"
              onClick={handleLogout}
              className="hover:border-black hover:text-black transition-colors"
            >
              <LogOut className="h-4 w-4 md:mr-2" />
              <span className="hidden md:inline">Logout</span>
            </Button>
          </div>

          {/* Mobile Menu */}
          <button
            className="lg:hidden p-2 rounded-md border border-border hover:bg-muted transition-colors"
            onClick={() => setMenuOpen(!menuOpen)}
          >
            {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>

        {menuOpen && (
          <div className="lg:hidden border-t border-border/40 bg-card/95 backdrop-blur-md">
            <div className="flex flex-col gap-2 p-4">
              {[
                { path: "/admin/students", icon: Users, text: "Manage Students" },
                { path: "/admin/attendance", icon: UserCheck, text: "Attendance" },
                { path: "/admin/bookings", icon: Armchair, text: "Bookings" },
                { path: "/admin/feedback", icon: MessageSquare, text: "Feedback" },
                { path: "/admin/settings", icon: Settings, text: "Settings" },
              ].map(({ path, icon: Icon, text }) => (
                <Button
                  key={path}
                  variant="outline"
                  onClick={() => {
                    navigate(path);
                    setMenuOpen(false);
                  }}
                >
                  <Icon className="h-4 w-4 mr-2" /> {text}
                </Button>
              ))}
              <Button
                variant="outline"
                onClick={() => {
                  handleLogout();
                  setMenuOpen(false);
                }}
                className="hover:border-destructive hover:text-destructive"
              >
                <LogOut className="h-4 w-4 mr-2" /> Logout
              </Button>
            </div>
          </div>
        )}
      </header>

      {/* ✅ Main Dashboard Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-foreground mb-2">Welcome back, Admin</h2>
          <p className="text-muted-foreground">
            Here's what's happening in your library today.
          </p>
        </div>

        {/* Stats */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-8">
          <StatsCard title="Total Students" value={stats.totalStudents} icon={Users} trend="Active members" />
          <StatsCard title="Present Today" value={stats.presentToday} icon={UserCheck} trend="Currently in library" trendUp />
          <StatsCard title="Avg. Duration" value={stats.avgDuration} icon={Clock} trend="Per visit" />
          <StatsCard title="Weekly Growth" value={stats.weeklyGrowth} icon={TrendingUp} trend="vs last week" trendUp />
        </div>

        {/* Quick Actions */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <Button
            onClick={() => navigate("/admin/students")}
            className="h-32 bg-gradient-to-br from-primary to-primary-glow hover:opacity-90 transition-all duration-300 shadow-medium hover:shadow-strong"
            size="lg"
          >
            <div className="text-center">
              <Users className="h-8 w-8 mb-2 mx-auto" />
              <div className="text-lg font-semibold">Student Management</div>
              <div className="text-sm opacity-90">Add, edit, or remove students</div>
            </div>
          </Button>

          <Button
            onClick={() => navigate("/admin/attendance")}
            className="h-32 bg-gradient-to-br from-secondary to-secondary hover:opacity-90 transition-all duration-300 shadow-medium hover:shadow-strong"
            size="lg"
          >
            <div className="text-center">
              <UserCheck className="h-8 w-8 mb-2 mx-auto" />
              <div className="text-lg font-semibold">Attendance Records</div>
              <div className="text-sm opacity-90">View and manage attendance</div>
            </div>
          </Button>

          <Button
            onClick={() => navigate("/admin/reports-enhanced")}
            className="h-32 bg-gradient-to-br from-accent to-accent hover:opacity-90 transition-all duration-300 shadow-medium hover:shadow-strong"
            size="lg"
          >
            <div className="text-center">
              <TrendingUp className="h-8 w-8 mb-2 mx-auto" />
              <div className="text-lg font-semibold">Reports & Analytics</div>
              <div className="text-sm opacity-90">Download detailed reports</div>
            </div>
          </Button>
        </div>
      </main>
    </div>
  );
};

export default AdminDashboard;