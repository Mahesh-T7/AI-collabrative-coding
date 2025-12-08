import { useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Mic, MicOff, Video, VideoOff, PhoneOff, Phone } from 'lucide-react';
import { cn } from '@/lib/utils';

interface VideoCallProps {
  localStream: MediaStream | null;
  remoteStreams: Map<string, MediaStream>;
  isAudioEnabled: boolean;
  isVideoEnabled: boolean;
  isInCall: boolean;
  onStartCall: () => void;
  onEndCall: () => void;
  onToggleAudio: () => void;
  onToggleVideo: () => void;
}

const VideoTile = ({ stream, label, muted = false }: { stream: MediaStream; label: string; muted?: boolean }) => {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
    }
  }, [stream]);

  return (
    <div className="relative bg-[hsl(var(--editor-bg))] rounded-lg overflow-hidden aspect-video">
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted={muted}
        className="w-full h-full object-cover"
      />
      <div className="absolute bottom-2 left-2 px-2 py-1 bg-black/50 rounded text-xs text-white">
        {label}
      </div>
    </div>
  );
};

export const VideoCall = ({
  localStream,
  remoteStreams,
  isAudioEnabled,
  isVideoEnabled,
  isInCall,
  onStartCall,
  onEndCall,
  onToggleAudio,
  onToggleVideo,
}: VideoCallProps) => {
  if (!isInCall) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-4 p-4">
        <div className="text-center">
          <h3 className="text-lg font-semibold text-[hsl(var(--editor-text))]">Video Call</h3>
          <p className="text-sm text-[hsl(var(--editor-text-muted))] mt-1">
            Start a call to collaborate with your team
          </p>
        </div>
        <Button
          onClick={onStartCall}
          className="gap-2 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700"
        >
          <Phone className="w-4 h-4" />
          Start Call
        </Button>
      </div>
    );
  }

  const remoteStreamArray = Array.from(remoteStreams.entries());

  return (
    <div className="flex flex-col h-full">
      {/* Video Grid */}
      <div className="flex-1 p-2 overflow-y-auto">
        <div className={cn(
          "grid gap-2 h-full",
          remoteStreamArray.length === 0 && "grid-cols-1",
          remoteStreamArray.length === 1 && "grid-cols-1 grid-rows-2",
          remoteStreamArray.length >= 2 && "grid-cols-2"
        )}>
          {/* Local Video */}
          {localStream && (
            <VideoTile stream={localStream} label="You" muted />
          )}
          
          {/* Remote Videos */}
          {remoteStreamArray.map(([peerId, stream]) => (
            <VideoTile key={peerId} stream={stream} label={`User ${peerId.slice(0, 4)}`} />
          ))}
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center justify-center gap-3 p-4 border-t border-[hsl(var(--editor-border))]">
        <Button
          variant="outline"
          size="icon"
          onClick={onToggleAudio}
          className={cn(
            "rounded-full w-12 h-12",
            !isAudioEnabled && "bg-red-500/20 border-red-500 text-red-500"
          )}
        >
          {isAudioEnabled ? <Mic className="w-5 h-5" /> : <MicOff className="w-5 h-5" />}
        </Button>
        
        <Button
          variant="outline"
          size="icon"
          onClick={onToggleVideo}
          className={cn(
            "rounded-full w-12 h-12",
            !isVideoEnabled && "bg-red-500/20 border-red-500 text-red-500"
          )}
        >
          {isVideoEnabled ? <Video className="w-5 h-5" /> : <VideoOff className="w-5 h-5" />}
        </Button>
        
        <Button
          variant="destructive"
          size="icon"
          onClick={onEndCall}
          className="rounded-full w-12 h-12"
        >
          <PhoneOff className="w-5 h-5" />
        </Button>
      </div>
    </div>
  );
};
