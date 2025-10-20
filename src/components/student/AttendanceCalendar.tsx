import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar } from "@/components/ui/calendar";
import { supabase } from "@/integrations/supabase/client";
import { CalendarDays } from "lucide-react";

export default function AttendanceCalendar() {
  const [attendanceDates, setAttendanceDates] = useState<Date[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAttendanceDates();
  }, []);

  const fetchAttendanceDates = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from("attendance")
        .select("check_in")
        .eq("user_id", user.id);

      if (error) throw error;

      const dates = data.map(record => new Date(record.check_in.split('T')[0]));
      setAttendanceDates(dates);
    } catch (error) {
      console.error("Error fetching attendance dates:", error);
    } finally {
      setLoading(false);
    }
  };

  const isAttendanceDay = (date: Date) => {
    return attendanceDates.some(
      attendanceDate =>
        attendanceDate.toDateString() === date.toDateString()
    );
  };

  return (
    <Card className="border-border/50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CalendarDays className="h-5 w-5 text-primary" />
          Attendance Calendar
        </CardTitle>
      </CardHeader>
      <CardContent className="flex justify-center">
        {loading ? (
          <p className="text-muted-foreground">Loading...</p>
        ) : (
          <Calendar
            mode="single"
            selected={selectedDate}
            onSelect={setSelectedDate}
            className="rounded-md border pointer-events-auto"
            modifiers={{
              attendance: attendanceDates
            }}
            modifiersClassNames={{
              attendance: "bg-primary text-primary-foreground font-bold"
            }}
          />
        )}
      </CardContent>
    </Card>
  );
}
