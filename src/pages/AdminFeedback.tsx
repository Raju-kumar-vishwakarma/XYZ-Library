import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, MessageSquare, Star } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Feedback {
  id: string;
  subject: string;
  message: string;
  rating: number | null;
  status: string;
  created_at: string;
  user_id: string;
  profiles: {
    full_name: string;
    email: string;
  };
}

const AdminFeedback = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [feedback, setFeedback] = useState<Feedback[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuth();
    fetchFeedback();
  }, []);

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      navigate("/login");
      return;
    }

    const { data: roleData } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", session.user.id)
      .single();

    if (!roleData || roleData.role !== "admin") {
      navigate("/student");
    }
  };

  const fetchFeedback = async () => {
    try {
      const { data: feedbackData, error: feedbackError } = await supabase
        .from("feedback")
        .select("*")
        .order("created_at", { ascending: false });

      if (feedbackError) throw feedbackError;

      // Fetch profiles for all user_ids
      if (feedbackData && feedbackData.length > 0) {
        const userIds = [...new Set(feedbackData.map(f => f.user_id))];
        const { data: profilesData } = await supabase
          .from("profiles")
          .select("id, full_name, email")
          .in("id", userIds);

        // Merge profiles with feedback
        const feedbackWithProfiles = feedbackData.map(feedback => ({
          ...feedback,
          profiles: profilesData?.find(p => p.id === feedback.user_id) || {
            full_name: "Unknown",
            email: "Unknown"
          }
        }));

        setFeedback(feedbackWithProfiles);
      } else {
        setFeedback([]);
      }
    } catch (error) {
      console.error("Error fetching feedback:", error);
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (feedbackId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from("feedback")
        .update({ status: newStatus })
        .eq("id", feedbackId);

      if (error) throw error;

      toast({
        title: "Status updated",
        description: `Feedback marked as ${newStatus}`,
      });

      fetchFeedback();
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Update failed",
        description: error.message,
      });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "resolved": return "default";
      case "pending": return "secondary";
      case "reviewed": return "outline";
      default: return "secondary";
    }
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
      <header className="border-b border-border/50 bg-card/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex flex-wrap items-center justify-between gap-2 sm:gap-4">
          <Button
            variant="ghost"
            onClick={() => navigate("/admin")}
             className="hover:border-black hover:text-black transition-colors group-hover:cursor-pointer "
            >
              <ArrowLeft className="mr-1 h-4 w-4" />
              <span className="hidden sm:inline group">Back</span>
            </Button>
          <h1 className="text-3xl font-bold">Student Feedback</h1>
          <p className="text-muted-foreground">Review and manage feedback submissions</p>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5 text-primary" />
              All Feedback
            </CardTitle>
          </CardHeader>
          <CardContent>
            {feedback.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">
                No feedback submitted yet
              </p>
            ) : (
              <div className="space-y-4">
                {feedback.map((item) => (
                  <div
                    key={item.id}
                    className="p-4 border border-border rounded-lg"
                  >
                    <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                      <div className="space-y-3 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="font-semibold text-lg">{item.subject}</h3>
                          <Badge variant={getStatusColor(item.status)}>
                            {item.status}
                          </Badge>
                          {item.rating && (
                            <div className="flex items-center gap-1 text-yellow-500">
                              <Star className="h-4 w-4 fill-current" />
                              <span className="text-sm font-medium">{item.rating}/5</span>
                            </div>
                          )}
                        </div>
                        <p className="text-sm text-foreground">{item.message}</p>
                        <div className="text-xs text-muted-foreground space-y-1">
                          <p>
                            <span className="font-medium">From:</span>{" "}
                            {item.profiles?.full_name || "Unknown"} ({item.profiles?.email || "Unknown"})
                          </p>
                          <p>
                            <span className="font-medium">Submitted:</span>{" "}
                            {new Date(item.created_at).toLocaleString()}
                          </p>
                        </div>
                      </div>
                      {item.status === "pending" && (
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => updateStatus(item.id, "reviewed")}
                          >
                            Mark Reviewed
                          </Button>
                          <Button
                            size="sm"
                            onClick={() => updateStatus(item.id, "resolved")}
                          >
                            Resolve
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default AdminFeedback;