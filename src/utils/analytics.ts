import { supabase } from "@/integrations/supabase/client";

type EventName = 
  | "auth_success"
  | "project_created"
  | "upload_started"
  | "upload_completed"
  | "export_success";

interface TrackEventParams {
  eventName: EventName;
  userId?: string;
  metadata?: Record<string, any>;
}

// Get device type
const getDeviceType = (): string => {
  const ua = navigator.userAgent;
  if (/(tablet|ipad|playbook|silk)|(android(?!.*mobi))/i.test(ua)) {
    return "tablet";
  }
  if (
    /Mobile|iP(hone|od)|Android|BlackBerry|IEMobile|Kindle|Silk-Accelerated|(hpw|web)OS|Opera M(obi|ini)/.test(
      ua
    )
  ) {
    return "mobile";
  }
  return "desktop";
};

export const trackEvent = async ({
  eventName,
  userId,
  metadata = {},
}: TrackEventParams) => {
  try {
    const device = getDeviceType();
    
    // Get current user if not provided
    let finalUserId = userId;
    if (!finalUserId) {
      const { data: { user } } = await supabase.auth.getUser();
      finalUserId = user?.id;
    }

    const { error } = await supabase.from("analytics_events").insert({
      user_id: finalUserId || null,
      event_name: eventName,
      device,
      metadata,
      timestamp: new Date().toISOString(),
    });

    if (error) {
      console.error("Analytics tracking error:", error);
    }
  } catch (error) {
    console.error("Analytics tracking failed:", error);
  }
};

// Convenience functions for specific events
export const analytics = {
  trackAuthSuccess: (userId: string) =>
    trackEvent({ eventName: "auth_success", userId }),
  
  trackProjectCreated: (userId: string, metadata?: Record<string, any>) =>
    trackEvent({ eventName: "project_created", userId, metadata }),
  
  trackUploadStarted: (userId?: string, metadata?: Record<string, any>) =>
    trackEvent({ eventName: "upload_started", userId, metadata }),
  
  trackUploadCompleted: (userId?: string, metadata?: Record<string, any>) =>
    trackEvent({ eventName: "upload_completed", userId, metadata }),
  
  trackExportSuccess: (userId?: string, metadata?: Record<string, any>) =>
    trackEvent({ eventName: "export_success", userId, metadata }),
};