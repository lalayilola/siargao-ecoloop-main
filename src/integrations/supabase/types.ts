export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          full_name: string;
          barangay: string;
          address: string;
          phone: string;
          primary_role: Database["public"]["Enums"]["app_role"];
          lgu_approved: boolean;
          municipality: Database["public"]["Enums"]["municipality"];
          is_super_admin: boolean;
          profile_picture_url: string | null;
          cover_photo_url: string | null;
          government_id_url: string | null;
          average_rating: number | null;
          total_ratings: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          full_name?: string;
          barangay?: string;
          address?: string;
          phone?: string;
          primary_role?: Database["public"]["Enums"]["app_role"];
          lgu_approved?: boolean;
          municipality?: Database["public"]["Enums"]["municipality"];
          is_super_admin?: boolean;
          profile_picture_url?: string | null;
          cover_photo_url?: string | null;
          government_id_url?: string | null;
          average_rating?: number | null;
          total_ratings?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          full_name?: string;
          barangay?: string;
          address?: string;
          phone?: string;
          primary_role?: Database["public"]["Enums"]["app_role"];
          lgu_approved?: boolean;
          municipality?: Database["public"]["Enums"]["municipality"];
          is_super_admin?: boolean;
          profile_picture_url?: string | null;
          cover_photo_url?: string | null;
          government_id_url?: string | null;
          average_rating?: number | null;
          total_ratings?: number;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      user_roles: {
        Row: {
          id: string;
          user_id: string;
          role: Database["public"]["Enums"]["app_role"];
        };
        Insert: {
          id?: string;
          user_id: string;
          role: Database["public"]["Enums"]["app_role"];
        };
        Update: {
          id?: string;
          user_id?: string;
          role?: Database["public"]["Enums"]["app_role"];
        };
        Relationships: [];
      };
      feed_posts: {
        Row: {
          id: string;
          user_id: string;
          role: Database["public"]["Enums"]["app_role"];
          author: string;
          barangay: string;
          body: string;
          image: string | null;
          images: string[];
          kg: number | null;
          price: string | null;
          date: string | null;
          latitude: number | null;
          longitude: number | null;
          location_name: string | null;
          location_address: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          role?: Database["public"]["Enums"]["app_role"];
          author: string;
          barangay: string;
          body: string;
          image?: string | null;
          images?: string[];
          kg?: number | null;
          price?: string | null;
          date?: string | null;
          latitude?: number | null;
          longitude?: number | null;
          location_name?: string | null;
          location_address?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          role?: Database["public"]["Enums"]["app_role"];
          author?: string;
          barangay?: string;
          body?: string;
          image?: string | null;
          images?: string[];
          kg?: number | null;
          price?: string | null;
          date?: string | null;
          latitude?: number | null;
          longitude?: number | null;
          location_name?: string | null;
          location_address?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      marketplace_listings: {
        Row: {
          id: string;
          user_id: string;
          title: string;
          kind: Database["public"]["Enums"]["listing_kind"];
          seller: string;
          role: Database["public"]["Enums"]["app_role"];
          barangay: string;
          municipality: Database["public"]["Enums"]["municipality"];
          kg: number;
          price: string | null;
          available_at: string;
          image: string | null;
          images: string[];
          transaction_type: Database["public"]["Enums"]["transaction_type"];
          acceptable_exchanges: string[];
          category: string;
          listing_status: string;
          latitude: number | null;
          longitude: number | null;
          location_name: string | null;
          location_address: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          title: string;
          kind?: Database["public"]["Enums"]["listing_kind"];
          seller: string;
          role?: Database["public"]["Enums"]["app_role"];
          barangay: string;
          municipality?: Database["public"]["Enums"]["municipality"];
          kg: number;
          price?: string | null;
          available_at?: string;
          image?: string | null;
          images?: string[];
          transaction_type?: Database["public"]["Enums"]["transaction_type"];
          acceptable_exchanges?: string[];
          category?: string;
          listing_status?: string;
          latitude?: number | null;
          longitude?: number | null;
          location_name?: string | null;
          location_address?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          title?: string;
          kind?: Database["public"]["Enums"]["listing_kind"];
          seller?: string;
          role?: Database["public"]["Enums"]["app_role"];
          barangay?: string;
          municipality?: Database["public"]["Enums"]["municipality"];
          kg?: number;
          price?: string | null;
          available_at?: string;
          image?: string | null;
          images?: string[];
          transaction_type?: Database["public"]["Enums"]["transaction_type"];
          acceptable_exchanges?: string[];
          category?: string;
          listing_status?: string;
          latitude?: number | null;
          longitude?: number | null;
          location_name?: string | null;
          location_address?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      planning_entries: {
        Row: {
          id: string;
          user_id: string;
          role: Database["public"]["Enums"]["app_role"];
          author: string;
          need: string;
          when: string;
          kg: number | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          role?: Database["public"]["Enums"]["app_role"];
          author: string;
          need: string;
          when: string;
          kg?: number | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          role?: Database["public"]["Enums"]["app_role"];
          author?: string;
          need?: string;
          when?: string;
          kg?: number | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      trades: {
        Row: {
          id: string;
          from_user_id: string;
          from_role: Database["public"]["Enums"]["app_role"];
          from_name: string;
          from_gives: string;
          to_user_id: string | null;
          to_role: Database["public"]["Enums"]["app_role"];
          to_name: string;
          to_gives: string;
          status: Database["public"]["Enums"]["trade_status"];
          trade_date: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          from_user_id: string;
          from_role?: Database["public"]["Enums"]["app_role"];
          from_name: string;
          from_gives: string;
          to_user_id?: string | null;
          to_role?: Database["public"]["Enums"]["app_role"];
          to_name: string;
          to_gives: string;
          status?: Database["public"]["Enums"]["trade_status"];
          trade_date?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          from_user_id?: string;
          from_role?: Database["public"]["Enums"]["app_role"];
          from_name?: string;
          from_gives?: string;
          to_user_id?: string | null;
          to_role?: Database["public"]["Enums"]["app_role"];
          to_name?: string;
          to_gives?: string;
          status?: Database["public"]["Enums"]["trade_status"];
          trade_date?: string;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      trade_requests: {
        Row: {
          id: string;
          listing_id: string;
          requester_user_id: string;
          requester_name: string;
          requester_role: Database["public"]["Enums"]["app_role"];
          offered_item_id: string | null;
          offered_item_title: string | null;
          message: string;
          quantity_kg: number;
          status: Database["public"]["Enums"]["trade_status"];
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          listing_id: string;
          requester_user_id: string;
          requester_name: string;
          requester_role: Database["public"]["Enums"]["app_role"];
          offered_item_id?: string | null;
          offered_item_title?: string | null;
          message: string;
          quantity_kg?: number;
          status?: Database["public"]["Enums"]["trade_status"];
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          listing_id?: string;
          requester_user_id?: string;
          requester_name?: string;
          requester_role?: Database["public"]["Enums"]["app_role"];
          offered_item_id?: string | null;
          offered_item_title?: string | null;
          message?: string;
          quantity_kg?: number;
          status?: Database["public"]["Enums"]["trade_status"];
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      purchase_requests: {
        Row: {
          id: string;
          listing_id: string;
          buyer_user_id: string;
          buyer_name: string;
          buyer_role: Database["public"]["Enums"]["app_role"];
          message: string | null;
          quantity_kg: number;
          status: Database["public"]["Enums"]["trade_status"];
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          listing_id: string;
          buyer_user_id: string;
          buyer_name: string;
          buyer_role: Database["public"]["Enums"]["app_role"];
          message?: string | null;
          quantity_kg?: number;
          status?: Database["public"]["Enums"]["trade_status"];
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          listing_id?: string;
          buyer_user_id?: string;
          buyer_name?: string;
          buyer_role?: Database["public"]["Enums"]["app_role"];
          message?: string | null;
          quantity_kg?: number;
          status?: Database["public"]["Enums"]["trade_status"];
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      conversations: {
        Row: {
          id: string;
          trade_request_id: string | null;
          purchase_request_id: string | null;
          listing_id: string | null;
          participant_1_id: string;
          participant_2_id: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          trade_request_id?: string | null;
          purchase_request_id?: string | null;
          listing_id?: string | null;
          participant_1_id: string;
          participant_2_id: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          trade_request_id?: string | null;
          purchase_request_id?: string | null;
          listing_id?: string | null;
          participant_1_id?: string;
          participant_2_id?: string;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      messages: {
        Row: {
          id: string;
          conversation_id: string;
          sender_id: string;
          content: string;
          image_url: string | null;
          image_urls: string[] | null;
          read_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          conversation_id: string;
          sender_id: string;
          content: string;
          image_url?: string | null;
          image_urls?: string[] | null;
          read_at?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          conversation_id?: string;
          sender_id?: string;
          content?: string;
          image_url?: string | null;
          image_urls?: string[] | null;
          read_at?: string | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "messages_conversation_id_fkey";
            columns: ["conversation_id"];
            isOneToOne: false;
            referencedRelation: "conversations";
            referencedColumns: ["id"];
          },
        ];
      };
      notifications: {
        Row: {
          id: string;
          user_id: string;
          type: string;
          title: string;
          message: string;
          link: string | null;
          read_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          type: string;
          title: string;
          message: string;
          link?: string | null;
          read_at?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          type?: string;
          title?: string;
          message?: string;
          link?: string | null;
          read_at?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      announcements: {
        Row: {
          id: string;
          lgu_admin_id: string;
          title: string;
          content: string;
          category: string;
          importance: string;
          status: string;
          published_at: string | null;
          created_at: string;
          updated_at: string;
          image_url: string | null;
          images: string | null;
        };
        Insert: {
          id?: string;
          lgu_admin_id: string;
          title: string;
          content: string;
          category?: string;
          importance?: string;
          status?: string;
          published_at?: string | null;
          created_at?: string;
          updated_at?: string;
          image_url?: string | null;
          images?: string | null;
        };
        Update: {
          id?: string;
          lgu_admin_id?: string;
          title?: string;
          content?: string;
          category?: string;
          importance?: string;
          status?: string;
          published_at?: string | null;
          created_at?: string;
          updated_at?: string;
          image_url?: string | null;
          images?: string | null;
        };
        Relationships: [];
      };
      announcement_reactions: {
        Row: {
          id: string;
          announcement_id: string;
          user_id: string;
          reaction_type: "like" | "love" | "helpful" | "support";
          created_at: string;
        };
        Insert: {
          id?: string;
          announcement_id: string;
          user_id: string;
          reaction_type: "like" | "love" | "helpful" | "support";
          created_at?: string;
        };
        Update: {
          id?: string;
          announcement_id?: string;
          user_id?: string;
          reaction_type?: "like" | "love" | "helpful" | "support";
          created_at?: string;
        };
        Relationships: [];
      };
      announcement_comments: {
        Row: {
          id: string;
          announcement_id: string;
          user_id: string;
          content: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          announcement_id: string;
          user_id: string;
          content: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          announcement_id?: string;
          user_id?: string;
          content?: string;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      feed_comments: {
        Row: {
          id: string;
          post_id: string;
          user_id: string;
          content: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          post_id: string;
          user_id: string;
          content: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          post_id?: string;
          user_id?: string;
          content?: string;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      feed_reactions: {
        Row: {
          id: string;
          post_id: string;
          user_id: string;
          reaction_type: "like" | "love" | "helpful" | "support";
          created_at: string;
        };
        Insert: {
          id?: string;
          post_id: string;
          user_id: string;
          reaction_type: "like" | "love" | "helpful" | "support";
          created_at?: string;
        };
        Update: {
          id?: string;
          post_id?: string;
          user_id?: string;
          reaction_type?: "like" | "love" | "helpful" | "support";
          created_at?: string;
        };
        Relationships: [];
      };
      compost_inventory: {
        Row: {
          id: string;
          lgu_id: string;
          compost_type: string;
          quantity_kg: number;
          production_date: string;
          expiry_date: string | null;
          status: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          lgu_id: string;
          compost_type: string;
          quantity_kg: number;
          production_date: string;
          expiry_date?: string | null;
          status?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          lgu_id?: string;
          compost_type?: string;
          quantity_kg?: number;
          production_date?: string;
          expiry_date?: string | null;
          status?: string;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      compost_requests: {
        Row: {
          id: string;
          farmer_id: string;
          farmer_name: string;
          compost_inventory_id: string;
          quantity_requested_kg: number;
          request_date: string;
          collection_date: string | null;
          notes: string | null;
          status: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          farmer_id: string;
          farmer_name: string;
          compost_inventory_id: string;
          quantity_requested_kg: number;
          request_date: string;
          collection_date?: string | null;
          notes?: string | null;
          status?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          farmer_id?: string;
          farmer_name?: string;
          compost_inventory_id?: string;
          quantity_requested_kg?: number;
          request_date?: string;
          collection_date?: string | null;
          notes?: string | null;
          status?: string;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      food_waste_reports: {
        Row: {
          id: string;
          restaurant_id: string;
          restaurant_name: string;
          waste_type: string;
          quantity_kg: number;
          collection_date: string;
          collection_address: string;
          status: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          restaurant_id: string;
          restaurant_name: string;
          waste_type: string;
          quantity_kg: number;
          collection_date: string;
          collection_address: string;
          status?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          restaurant_id?: string;
          restaurant_name?: string;
          waste_type?: string;
          quantity_kg?: number;
          collection_date?: string;
          collection_address?: string;
          status?: string;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      waste_collections: {
        Row: {
          id: string;
          waste_report_id: string;
          collector_id: string;
          collector_name: string;
          scheduled_date: string;
          completed_date: string | null;
          status: string;
          notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          waste_report_id: string;
          collector_id: string;
          collector_name: string;
          scheduled_date: string;
          completed_date?: string | null;
          status?: string;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          waste_report_id?: string;
          collector_id?: string;
          collector_name?: string;
          scheduled_date?: string;
          completed_date?: string | null;
          status?: string;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      transaction_ratings: {
        Row: {
          id: string;
          transaction_id: string;
          transaction_type: string;
          rater_id: string;
          rated_user_id: string;
          rating: number;
          review: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          transaction_id: string;
          transaction_type: string;
          rater_id: string;
          rated_user_id: string;
          rating: number;
          review?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          transaction_id?: string;
          transaction_type?: string;
          rater_id?: string;
          rated_user_id?: string;
          rating?: number;
          review?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      harvest_forecasts: {
        Row: {
          id: string;
          user_id: string;
          farmer_name: string;
          crop_type: string;
          estimated_quantity_kg: number;
          projected_harvest_date: string;
          municipality: string;
          barangay: string;
          notes: string | null;
          images: string[] | null;
          status: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          farmer_name: string;
          crop_type: string;
          estimated_quantity_kg: number;
          projected_harvest_date: string;
          municipality: string;
          barangay: string;
          notes?: string | null;
          images?: string[] | null;
          status?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          farmer_name?: string;
          crop_type?: string;
          estimated_quantity_kg?: number;
          projected_harvest_date?: string;
          municipality?: string;
          barangay?: string;
          notes?: string | null;
          images?: string[] | null;
          status?: string;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      lgu_distributions: {
        Row: {
          id: string;
          user_id: string;
          lgu_name: string;
          distribution_type: string;
          title: string;
          description: string;
          distribution_date: string;
          location: string;
          target_beneficiaries: string[];
          municipality: string;
          barangay: string[];
          quantity_available: number | null;
          images: string[] | null;
          status: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          lgu_name: string;
          distribution_type: string;
          title: string;
          description: string;
          distribution_date: string;
          location: string;
          target_beneficiaries?: string[];
          municipality: string;
          barangay?: string[];
          quantity_available?: number | null;
          images?: string[] | null;
          status?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          lgu_name?: string;
          distribution_type?: string;
          title?: string;
          description?: string;
          distribution_date?: string;
          location?: string;
          target_beneficiaries?: string[];
          municipality?: string;
          barangay?: string[];
          quantity_available?: number | null;
          images?: string[] | null;
          status?: string;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      projected_waste_reports: {
        Row: {
          id: string;
          user_id: string;
          business_name: string;
          business_type: string;
          estimated_quantity_kg: number;
          projected_date: string;
          waste_type: string;
          municipality: string;
          barangay: string;
          notes: string | null;
          images: string[] | null;
          status: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          business_name: string;
          business_type: string;
          estimated_quantity_kg: number;
          projected_date: string;
          waste_type: string;
          municipality: string;
          barangay: string;
          notes?: string | null;
          images?: string[] | null;
          status?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          business_name?: string;
          business_type?: string;
          estimated_quantity_kg?: number;
          projected_date?: string;
          waste_type?: string;
          municipality?: string;
          barangay?: string;
          notes?: string | null;
          images?: string[] | null;
          status?: string;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      chat_messages: {
        Row: {
          id: string;
          user_id: string;
          message: string;
          response: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          message: string;
          response: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          message?: string;
          response?: string;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      app_role: "farmer" | "restaurant" | "resident" | "lgu_admin" | "super_admin";
      listing_kind: "produce" | "waste" | "compost";
      trade_status: "pending" | "accepted" | "rejected" | "completed" | "cancelled";
      transaction_type: "sell_only" | "barter_only" | "sell_and_barter";
      municipality:
        | "burgos"
        | "dapa"
        | "general_luna"
        | "pilar"
        | "san_benito"
        | "san_isidro"
        | "santa_monica"
        | "socorro"
        | "del_carmen";
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
}
