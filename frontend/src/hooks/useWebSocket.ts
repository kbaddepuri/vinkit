import { useState, useEffect, useRef, useCallback } from 'react';
import toast from 'react-hot-toast';

interface UseWebSocketReturn {
  isConnected: boolean;
  sendMessage: (message: any) => void;
}

export const useWebSocket = (
  userId: string,
  roomId: string,
  onMessage?: (message: any) => void
): UseWebSocketReturn => {
  const [isConnected, setIsConnected] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectAttempts = useRef(0);
  const maxReconnectAttempts = 5;
  const isConnectingRef = useRef(false);

  const connect = useCallback(() => {
    // Prevent multiple simultaneous connections
    if (isConnectingRef.current || (wsRef.current && wsRef.current.readyState === WebSocket.OPEN)) {
      console.log('🔌 WebSocket already connecting or connected, skipping...');
      return;
    }
    
    isConnectingRef.current = true;
    
    try {
      // Close existing connection first
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
      
      const wsUrl = process.env.REACT_APP_WS_URL || 'ws://localhost:8000';
      console.log('🔌 Connecting to WebSocket:', `${wsUrl}/ws/${userId}`);
      const ws = new WebSocket(`${wsUrl}/ws/${userId}`);
      wsRef.current = ws;

      ws.onopen = () => {
        console.log('🔌 WebSocket connected successfully');
        setIsConnected(true);
        reconnectAttempts.current = 0;
        isConnectingRef.current = false;
        
        // Join the room directly without using sendMessage
        try {
          ws.send(JSON.stringify({
            type: 'join_room',
            room_id: roomId,
          }));
          console.log('📤 Sent join_room message');
        } catch (error) {
          console.error('Error sending join_room message:', error);
        }
      };

      ws.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          console.log('🌐 WebSocket received:', message.type, message);
          
          // Handle different message types
          switch (message.type) {
            case 'webrtc_offer':
            case 'webrtc_answer':
            case 'ice_candidate':
              console.log('🔄 Forwarding WebRTC message to handler');
              // Forward WebRTC signaling messages
              if (onMessage) {
                onMessage(message);
              }
              break;
            default:
              console.log('📨 Forwarding other message to handler');
              if (onMessage) {
                onMessage(message);
              }
              break;
          }
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      };

      ws.onclose = (event) => {
        console.log('🔌 WebSocket connection closed:', event.code, event.reason);
        setIsConnected(false);
        isConnectingRef.current = false;
        
        // Only attempt to reconnect if it wasn't a manual close
        if (event.code !== 1000 && reconnectAttempts.current < maxReconnectAttempts) {
          reconnectAttempts.current++;
          const delay = Math.pow(2, reconnectAttempts.current) * 1000; // Exponential backoff
          console.log(`🔄 Attempting to reconnect in ${delay}ms (attempt ${reconnectAttempts.current}/${maxReconnectAttempts})`);
          
          reconnectTimeoutRef.current = setTimeout(() => {
            connect();
          }, delay);
        } else if (event.code !== 1000) {
          console.log('❌ Max reconnection attempts reached');
          toast.error('Connection lost. Please refresh the page.');
        }
      };

      ws.onerror = (error) => {
        console.error('❌ WebSocket error:', error);
        setIsConnected(false);
        isConnectingRef.current = false;
        toast.error('WebSocket connection error');
      };

    } catch (error) {
      console.error('Error creating WebSocket connection:', error);
      isConnectingRef.current = false;
      toast.error('Failed to connect to chat server');
    }
  }, [userId, roomId]); // Keep dependencies minimal

  const sendMessage = useCallback((message: any) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      try {
        console.log('📤 Sending WebSocket message:', message.type, message);
        wsRef.current.send(JSON.stringify(message));
      } catch (error) {
        console.error('Error sending WebSocket message:', error);
        toast.error('Failed to send message');
      }
    } else {
      console.warn('WebSocket not connected, message not sent:', message);
    }
  }, []);

  const disconnect = useCallback(() => {
    console.log('🔌 Disconnecting WebSocket...');
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
    }
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    setIsConnected(false);
    isConnectingRef.current = false;
  }, []);

  // Connect on mount and when userId/roomId change
  useEffect(() => {
    connect();
    return () => {
      disconnect();
    };
  }, [userId, roomId]); // Only depend on userId and roomId

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
    };
  }, []);

  return {
    isConnected,
    sendMessage,
  };
};
