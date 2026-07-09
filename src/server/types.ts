export type BookingService = { name: string; priceFrom: number };

export type BookingStatus =
  | "pending"
  | "proposed_by_owner"
  | "proposed_by_customer"
  | "confirmed"
  | "declined"
  | "cancelled";

export type Booking = {
  id: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string | null;
  services: BookingService[];
  total_price_from: number;
  preferred_barber: "baggio" | "rahul" | null;
  preferred_date: string; // YYYY-MM-DD
  preferred_time: string; // HH:MM:SS
  message: string | null;
  status: BookingStatus;
  confirmed_date: string | null;
  confirmed_time: string | null;
  proposed_date: string | null;
  proposed_time: string | null;
  proposed_by: "owner" | "customer" | null;
  owner_token: string;
  customer_token: string;
  created_at: string;
  updated_at: string;
};

// Minimal hand-written schema so the untyped Supabase client (no generated
// codegen in this project) still gets real Insert/Update/Row typing instead
// of the library's `never` default when no Database generic is supplied.
export type Database = {
  public: {
    Tables: {
      bookings: {
        Row: Booking;
        Insert: Partial<Booking>;
        Update: Partial<Booking>;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
  };
};
