import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { LogOut, QrCode, Clock, Calendar, BookOpen } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import LibraryStatus from "@/components/student/LibraryStatus";
import AttendanceStats from "@/components/student/AttendanceStats";
import TimeSlots from "@/components/student/TimeSlots";
import ProfileEdit from "@/components/student/ProfileEdit";
import PersonalReport from "@/components/student/PersonalReport";
import AttendanceCalendar from "@/components/student/AttendanceCalendar";
import StudyTimer from "@/components/student/StudyTimer";
import AttendanceGoals from "@/components/student/AttendanceGoals";
import LibraryAnnouncements from "@/components/student/LibraryAnnouncements";
import CertificateGenerator from "@/components/student/CertificateGenerator";
import SeatBooking from "@/components/student/SeatBooking";
import FeedbackForm from "@/components/student/FeedbackForm";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface AttendanceRecord {
  id: string;
  check_in: string;
  check_out: string | null;
  purpose: string | null;
}

const StudentDashboard = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<any>(null);
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);
  const [isCheckedIn, setIsCheckedIn] = useState(false);

  useEffect(() => {
    checkAuth();
    fetchProfile();
    fetchAttendance();
  }, []);

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      navigate("/login");
    }
  };

  const fetchProfile = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data } = await supabase
        .from("profiles" as any)
        .select("*")
        .eq("id", user.id)
        .single();
      setProfile(data);
    }
  };

  const fetchAttendance = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data, error } = await supabase
          .from("attendance")
          .select("*")
          .eq("user_id", user.id)
          .order("check_in", { ascending: false })
          .limit(10);

        if (!error && data) {
          setAttendanceRecords(data);
          // Check if currently checked in
          const lastRecord = data?.[0];
          setIsCheckedIn(lastRecord && !(lastRecord as any).check_out);
        } else {
          setAttendanceRecords([]);
        }
      }
    } catch (error) {
      console.error("Error fetching attendance:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCheckIn = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        // Check last check-in time
        const { data: lastCheckIn } = await supabase
          .from("attendance")
          .select("check_in")
          .eq("user_id", user.id)
          .order("check_in", { ascending: false })
          .limit(1)
          .single();

        if (lastCheckIn) {
          const lastCheckInTime = new Date(lastCheckIn.check_in).getTime();
          const currentTime = new Date().getTime();
          const timeDiff = (currentTime - lastCheckInTime) / (1000 * 60); // in minutes

          if (timeDiff < 10) {
            const remainingTime = Math.ceil(10 - timeDiff);
            toast({
              variant: "destructive",
              title: "Please wait",
              description: `You can check in again after ${remainingTime} minute(s). Please wait.`,
            });
            return;
          }
        }

        const { error } = await supabase
          .from("attendance" as any)
          .insert({
            user_id: user.id,
            purpose: "Study",
          } as any);

        if (error) throw error;

        toast({
          title: "Checked in!",
          description: "You have successfully checked into the library.",
        });

        fetchAttendance();
      }
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Check-in failed",
        description: error.message,
      });
    }
  };

  const handleCheckOut = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const lastRecord = attendanceRecords[0];
        const { error } = await supabase
          .from("attendance" as any)
          .update({ check_out: new Date().toISOString() } as any)
          .eq("id", lastRecord.id);

        if (error) throw error;

        toast({
          title: "Checked out!",
          description: "You have successfully checked out of the library.",
        });

        fetchAttendance();
      }
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Check-out failed",
        description: error.message,
      });
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    toast({
      title: "Logged out",
      description: "You have been successfully logged out.",
    });
    navigate("/login");
  };

  const calculateDuration = (checkIn: string, checkOut: string | null) => {
    const start = new Date(checkIn);
    const end = checkOut ? new Date(checkOut) : new Date();
    const diff = Math.abs(end.getTime() - start.getTime());
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    return `${hours}h ${minutes}m`;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }
  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted">
      {/* Header */}
      <header className="border-b border-border/50 bg-card/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <BookOpen className="h-8 w-8 text-primary" />
            <div className="hidden md:block">
              <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                XYZ Library
              </h1>
              <p className="text-sm text-muted-foreground">Student Portal</p>
            </div>
          </div>
          <Button
            variant="outline"
            onClick={handleLogout}
            className="hover:border-destructive hover:text-destructive transition-colors"
          >
            <LogOut className="h-4 w-4 md:mr-2" />
            <span className="hidden md:inline">Logout</span>
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-foreground mb-2">
            Welcome, {profile?.full_name}
          </h2>
          <p className="text-muted-foreground">Student ID: {profile?.student_id}</p>
        </div>

        {/* Quick Info */}
        <div className="grid gap-6 md:grid-cols-2 mb-8">
          <LibraryStatus />
          <Card className="border-border/50">
            <CardHeader>
              <CardTitle>Your Seat</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Seat Number</p>
                  <p className="text-2xl font-semibold">
                    {profile?.seat_number ? profile.seat_number : "Not assigned"}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Check In/Out Card */}
        <Card className="mb-8 border-border/50 shadow-medium">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <QrCode className="h-5 w-5 text-primary" />
              Attendance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-2">Current Status</p>
                <Badge
                  variant={isCheckedIn ? "default" : "secondary"}
                  className="text-sm"
                >
                  {isCheckedIn ? "Checked In" : "Not Checked In"}
                </Badge>
              </div>
              <Button
                onClick={isCheckedIn ? handleCheckOut : handleCheckIn}
                className={`${
                  isCheckedIn
                    ? "bg-gradient-to-r from-destructive to-orange-500"
                    : "bg-gradient-to-r from-primary to-secondary"
                } hover:opacity-90 transition-all duration-300 shadow-medium`}
                size="lg"
              >
                {isCheckedIn ? "Check Out" : "Check In"}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Tabs for different sections */}
        <Tabs defaultValue="attendance" className="space-y-6 ">
          <TabsList className="grid w-full grid-cols-2 lg:grid-cols-4 grid-gap-2">
            <TabsTrigger value="attendance">Attendance</TabsTrigger>
            <TabsTrigger value="stats">Statistics</TabsTrigger>
            <TabsTrigger value="goals">Goals</TabsTrigger>
            <TabsTrigger value="more">More</TabsTrigger>
          </TabsList>

          <TabsContent value="attendance" className="space-y-6 pt-5">
            <Card className="border-border/50 shadow-medium">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-primary" />
                  Recent Attendance
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {attendanceRecords.length === 0 ? (
                    <p className="text-center text-muted-foreground py-8">
                      No attendance records yet. Check in to start tracking!
                    </p>
                  ) : (
                    attendanceRecords.map((record) => (
                      <div
                        key={record.id}
                        className="flex items-center justify-between p-4 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                      >
                        <div className="flex items-center gap-4">
                          <div className="h-12 w-12 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
                            <Clock className="h-6 w-6 text-white" />
                          </div>
                          <div>
                            <p className="font-medium text-foreground">
                              {format(new Date(record.check_in), "MMM dd, yyyy")}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {format(new Date(record.check_in), "hh:mm a")} -{" "}
                              {record.check_out
                                ? format(new Date(record.check_out), "hh:mm a")
                                : "Present"}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-medium text-foreground">
                            {calculateDuration(record.check_in, record.check_out)}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {record.purpose || "Study"}
                          </p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="stats" className="space-y-6 pt-5">
            <div className="grid gap-6 md:grid-cols-2">
              <AttendanceStats records={attendanceRecords} />
              <div className="space-y-6">
                <AttendanceCalendar />
                <StudyTimer />
              </div>
            </div>
          </TabsContent>

          <TabsContent value="goals" className="space-y-6 pt-5">
            <div className="grid gap-6 md:grid-cols-2">
              <AttendanceGoals />
              <LibraryAnnouncements />
            </div>
          </TabsContent>


          <TabsContent value="more" className="space-y-6 pt-5">
            <div className="grid gap-6 md:grid-cols-2">
              <div className="space-y-6">
                <TimeSlots />
                <PersonalReport />
                {/* <CertificateGenerator /> */}
                <FeedbackForm />
              </div>
              <div className="space-y-6 ">
                <SeatBooking />
                
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default StudentDashboard;