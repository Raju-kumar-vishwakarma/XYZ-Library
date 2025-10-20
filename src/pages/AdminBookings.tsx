import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Armchair } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Booking {
  id: string;
  seat_number: string;
  booking_date: string;
  start_time: string;
  end_time: string;
  status: string;
  user_id: string;
  profiles: {
    full_name: string;
    email: string;
  };
}

const AdminBookings = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuth();
    fetchBookings();
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

  const fetchBookings = async () => {
    try {
      const { data: bookingsData, error: bookingsError } = await supabase
        .from("seat_bookings")
        .select("*")
        .order("booking_date", { ascending: false })
        .order("start_time", { ascending: false });

      if (bookingsError) throw bookingsError;

      // Fetch profiles for all user_ids
      if (bookingsData && bookingsData.length > 0) {
        const userIds = [...new Set(bookingsData.map(b => b.user_id))];
        const { data: profilesData } = await supabase
          .from("profiles")
          .select("id, full_name, email")
          .in("id", userIds);

        // Merge profiles with bookings
        const bookingsWithProfiles = bookingsData.map(booking => ({
          ...booking,
          profiles: profilesData?.find(p => p.id === booking.user_id) || {
            full_name: "Unknown",
            email: "Unknown"
          }
        }));

        setBookings(bookingsWithProfiles);
      } else {
        setBookings([]);
      }
    } catch (error) {
      console.error("Error fetching bookings:", error);
    } finally {
      setLoading(false);
    }
  };

  const updateBookingStatus = async (bookingId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from("seat_bookings")
        .update({ status: newStatus })
        .eq("id", bookingId);

      if (error) throw error;

      toast({
        title: "Status updated",
        description: `Booking status changed to ${newStatus}`,
      });

      fetchBookings();
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
      case "confirmed": return "default";
      case "pending": return "secondary";
      case "cancelled": return "destructive";
      default: return "default";
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
      <header className="border-b border-border/50 bg-card/80 backdrop-blur-sm sticky top-0 z-50 ">
        <div className="container mx-auto px-4 py-4 flex flex-wrap items-center justify-between gap-2 sm:gap-4">
          <Button
            variant="ghost"
            onClick={() => navigate("/admin")}
              className="hover:border-black hover:text-black transition-colors group-hover:cursor-pointer "
            >
              <ArrowLeft className="mr-1 h-4 w-4" />
              <span className="hidden sm:inline group">Back</span>
            </Button>
          <h1 className="text-3xl font-bold">Seat Bookings</h1>
          <p className="text-muted-foreground">Manage all seat reservations</p>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Armchair className="h-5 w-5 text-primary" />
              All Bookings
            </CardTitle>
          </CardHeader>
          <CardContent>
            {bookings.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">
                No bookings found
              </p>
            ) : (
              <div className="space-y-3">
                {bookings.map((booking) => (
                  <div
                    key={booking.id}
                    className="p-4 border border-border rounded-lg"
                  >
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-medium text-lg">
                            Seat {booking.seat_number}
                          </span>
                          <Badge variant={getStatusColor(booking.status)}>
                            {booking.status}
                          </Badge>
                        </div>
                        <div className="text-sm space-y-1">
                          <p className="text-muted-foreground">
                            <span className="font-medium">Student:</span>{" "}
                            {booking.profiles?.full_name || "Unknown"}
                          </p>
                          <p className="text-muted-foreground">
                            <span className="font-medium">Email:</span>{" "}
                            {booking.profiles?.email || "Unknown"}
                          </p>
                          <p className="text-muted-foreground">
                            <span className="font-medium">Date:</span>{" "}
                            {new Date(booking.booking_date).toLocaleDateString()}
                          </p>
                          <p className="text-muted-foreground">
                            <span className="font-medium">Time:</span>{" "}
                            {booking.start_time} - {booking.end_time}
                          </p>
                        </div>
                      </div>
                      {booking.status === "pending" && (
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            onClick={() => updateBookingStatus(booking.id, "confirmed")}
                          >
                            Confirm
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => updateBookingStatus(booking.id, "cancelled")}
                          >
                            Cancel
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

export default AdminBookings;