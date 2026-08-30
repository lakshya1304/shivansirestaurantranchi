import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { API_BASE_URL } from "./db";

export function useOrderStream() {
  const queryClient = useQueryClient();

  useEffect(() => {
    // Determine full URL, e.g. /api/v1/data/orders/stream
    const streamUrl = `${API_BASE_URL}/data/orders/stream`;
    
    const eventSource = new EventSource(streamUrl, {
      withCredentials: true,
    });

    eventSource.onopen = () => {
      console.log("Order stream connected.");
    };

    eventSource.addEventListener("order_created", (event) => {
      console.log("Real-time event: order_created", event.data);
      queryClient.invalidateQueries({ queryKey: ["orders"] });
    });

    eventSource.addEventListener("order_updated", (event) => {
      console.log("Real-time event: order_updated", event.data);
      queryClient.invalidateQueries({ queryKey: ["orders"] });
    });

    eventSource.onerror = (err) => {
      console.error("Order stream error:", err);
      // EventSource automatically attempts to reconnect
    };

    return () => {
      eventSource.close();
    };
  }, [queryClient]);
}
