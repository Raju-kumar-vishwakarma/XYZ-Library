import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { TrendingUp } from "lucide-react";

interface AttendanceStatsProps {
  records: any[];
}

export default function AttendanceStats({ records }: AttendanceStatsProps) {
  const calculateStats = () => {
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - (6 - i));
      return date.toISOString().split("T")[0];
    });

    const statsData = last7Days.map((date) => {
      const dayRecords = records.filter((r) => {
        const recordDate = new Date(r.check_in).toISOString().split("T")[0];
        return recordDate === date;
      });

      const totalMinutes = dayRecords.reduce((sum, r) => {
        if (!r.check_out) return sum;
        const diff = new Date(r.check_out).getTime() - new Date(r.check_in).getTime();
        return sum + diff / (1000 * 60);
      }, 0);

      const dayName = new Date(date).toLocaleDateString("en-US", { weekday: "short" });
      return {
        day: dayName,
        hours: Math.round(totalMinutes / 60 * 10) / 10,
      };
    });

    const totalHours = statsData.reduce((sum, d) => sum + d.hours, 0);
    const avgHours = totalHours / 7;
    const streak = calculateStreak();

    return { statsData, totalHours: Math.round(totalHours * 10) / 10, avgHours: Math.round(avgHours * 10) / 10, streak };
  };

  const calculateStreak = () => {
    let streak = 0;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (let i = 0; i < 365; i++) {
      const checkDate = new Date(today);
      checkDate.setDate(today.getDate() - i);
      const dateStr = checkDate.toISOString().split("T")[0];

      const hasRecord = records.some((r) => {
        const recordDate = new Date(r.check_in).toISOString().split("T")[0];
        return recordDate === dateStr;
      });

      if (hasRecord) {
        streak++;
      } else if (i > 0) {
        break;
      }
    }
    return streak;
  };

  const { statsData, totalHours, avgHours, streak } = calculateStats();

  return (
    <div className="space-y-6 pt-4">
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="border-border/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Last 7 Days Total
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalHours}h</div>
          </CardContent>
        </Card>

        <Card className="border-border/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Daily Average
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{avgHours}h</div>
          </CardContent>
        </Card>

        <Card className="border-border/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Attendance Streak
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold flex items-center gap-2">
              {streak} {streak > 0 && <TrendingUp className="h-5 w-5 text-primary" />}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="border-border/50">
        <CardHeader>
          <CardTitle>Weekly Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={statsData}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis dataKey="day" className="text-xs" />
              <YAxis className="text-xs" />
              <Tooltip
                contentStyle={{
                  backgroundColor: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "8px",
                }}
              />
              <Bar dataKey="hours" fill="hsl(var(--primary))" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}