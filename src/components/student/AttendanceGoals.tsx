import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Target, Trophy } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export default function AttendanceGoals() {
  const [goal, setGoal] = useState(20);
  const [currentCount, setCurrentCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [streak, setStreak] = useState(0);
  const { toast } = useToast();

  useEffect(() => {
    fetchGoalAndProgress();
  }, []);

  const fetchGoalAndProgress = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Fetch goal from profile
      const { data: profile } = await supabase
        .from("profiles")
        .select("attendance_goal")
        .eq("id", user.id)
        .single();

      if (profile) {
        setGoal(profile.attendance_goal || 20);
      }

      // Count this month's attendance
      const now = new Date();
      const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
      const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);

      const { data: attendance, error } = await supabase
        .from("attendance")
        .select("check_in")
        .eq("user_id", user.id)
        .gte("check_in", firstDay.toISOString())
        .lte("check_in", lastDay.toISOString());

      if (error) throw error;
      setCurrentCount(attendance?.length || 0);

      // Calculate streak
      const allAttendance = await supabase
        .from("attendance")
        .select("check_in")
        .eq("user_id", user.id)
        .order("check_in", { ascending: false });

      if (allAttendance.data) {
        setStreak(calculateStreak(allAttendance.data));
      }
    } catch (error) {
      console.error("Error fetching goals:", error);
    }
  };

  const calculateStreak = (records: any[]) => {
    if (!records.length) return 0;
    
    let streak = 0;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (let i = 0; i < records.length; i++) {
      const recordDate = new Date(records[i].check_in);
      recordDate.setHours(0, 0, 0, 0);
      
      const expectedDate = new Date(today);
      expectedDate.setDate(today.getDate() - i);
      
      if (recordDate.getTime() === expectedDate.getTime()) {
        streak++;
      } else {
        break;
      }
    }
    
    return streak;
  };

  const updateGoal = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .from("profiles")
        .update({ attendance_goal: goal })
        .eq("id", user.id);

      if (error) throw error;

      toast({
        title: "Goal updated!",
        description: `Your monthly attendance goal is now ${goal} days.`,
      });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Failed to update goal",
        description: error.message,
      });
    } finally {
      setLoading(false);
    }
  };

  const progress = Math.min((currentCount / goal) * 100, 100);

  return (
    <div className="space-y-4">
      <Card className="border-border/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5 text-primary" />
            Monthly Goal
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Progress</span>
              <span className="font-medium">{currentCount} / {goal} days</span>
            </div>
            <Progress value={progress} />
            <p className="text-xs text-muted-foreground text-center">
              {progress >= 100 ? "🎉 Goal achieved!" : `${(goal - currentCount)} days to go`}
            </p>
          </div>

          <div className="flex gap-2">
            <div className="flex-1">
              <Label htmlFor="goal">Set Goal</Label>
              <Input
                id="goal"
                type="number"
                min="1"
                value={goal}
                onChange={(e) => setGoal(parseInt(e.target.value) || 1)}
              />
            </div>
            <Button onClick={updateGoal} disabled={loading} className="mt-auto">
              Update
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className="border-border/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5 text-primary" />
            Current Streak
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center">
            <div className="text-4xl font-bold text-primary mb-2">
              {streak} days
            </div>
            <p className="text-sm text-muted-foreground">
              Keep it up! Visit daily to maintain your streak.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
