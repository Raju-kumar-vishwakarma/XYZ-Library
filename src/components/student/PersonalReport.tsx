import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Download, FileText } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { exportToExcel, exportToPDF, calculateDuration } from "@/utils/reportExport";

export default function PersonalReport() {
  const [startDate, setStartDate] = useState(new Date().toISOString().split("T")[0]);
  const [endDate, setEndDate] = useState(new Date().toISOString().split("T")[0]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const generateReport = async (format: "excel" | "pdf") => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: attendanceData, error } = await supabase
        .from("attendance")
        .select("*")
        .eq("user_id", user.id)
        .gte("check_in", `${startDate}T00:00:00`)
        .lte("check_in", `${endDate}T23:59:59`)
        .order("check_in", { ascending: false });

      if (error) throw error;

      if (!attendanceData || attendanceData.length === 0) {
        toast({
          title: "No data found",
          description: "No attendance records found for the selected date range.",
          variant: "destructive",
        });
        return;
      }

      const { data: profileData } = await supabase
        .from("profiles")
        .select("full_name, student_id")
        .eq("id", user.id)
        .single();

      const formattedData = attendanceData.map((record: any) => ({
        student_id: profileData?.student_id || "N/A",
        student_name: profileData?.full_name || "Unknown User",
        check_in: record.check_in,
        check_out: record.check_out,
        duration: calculateDuration(record.check_in, record.check_out),
        date: new Date(record.check_in).toLocaleDateString(),
      }));

      const filename = `my_attendance_${startDate}_to_${endDate}`;
      const title = `Personal Attendance Report (${startDate} to ${endDate})`;

      if (format === "excel") {
        exportToExcel(formattedData, filename);
      } else {
        exportToPDF(formattedData, filename, title);
      }

      toast({
        title: "Report generated!",
        description: `Report has been downloaded as ${format.toUpperCase()}.`,
      });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Failed to generate report",
        description: error.message,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="border-border/50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5 text-primary" />
          Download My Report
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="start-date">Start Date</Label>
            <Input
              id="start-date"
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="end-date">End Date</Label>
            <Input
              id="end-date"
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
            />
          </div>
        </div>

        <div className="grid gap-2 md:grid-cols-2">
          <Button
            onClick={() => generateReport("excel")}
            disabled={loading}
            variant="outline"
          >
            <Download className="mr-2 h-4 w-4" />
            Excel
          </Button>
          <Button
            onClick={() => generateReport("pdf")}
            disabled={loading}
            variant="outline"
          >
            <Download className="mr-2 h-4 w-4" />
            PDF
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
