import { useEffect, useRef, useState, useCallback } from 'react';
import { useSocket } from './useSocket';
import { useToast } from '@/hooks/use-toast';

interface PeerConnection {
  peerId: string;
  connection: RTCPeerConnection;
  stream?: MediaStream;
}

const ICE_SERVERS = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
  ],
};

export const useWebRTC = (roomId: string, userId: string) => {
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStreams, setRemoteStreams] = useState<Map<string, MediaStream>>(new Map());
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);
  const [isVideoEnabled, setIsVideoEnabled] = useState(true);
  const [isInCall, setIsInCall] = useState(false);
  const [participants, setParticipants] = useState<string[]>([]);

  const peerConnections = useRef<Map<string, RTCPeerConnection>>(new Map());
  const socket = useSocket();
  const { toast } = useToast();

  const removePeer = useCallback((peerId: string) => {
    const pc = peerConnections.current.get(peerId);
    if (pc) {
      pc.close();
      peerConnections.current.delete(peerId);
    }
    setRemoteStreams((prev) => {
      const newMap = new Map(prev);
      newMap.delete(peerId);
      return newMap;
    });
    setParticipants((prev) => prev.filter((p) => p !== peerId));
  }, []);

  const createPeerConnection = useCallback((peerId: string) => {
    const pc = new RTCPeerConnection(ICE_SERVERS);

    pc.onicecandidate = (event) => {
      if (event.candidate && socket) {
        socket.emit('webrtc-signal', {
          type: 'ice-candidate',
          payload: {
            candidate: event.candidate,
            from: userId,
            to: peerId,
          },
          roomId
        });
      }
    };

    pc.ontrack = (event) => {
      console.log('Received remote track from', peerId);
      setRemoteStreams((prev) => {
        const newMap = new Map(prev);
        newMap.set(peerId, event.streams[0]);
        return newMap;
      });
    };

    pc.onconnectionstatechange = () => {
      if (pc.connectionState === 'disconnected' || pc.connectionState === 'failed') {
        removePeer(peerId);
      }
    };

    return pc;
  }, [userId, removePeer, socket, roomId]);

  const startCall = useCallback(async () => {
    if (!socket) return;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      });
      setLocalStream(stream);
      setIsInCall(true);

      socket.emit('join-video-room', { roomId, userId });

      toast({
        title: 'Call started',
        description: 'You are now in the video call',
      });
    } catch (error) {
      console.error('Error starting call:', error);
      toast({
        title: 'Error',
        description: 'Failed to access camera/microphone',
        variant: 'destructive',
      });
    }
  }, [roomId, userId, toast, socket]);

  useEffect(() => {
    if (!socket) return;

    socket.on('user-joined-video', async ({ userId: peerId }: { userId: string }) => {
      if (peerId !== userId) {
        console.log('Peer joined video:', peerId);
        const pc = createPeerConnection(peerId);
        peerConnections.current.set(peerId, pc);

        if (localStream) {
          localStream.getTracks().forEach((track) => {
            pc.addTrack(track, localStream);
          });
        }

        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);

        socket.emit('webrtc-signal', {
          type: 'offer',
          payload: {
            offer,
            from: userId,
            to: peerId,
          },
          roomId
        });
      }
    });

    socket.on('user-left-video', ({ userId: peerId }: { userId: string }) => {
      removePeer(peerId);
    });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    socket.on('webrtc-signal', async (data: any) => {
      const { type, payload } = data;
      if (payload.to !== userId) return;

      if (type === 'offer') {
        const pc = createPeerConnection(payload.from);
        peerConnections.current.set(payload.from, pc);

        if (localStream) {
          localStream.getTracks().forEach((track) => {
            pc.addTrack(track, localStream);
          });
        }

        await pc.setRemoteDescription(payload.offer);
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);

        socket.emit('webrtc-signal', {
          type: 'answer',
          payload: {
            answer,
            from: userId,
            to: payload.from,
          },
          roomId
        });
      } else if (type === 'answer') {
        const pc = peerConnections.current.get(payload.from);
        if (pc) {
          await pc.setRemoteDescription(payload.answer);
        }
      } else if (type === 'ice-candidate') {
        const pc = peerConnections.current.get(payload.from);
        if (pc && payload.candidate) {
          await pc.addIceCandidate(payload.candidate);
        }
      }
    });

    return () => {
      socket.off('user-joined-video');
      socket.off('user-left-video');
      socket.off('webrtc-signal');
    };
  }, [socket, userId, createPeerConnection, removePeer, localStream, roomId]);

  const endCall = useCallback(() => {
    if (localStream) {
      localStream.getTracks().forEach((track) => track.stop());
      setLocalStream(null);
    }

    peerConnections.current.forEach((pc) => pc.close());
    peerConnections.current.clear();

    if (socket) {
      socket.emit('leave-video-room', { roomId, userId });
    }

    setRemoteStreams(new Map());
    setParticipants([]);
    setIsInCall(false);

    toast({
      title: 'Call ended',
      description: 'You have left the video call',
    });
  }, [localStream, toast, socket, roomId, userId]);

  const toggleAudio = useCallback(() => {
    if (localStream) {
      const audioTrack = localStream.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setIsAudioEnabled(audioTrack.enabled);
      }
    }
  }, [localStream]);

  const toggleVideo = useCallback(() => {
    if (localStream) {
      const videoTrack = localStream.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setIsVideoEnabled(videoTrack.enabled);
      }
    }
  }, [localStream]);

  // Cleanup on unmount
  useEffect(() => {
    const connections = peerConnections.current;
    return () => {
      if (localStream) {
        localStream.getTracks().forEach((track) => track.stop());
      }
      connections.forEach((pc) => pc.close());
    };
  }, [localStream]);

  return {
    localStream,
    remoteStreams,
    isAudioEnabled,
    isVideoEnabled,
    isInCall,
    participants,
    startCall,
    endCall,
    toggleAudio,
    toggleVideo,
  };
};
