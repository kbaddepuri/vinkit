import { useState, useRef, useCallback, useEffect } from 'react';
import toast from 'react-hot-toast';

interface UseWebRTCReturn {
  localStream: MediaStream | null;
  remoteStreams: Record<string, MediaStream>;
  isMuted: boolean;
  isVideoOff: boolean;
  toggleMute: () => void;
  toggleVideo: () => void;
  startScreenShare: () => Promise<void>;
  stopScreenShare: () => void;
  leaveCall: () => void;
  cleanup: () => void;
  handleSignalingMessage: (message: any) => Promise<void>;
  initiatePeerConnection: (targetUserId: string) => Promise<void>;
}

export const useWebRTC = (
  roomId: string,
  userId: string,
  onSignalingMessage?: (message: any) => void
): UseWebRTCReturn => {
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStreams, setRemoteStreams] = useState<Record<string, MediaStream>>({});
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);

  const peerConnections = useRef<Record<string, RTCPeerConnection>>({});
  const localStreamRef = useRef<MediaStream | null>(null);
  const screenStreamRef = useRef<MediaStream | null>(null);

  // Create peer connection
  const createPeerConnection = useCallback((targetUserId: string) => {
    // ICE servers configuration
    const iceServers = {
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' },
        { urls: 'stun:stun2.l.google.com:19302' },
      ],
    };
    
    const peerConnection = new RTCPeerConnection(iceServers);
    peerConnections.current[targetUserId] = peerConnection;

    // Add local stream tracks
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => {
        peerConnection.addTrack(track, localStreamRef.current!);
      });
    }

    // Handle remote stream
    peerConnection.ontrack = (event) => {
      console.log('🎥 Received remote track from:', targetUserId);
      const [remoteStream] = event.streams;
      console.log('🎥 Remote stream:', remoteStream);
      setRemoteStreams(prev => ({
        ...prev,
        [targetUserId]: remoteStream,
      }));
      console.log('✅ Remote stream added for:', targetUserId);
    };

    // Handle ICE candidates
    peerConnection.onicecandidate = (event) => {
      if (event.candidate && onSignalingMessage) {
        onSignalingMessage({
          type: 'ice_candidate',
          target_user: targetUserId,
          candidate: event.candidate,
        });
      }
    };

    return peerConnection;
  }, [onSignalingMessage]);

  // Handle signaling messages
  const handleSignalingMessage = useCallback(async (message: any) => {
    const { type, from_user, offer, answer, candidate } = message;
    console.log('🔄 Handling WebRTC signaling:', type, 'from:', from_user);

    if (!peerConnections.current[from_user]) {
      console.log('🆕 Creating new peer connection for:', from_user);
      createPeerConnection(from_user);
    }

    const peerConnection = peerConnections.current[from_user];

    switch (type) {
      case 'webrtc_offer':
        try {
          console.log('📥 Processing WebRTC offer from:', from_user);
          await peerConnection.setRemoteDescription(offer);
          const answer = await peerConnection.createAnswer();
          await peerConnection.setLocalDescription(answer);
          
          if (onSignalingMessage) {
            console.log('📤 Sending WebRTC answer to:', from_user);
            onSignalingMessage({
              type: 'webrtc_answer',
              target_user: from_user,
              answer: answer,
            });
          }
        } catch (error) {
          console.error('❌ Error handling offer:', error);
        }
        break;

      case 'webrtc_answer':
        try {
          console.log('📥 Processing WebRTC answer from:', from_user);
          await peerConnection.setRemoteDescription(answer);
        } catch (error) {
          console.error('❌ Error handling answer:', error);
        }
        break;

      case 'ice_candidate':
        try {
          console.log('🧊 Processing ICE candidate from:', from_user);
          await peerConnection.addIceCandidate(candidate);
        } catch (error) {
          console.error('❌ Error adding ICE candidate:', error);
        }
        break;

      default:
        console.warn('❓ Unknown signaling message type:', type);
        break;
    }
  }, [createPeerConnection, onSignalingMessage]);

  // Initiate peer connection with another user
  const initiatePeerConnection = useCallback(async (targetUserId: string) => {
    console.log('🚀 Initiating peer connection with:', targetUserId);
    
    if (!localStreamRef.current) {
      console.log('❌ No local stream available for peer connection');
      return;
    }

    console.log('✅ Local stream available, creating peer connection');
    const peerConnection = createPeerConnection(targetUserId);
    
    try {
      console.log('📤 Creating WebRTC offer for:', targetUserId);
      const offer = await peerConnection.createOffer();
      await peerConnection.setLocalDescription(offer);
      
      if (onSignalingMessage) {
        console.log('📤 Sending WebRTC offer to:', targetUserId);
        onSignalingMessage({
          type: 'webrtc_offer',
          target_user: targetUserId,
          offer: offer,
        });
      }
    } catch (error) {
      console.error('❌ Error creating offer:', error);
    }
  }, [createPeerConnection, onSignalingMessage]);

  const initializeLocalStream = useCallback(async () => {
    try {
      // Clean up existing stream first
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach(track => track.stop());
        localStreamRef.current = null;
        setLocalStream(null);
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 1920, min: 1280 },
          height: { ideal: 1080, min: 720 },
          frameRate: { ideal: 30, min: 15 },
          facingMode: 'user'
        },
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }
      });
      console.log('Got local stream:', stream);
      console.log('Video tracks:', stream.getVideoTracks());
      console.log('Audio tracks:', stream.getAudioTracks());
      setLocalStream(stream);
      localStreamRef.current = stream;
    } catch (error) {
      console.error('Error accessing media devices:', error);
      toast.error('Failed to access camera and microphone');
    }
  }, []);

  const toggleMute = useCallback(() => {
    if (localStreamRef.current) {
      const audioTracks = localStreamRef.current.getAudioTracks();
      audioTracks.forEach(track => {
        track.enabled = isMuted;
      });
      setIsMuted(!isMuted);
    }
  }, [isMuted]);

  const toggleVideo = useCallback(async () => {
    console.log('toggleVideo called, isVideoOff:', isVideoOff);
    
    if (isVideoOff) {
      // Turning camera ON - get fresh video stream
      console.log('Turning camera ON...');
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            width: { ideal: 1920, min: 1280 },
            height: { ideal: 1080, min: 720 },
            frameRate: { ideal: 30, min: 15 },
            facingMode: 'user'
          },
          audio: false, // Keep existing audio
        });
        
        console.log('Got new video stream:', stream);
        console.log('New video tracks:', stream.getVideoTracks());
        
        // Stop old video tracks
        if (localStreamRef.current) {
          const oldVideoTracks = localStreamRef.current.getVideoTracks();
          console.log('Stopping old video tracks:', oldVideoTracks);
          oldVideoTracks.forEach(track => track.stop());
        }
        
        // Create a completely new stream with both audio and video
        console.log('Creating new combined stream...');
        const audioStream = await navigator.mediaDevices.getUserMedia({
          video: false,
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true
          }
        });
        
        const combinedStream = new MediaStream([
          ...audioStream.getAudioTracks(),
          ...stream.getVideoTracks()
        ]);
        
        console.log('Created combined stream:', combinedStream);
        setLocalStream(combinedStream);
        localStreamRef.current = combinedStream;
        
        setIsVideoOff(false);
        console.log('Camera turned ON successfully');
      } catch (error) {
        console.error('Error turning on camera:', error);
        toast.error('Failed to turn on camera');
      }
    } else {
      // Turning camera OFF - completely destroy video stream
      console.log('Turning camera OFF...');
      if (localStreamRef.current) {
        const videoTracks = localStreamRef.current.getVideoTracks();
        console.log('Stopping video tracks:', videoTracks);
        
        // Stop all video tracks immediately
        videoTracks.forEach(track => {
          track.stop();
        });
        
        // Get audio tracks before destroying the stream
        const audioTracks = localStreamRef.current.getAudioTracks();
        
        // Completely destroy the current stream
        localStreamRef.current.getTracks().forEach(track => track.stop());
        localStreamRef.current = null;
        setLocalStream(null);
        
        // Create a completely new audio-only stream
        if (audioTracks.length > 0) {
          const audioOnlyStream = new MediaStream(audioTracks);
          console.log('Created audio-only stream:', audioOnlyStream);
          setLocalStream(audioOnlyStream);
          localStreamRef.current = audioOnlyStream;
        }
        
        // Force garbage collection to release camera resources
        setTimeout(() => {
          if (window.gc) {
            window.gc();
          }
        }, 200);
      }
      setIsVideoOff(true);
      console.log('Camera turned OFF successfully');
    }
  }, [isVideoOff]);

  const startScreenShare = useCallback(async () => {
    try {
      const screenStream = await navigator.mediaDevices.getDisplayMedia({
        video: true,
        audio: true,
      });

      screenStreamRef.current = screenStream;

      // Replace video track in all peer connections
      Object.values(peerConnections.current).forEach(peerConnection => {
        const videoTrack = screenStream.getVideoTracks()[0];
        const sender = peerConnection.getSenders().find(s => 
          s.track && s.track.kind === 'video'
        );
        if (sender) {
          sender.replaceTrack(videoTrack);
        }
      });

      // Handle screen share end
      screenStream.getVideoTracks()[0].onended = () => {
        // Stop screen sharing when user ends it
        if (screenStreamRef.current) {
          screenStreamRef.current.getTracks().forEach(track => track.stop());
          screenStreamRef.current = null;
        }
      };
    } catch (error) {
      console.error('Error starting screen share:', error);
      toast.error('Failed to start screen sharing');
    }
  }, []);

  const stopScreenShare = useCallback(() => {
    if (screenStreamRef.current) {
      screenStreamRef.current.getTracks().forEach(track => track.stop());
      screenStreamRef.current = null;

      // Restore camera video track
      if (localStreamRef.current) {
        const videoTrack = localStreamRef.current.getVideoTracks()[0];
        Object.values(peerConnections.current).forEach(peerConnection => {
          const sender = peerConnection.getSenders().find(s => 
            s.track && s.track.kind === 'video'
          );
          if (sender) {
            sender.replaceTrack(videoTrack);
          }
        });
      }

      toast.success('Screen sharing stopped');
    }
  }, [localStreamRef, peerConnections]);

  const leaveCall = useCallback(() => {
    // Stop local stream
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => track.stop());
    }

    // Stop screen share
    if (screenStreamRef.current) {
      screenStreamRef.current.getTracks().forEach(track => track.stop());
    }

    // Close all peer connections
    Object.values(peerConnections.current).forEach(peerConnection => {
      peerConnection.close();
    });
    peerConnections.current = {};

    // Reset state
    setLocalStream(null);
    setRemoteStreams({});
    setIsMuted(false);
    setIsVideoOff(false);
  }, []);

  // Expose signaling handler
  const cleanup = useCallback(() => {
    // Stop all local tracks
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => track.stop());
      localStreamRef.current = null;
    }
    
    // Stop screen share if active
    if (screenStreamRef.current) {
      screenStreamRef.current.getTracks().forEach(track => track.stop());
      screenStreamRef.current = null;
    }
    
    // Close all peer connections
    Object.values(peerConnections.current).forEach(peerConnection => {
      peerConnection.close();
    });
    peerConnections.current = {};
    
    setLocalStream(null);
    setRemoteStreams({});
    setIsMuted(false);
    setIsVideoOff(false);
  }, []);

  // Initialize local stream on mount
  useEffect(() => {
    initializeLocalStream();
    return () => {
      cleanup();
    };
  }, [initializeLocalStream, cleanup]);

  // Handle signaling messages from WebSocket
  useEffect(() => {
    if (onSignalingMessage) {
      // This will be called from the WebSocket hook
      // The actual message handling is done in handleSignalingMessage
    }
  }, [onSignalingMessage]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      cleanup();
    };
  }, [cleanup]);

  return {
    localStream,
    remoteStreams,
    isMuted,
    isVideoOff,
    toggleMute,
    toggleVideo,
    startScreenShare,
    stopScreenShare,
    leaveCall,
    cleanup,
    handleSignalingMessage,
    initiatePeerConnection,
  };
};
