import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Award, Download } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import jsPDF from "jspdf";

export default function CertificateGenerator() {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const generateCertificate = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile } = await supabase
        .from("profiles")
        .select("full_name, student_id")
        .eq("id", user.id)
        .single();

      const { data: attendance } = await supabase
        .from("attendance")
        .select("*")
        .eq("user_id", user.id);

      if (!attendance || attendance.length === 0) {
        toast({
          title: "No attendance records",
          description: "You need some attendance records to generate a certificate.",
          variant: "destructive",
        });
        return;
      }

      const pdf = new jsPDF({
        orientation: "landscape",
        unit: "mm",
        format: "a4",
      });

      // Certificate design
      pdf.setFillColor(240, 240, 240);
      pdf.rect(0, 0, 297, 210, "F");

      // Border
      pdf.setDrawColor(52, 152, 219);
      pdf.setLineWidth(2);
      pdf.rect(10, 10, 277, 190);

      // Title
      pdf.setFontSize(32);
      pdf.setTextColor(52, 152, 219);
      pdf.text("ATTENDANCE CERTIFICATE", 148.5, 50, { align: "center" });

      // Content
      pdf.setFontSize(16);
      pdf.setTextColor(0, 0, 0);
      pdf.text("This is to certify that", 148.5, 80, { align: "center" });

      pdf.setFontSize(24);
      pdf.setFont(undefined, "bold");
      pdf.text(profile?.full_name || "Student", 148.5, 100, { align: "center" });

      pdf.setFontSize(16);
      pdf.setFont(undefined, "normal");
      pdf.text(`Student ID: ${profile?.student_id || "N/A"}`, 148.5, 115, { align: "center" });

      pdf.text(`Has attended the library for ${attendance.length} sessions`, 148.5, 135, { align: "center" });

      // Date
      pdf.setFontSize(12);
      pdf.text(`Issue Date: ${new Date().toLocaleDateString()}`, 148.5, 170, { align: "center" });

      pdf.save(`attendance_certificate_${new Date().toISOString().split('T')[0]}.pdf`);

      toast({
        title: "Certificate generated!",
        description: "Your attendance certificate has been downloaded.",
      });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Failed to generate certificate",
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
          <Award className="h-5 w-5 text-primary" />
          Attendance Certificate
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">
          Generate an official attendance certificate for your records, internships, or academic requirements.
        </p>
        <Button onClick={generateCertificate} disabled={loading} className="w-full">
          <Download className="mr-2 h-4 w-4" />
          Generate Certificate
        </Button>
      </CardContent>
    </Card>
  );
}
