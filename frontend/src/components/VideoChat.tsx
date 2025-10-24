import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  IconButton,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Chip,
  Tooltip,
  Fab,
} from '@mui/material';
import {
  Mic,
  MicOff,
  Videocam,
  VideocamOff,
  CallEnd,
  ScreenShare,
  Settings,
  People,
  Chat,
  Fullscreen,
  FullscreenExit,
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuthStore } from '../store/authStore';
import { useWebRTC } from '../hooks/useWebRTC';
import { useWebSocket } from '../hooks/useWebSocket';
import VideoPlayer from './VideoPlayer';
import ChatPanel from './ChatPanel';
import toast from 'react-hot-toast';

const VideoChat: React.FC = () => {
  const { roomId } = useParams<{ roomId: string }>();
  const navigate = useNavigate();
  const { user, getUniqueUserId } = useAuthStore();
  const uniqueUserId = getUniqueUserId();
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [participants, setParticipants] = useState<string[]>([]);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  
  // Create a ref to store the signaling function
  const signalingRef = useRef<(message: any) => void>();

  const {
    localStream,
    remoteStreams,
    isMuted,
    isVideoOff,
    toggleMute,
    toggleVideo,
    startScreenShare,
    stopScreenShare,
    cleanup,
    handleSignalingMessage,
    initiatePeerConnection,
  } = useWebRTC(roomId!, uniqueUserId, (message) => signalingRef.current?.(message));

  // Create refs to store the latest values to avoid recreating the callback
  const uniqueUserIdRef = useRef(uniqueUserId);
  const initiatePeerConnectionRef = useRef(initiatePeerConnection);
  const handleSignalingMessageRef = useRef(handleSignalingMessage);
  
  // Update refs when values change
  useEffect(() => {
    uniqueUserIdRef.current = uniqueUserId;
  }, [uniqueUserId]);
  
  useEffect(() => {
    initiatePeerConnectionRef.current = initiatePeerConnection;
  }, [initiatePeerConnection]);
  
  useEffect(() => {
    handleSignalingMessageRef.current = handleSignalingMessage;
  }, [handleSignalingMessage]);

  // Handle WebSocket messages with stable callback
  const handleWebSocketMessage = useCallback((message: any) => {
    console.log('📨 WebSocket message:', message.type, message);
    
    switch (message.type) {
      case 'user_joined':
        console.log('👤 User joined:', message.user_id, 'My ID:', uniqueUserIdRef.current);
        if (message.user_id !== uniqueUserIdRef.current) {
          setParticipants(prev => [...prev.filter(p => p !== message.user_id), message.user_id]);
          console.log('🔗 Initiating peer connection with:', message.user_id);
          initiatePeerConnectionRef.current(message.user_id);
        }
        break;
        
      case 'user_left':
        console.log('👋 User left:', message.user_id);
        setParticipants(prev => prev.filter(p => p !== message.user_id));
        break;
        
      case 'participants':
        console.log('👥 Participants list:', message.participants);
        setParticipants(message.participants);
        // Initiate peer connections with existing participants
        message.participants.forEach((participantId: string) => {
          if (participantId !== uniqueUserIdRef.current) {
            console.log('🔗 Initiating peer connection with existing participant:', participantId);
            initiatePeerConnectionRef.current(participantId);
          }
        });
        break;
        
      case 'webrtc_offer':
        console.log('📤 Received WebRTC offer from:', message.from_user);
        handleSignalingMessageRef.current(message);
        break;
        
      case 'webrtc_answer':
        console.log('📥 Received WebRTC answer from:', message.from_user);
        handleSignalingMessageRef.current(message);
        break;
        
      case 'ice_candidate':
        console.log('🧊 Received ICE candidate from:', message.from_user);
        handleSignalingMessageRef.current(message);
        break;
        
      default:
        console.log('❓ Unknown message type:', message.type);
        break;
    }
  }, []); // Empty dependency array - callback is now stable

  const { isConnected, sendMessage } = useWebSocket(uniqueUserId, roomId!, handleWebSocketMessage);

  // Create a function to send WebRTC signaling messages through WebSocket
  const sendWebRTCSignaling = useCallback((message: any) => {
    console.log('📤 Sending WebRTC signaling through WebSocket:', message.type, message);
    sendMessage(message);
  }, [sendMessage]);

  // Update the signaling ref when the function is available
  useEffect(() => {
    signalingRef.current = sendWebRTCSignaling;
  }, [sendWebRTCSignaling]);

  const handleLeaveCall = () => {
    cleanup();
    navigate('/dashboard');
  };

  const handleScreenShare = async () => {
    if (isScreenSharing) {
      stopScreenShare();
      setIsScreenSharing(false);
    } else {
      try {
        await startScreenShare();
        setIsScreenSharing(true);
        toast.success('Screen sharing started');
      } catch (error) {
        toast.error('Failed to start screen sharing');
      }
    }
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  // Update participants list
  useEffect(() => {
    setParticipants([user!, ...Object.keys(remoteStreams)]);
  }, [user, remoteStreams]);

  // Put remote streams first (large) and local stream last (small)
  const allStreams = [
    ...Object.entries(remoteStreams).map(([id, stream]) => ({
      id,
      stream,
      isLocal: false,
    })),
    ...(localStream ? [{ id: 'local', stream: localStream, isLocal: true }] : []),
  ].filter(item => item.stream);

  // Debug logging
  console.log('Local stream:', localStream);
  console.log('Remote streams:', remoteStreams);
  console.log('All streams:', allStreams);

  const getGridLayout = (count: number) => {
    if (count === 1) return 'single';
    if (count === 2) return 'double';
    if (count <= 4) return 'quad';
    return 'many';
  };

  return (
    <Box sx={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <Box sx={{ 
        p: 2, 
        background: 'rgba(0, 0, 0, 0.8)',
        backdropFilter: 'blur(10px)',
        borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}>
        <Box display="flex" alignItems="center" gap={2}>
          <Typography variant="h6">Room: {roomId}</Typography>
          <Chip 
            label={isConnected ? 'Connected' : 'Connecting...'} 
            color={isConnected ? 'success' : 'warning'}
            size="small"
          />
          <Chip 
            label={`${participants.length} participants`}
            color="primary"
            size="small"
          />
        </Box>
        <Box display="flex" gap={1}>
          <Tooltip title="Participants">
            <IconButton color="inherit">
              <People />
            </IconButton>
          </Tooltip>
          <Tooltip title="Settings">
            <IconButton color="inherit" onClick={() => setShowSettings(true)}>
              <Settings />
            </IconButton>
          </Tooltip>
          <Tooltip title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}>
            <IconButton color="inherit" onClick={toggleFullscreen}>
              {isFullscreen ? <FullscreenExit /> : <Fullscreen />}
            </IconButton>
          </Tooltip>
        </Box>
      </Box>

      {/* Video Grid */}
      <Box sx={{ flex: 1, p: 2, overflow: 'hidden' }}>
        <Box 
          className={`video-grid ${getGridLayout(allStreams.length)}`}
          sx={{ height: '100%' }}
        >
          <AnimatePresence>
            {allStreams.map(({ id, stream, isLocal }) => (
              <motion.div
                key={id}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                transition={{ duration: 0.3 }}
                style={{ height: '100%' }}
              >
                <VideoPlayer
                  stream={stream}
                  isLocal={isLocal}
                  userId={isLocal ? user! : id}
                  isMuted={isLocal ? isMuted : false}
                  isVideoOff={isLocal ? isVideoOff : false}
                />
              </motion.div>
            ))}
          </AnimatePresence>
        </Box>
      </Box>


      {/* Controls */}
      <Box sx={{ 
        p: { xs: 1, sm: 2 }, 
        background: 'rgba(0, 0, 0, 0.8)',
        backdropFilter: 'blur(10px)',
        borderTop: '1px solid rgba(255, 255, 255, 0.1)',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        gap: { xs: 1, sm: 2 },
        flexWrap: 'wrap',
        minHeight: { xs: '60px', sm: 'auto' }
      }}>
        <Tooltip title={isMuted ? 'Unmute' : 'Mute'}>
          <Fab
            color={isMuted ? 'error' : 'primary'}
            onClick={toggleMute}
            size={{ xs: 'small', sm: 'medium' }}
            sx={{ 
              minWidth: { xs: '48px', sm: '56px' },
              minHeight: { xs: '48px', sm: '56px' }
            }}
          >
            {isMuted ? <MicOff /> : <Mic />}
          </Fab>
        </Tooltip>

        <Tooltip title={isVideoOff ? 'Turn on camera' : 'Turn off camera'}>
          <Fab
            color={isVideoOff ? 'error' : 'primary'}
            onClick={toggleVideo}
            size={{ xs: 'small', sm: 'medium' }}
            sx={{ 
              minWidth: { xs: '48px', sm: '56px' },
              minHeight: { xs: '48px', sm: '56px' }
            }}
          >
            {isVideoOff ? <VideocamOff /> : <Videocam />}
          </Fab>
        </Tooltip>

        <Tooltip title={isScreenSharing ? 'Stop sharing' : 'Share screen'}>
          <Fab
            color={isScreenSharing ? 'error' : 'primary'}
            onClick={handleScreenShare}
            size={{ xs: 'small', sm: 'medium' }}
            sx={{ 
              minWidth: { xs: '48px', sm: '56px' },
              minHeight: { xs: '48px', sm: '56px' }
            }}
          >
            <ScreenShare />
          </Fab>
        </Tooltip>

        <Tooltip title="Chat">
          <Fab
            color={showChat ? 'secondary' : 'primary'}
            onClick={() => setShowChat(!showChat)}
            size={{ xs: 'small', sm: 'medium' }}
            sx={{ 
              minWidth: { xs: '48px', sm: '56px' },
              minHeight: { xs: '48px', sm: '56px' }
            }}
          >
            <Chat />
          </Fab>
        </Tooltip>

        <Tooltip title="Leave call">
          <Fab
            color="error"
            onClick={handleLeaveCall}
            size={{ xs: 'small', sm: 'medium' }}
            sx={{ 
              minWidth: { xs: '48px', sm: '56px' },
              minHeight: { xs: '48px', sm: '56px' }
            }}
          >
            <CallEnd />
          </Fab>
        </Tooltip>
      </Box>

      {/* Chat Panel */}
      <AnimatePresence>
        {showChat && (
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 20, stiffness: 300 }}
            style={{
              position: 'absolute',
              right: 0,
              top: 0,
              height: '100%',
              width: window.innerWidth < 768 ? '100%' : '400px',
              background: 'rgba(0, 0, 0, 0.9)',
              backdropFilter: 'blur(10px)',
              borderLeft: window.innerWidth < 768 ? 'none' : '1px solid rgba(255, 255, 255, 0.1)',
              zIndex: 1000,
            }}
          >
            <ChatPanel 
              roomId={roomId!} 
              onClose={() => setShowChat(false)} 
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Settings Dialog */}
      <Dialog open={showSettings} onClose={() => setShowSettings(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Settings</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary">
            Settings panel would go here with options for:
            <br />• Audio/Video quality
            <br />• Network settings
            <br />• Security preferences
            <br />• Notification settings
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowSettings(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default VideoChat;
