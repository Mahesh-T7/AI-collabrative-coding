import { useEffect, useRef, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
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
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
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
      if (event.candidate && channelRef.current) {
        channelRef.current.send({
          type: 'broadcast',
          event: 'ice-candidate',
          payload: {
            candidate: event.candidate,
            from: userId,
            to: peerId,
          },
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
      console.log(`Connection state with ${peerId}:`, pc.connectionState);
      if (pc.connectionState === 'disconnected' || pc.connectionState === 'failed') {
        removePeer(peerId);
      }
    };

    return pc;
  }, [userId, removePeer]);



  const startCall = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      });
      setLocalStream(stream);
      setIsInCall(true);

      // Set up signaling channel
      const channel = supabase.channel(`video-call-${roomId}`, {
        config: { presence: { key: userId } },
      });

      channel
        .on('presence', { event: 'sync' }, () => {
          const state = channel.presenceState();
          const peers = Object.keys(state).filter((id) => id !== userId);
          setParticipants(peers);
        })
        .on('presence', { event: 'join' }, async ({ key }) => {
          if (key !== userId) {
            console.log('Peer joined:', key);
            // Create offer for new peer
            const pc = createPeerConnection(key);
            peerConnections.current.set(key, pc);

            stream.getTracks().forEach((track) => {
              pc.addTrack(track, stream);
            });

            const offer = await pc.createOffer();
            await pc.setLocalDescription(offer);

            channel.send({
              type: 'broadcast',
              event: 'offer',
              payload: {
                offer,
                from: userId,
                to: key,
              },
            });
          }
        })
        .on('presence', { event: 'leave' }, ({ key }) => {
          if (key !== userId) {
            console.log('Peer left:', key);
            removePeer(key);
          }
        })
        .on('broadcast', { event: 'offer' }, async ({ payload }) => {
          if (payload.to === userId) {
            console.log('Received offer from', payload.from);
            const pc = createPeerConnection(payload.from);
            peerConnections.current.set(payload.from, pc);

            stream.getTracks().forEach((track) => {
              pc.addTrack(track, stream);
            });

            await pc.setRemoteDescription(payload.offer);
            const answer = await pc.createAnswer();
            await pc.setLocalDescription(answer);

            channel.send({
              type: 'broadcast',
              event: 'answer',
              payload: {
                answer,
                from: userId,
                to: payload.from,
              },
            });
          }
        })
        .on('broadcast', { event: 'answer' }, async ({ payload }) => {
          if (payload.to === userId) {
            console.log('Received answer from', payload.from);
            const pc = peerConnections.current.get(payload.from);
            if (pc) {
              await pc.setRemoteDescription(payload.answer);
            }
          }
        })
        .on('broadcast', { event: 'ice-candidate' }, async ({ payload }) => {
          if (payload.to === userId) {
            const pc = peerConnections.current.get(payload.from);
            if (pc && payload.candidate) {
              await pc.addIceCandidate(payload.candidate);
            }
          }
        })
        .subscribe(async (status) => {
          if (status === 'SUBSCRIBED') {
            await channel.track({ online_at: new Date().toISOString() });
          }
        });

      channelRef.current = channel;

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
  }, [roomId, userId, createPeerConnection, removePeer, toast]);

  const endCall = useCallback(() => {
    // Stop local stream
    if (localStream) {
      localStream.getTracks().forEach((track) => track.stop());
      setLocalStream(null);
    }

    // Close all peer connections
    peerConnections.current.forEach((pc) => pc.close());
    peerConnections.current.clear();

    // Unsubscribe from channel
    if (channelRef.current) {
      channelRef.current.unsubscribe();
      channelRef.current = null;
    }

    setRemoteStreams(new Map());
    setParticipants([]);
    setIsInCall(false);

    toast({
      title: 'Call ended',
      description: 'You have left the video call',
    });
  }, [localStream, toast]);

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
      if (channelRef.current) {
        channelRef.current.unsubscribe();
      }
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
