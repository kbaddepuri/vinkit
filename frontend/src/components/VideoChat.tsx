import React, { useState, useEffect } from 'react';
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
  const { user } = useAuthStore();
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [participants, setParticipants] = useState<string[]>([]);
  const [isScreenSharing, setIsScreenSharing] = useState(false);

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
  } = useWebRTC(roomId!, user!);

  const { isConnected } = useWebSocket(user!, roomId!);

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

  const allStreams = [
    { id: 'local', stream: localStream, isLocal: true },
    ...Object.entries(remoteStreams).map(([id, stream]) => ({
      id,
      stream,
      isLocal: false,
    })),
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
        p: 2, 
        background: 'rgba(0, 0, 0, 0.8)',
        backdropFilter: 'blur(10px)',
        borderTop: '1px solid rgba(255, 255, 255, 0.1)',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 2
      }}>
        <Tooltip title={isMuted ? 'Unmute' : 'Mute'}>
          <Fab
            color={isMuted ? 'error' : 'primary'}
            onClick={toggleMute}
            size="medium"
          >
            {isMuted ? <MicOff /> : <Mic />}
          </Fab>
        </Tooltip>

        <Tooltip title={isVideoOff ? 'Turn on camera' : 'Turn off camera'}>
          <Fab
            color={isVideoOff ? 'error' : 'primary'}
            onClick={toggleVideo}
            size="medium"
          >
            {isVideoOff ? <VideocamOff /> : <Videocam />}
          </Fab>
        </Tooltip>

        <Tooltip title={isScreenSharing ? 'Stop sharing' : 'Share screen'}>
          <Fab
            color={isScreenSharing ? 'error' : 'primary'}
            onClick={handleScreenShare}
            size="medium"
          >
            <ScreenShare />
          </Fab>
        </Tooltip>

        <Tooltip title="Chat">
          <Fab
            color={showChat ? 'secondary' : 'primary'}
            onClick={() => setShowChat(!showChat)}
            size="medium"
          >
            <Chat />
          </Fab>
        </Tooltip>

        <Tooltip title="Leave call">
          <Fab
            color="error"
            onClick={handleLeaveCall}
            size="medium"
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
              width: '400px',
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
