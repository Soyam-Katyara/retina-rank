import { useEffect, useRef, useState, forwardRef, useImperativeHandle } from 'react';
import { AlertTriangle, Loader } from 'lucide-react';

interface WebcamPreviewProps {
  stream: MediaStream | null;
  onStreamError: () => void;
  focusLevel?: number;
  focusStatus?: string;
}

export interface WebcamPreviewHandle {
  getVideoElement: () => HTMLVideoElement | null;
}

export const WebcamPreview = forwardRef<WebcamPreviewHandle, WebcamPreviewProps>(
  ({ stream, onStreamError, focusLevel, focusStatus }, ref) => {
  const videoRef = useRef<HTMLVideoElement>(null);

  useImperativeHandle(ref, () => ({
    getVideoElement: () => videoRef.current,
  }));
  const [isStreamActive, setIsStreamActive] = useState(false);
  const [streamError, setStreamError] = useState<string | null>(null);
  const streamAttachAttemptRef = useRef(0);
  const [showVideo, setShowVideo] = useState(true); // Always show video element

  useEffect(() => {
    console.log('WebcamPreview: useEffect triggered with stream:', stream ? `Stream ${stream.id}` : 'No stream');
    
    if (!stream) {
      console.warn('WebcamPreview: No stream provided');
      setIsStreamActive(false);
      setStreamError('No camera stream available');
      return;
    }

    // Small delay to ensure video element is rendered
    const timer = setTimeout(() => {
      if (!videoRef.current) {
        console.error('WebcamPreview: Video ref not available after delay');
        setIsStreamActive(false);
        setStreamError('Video element not available');
        return;
      }

      attachStream();
    }, 50);

    return () => clearTimeout(timer);
  }, [stream]);

  const attachStream = () => {
    if (!stream || !videoRef.current) return;

    try {
      // Check if stream has active tracks
      const videoTracks = stream.getVideoTracks();
      console.log('WebcamPreview: Stream has', videoTracks.length, 'video tracks');
      
      if (videoTracks.length === 0) {
        throw new Error('Stream has no active video tracks');
      }

      // Check if any tracks are ended
      if (videoTracks.some(track => track.readyState === 'ended')) {
        throw new Error('Stream video tracks are ended');
      }

      console.log('WebcamPreview: Attaching stream to video element');
      videoRef.current.srcObject = stream;
      
      const handleLoadedMetadata = () => {
        console.log('WebcamPreview: Event - loadedmetadata');
        setIsStreamActive(true);
        setStreamError(null);
      };

      const handleCanPlay = () => {
        console.log('WebcamPreview: Event - canplay');
        setIsStreamActive(true);
        setStreamError(null);
      };

      const handlePlay = () => {
        console.log('WebcamPreview: Event - play');
        setIsStreamActive(true);
        setStreamError(null);
      };

      const handleError = (e: Event) => {
        const errorMsg = (e.target as HTMLVideoElement).error?.message || 'Unknown video error';
        console.error('WebcamPreview: Video element error -', errorMsg);
        setIsStreamActive(false);
        setStreamError('Camera stream failed');
        onStreamError();
      };

      // Add event listeners
      videoRef.current.addEventListener('loadedmetadata', handleLoadedMetadata);
      videoRef.current.addEventListener('canplay', handleCanPlay);
      videoRef.current.addEventListener('play', handlePlay);
      videoRef.current.addEventListener('error', handleError);

      // Force play with user gesture fallback
      console.log('WebcamPreview: Attempting to play video');
      videoRef.current.muted = true;
      videoRef.current.playsInline = true;
      
      const playPromise = videoRef.current.play();
      if (playPromise !== undefined) {
        playPromise
          .then(() => {
            console.log('WebcamPreview: Autoplay successful');
            setIsStreamActive(true);
            setStreamError(null);
          })
          .catch(err => {
            console.error('WebcamPreview: Autoplay failed:', err);
            // Still try to show it - may work with different browser settings
            setStreamError(null);
          });
      }

      streamAttachAttemptRef.current = 0;
    } catch (err: any) {
      console.error('WebcamPreview: Error attaching stream:', err.message);
      setStreamError(err.message || 'Failed to load camera');
      setIsStreamActive(false);
      streamAttachAttemptRef.current++;
      
      if (streamAttachAttemptRef.current > 1) {
        onStreamError();
      }
    }
  };

  return (
    <div className="fixed top-20 right-4 z-50 w-40 h-40 bg-black rounded-xl overflow-hidden border-4 border-green-500 shadow-2xl flex items-center justify-center">
      {/* Always render video element - it won't display until isStreamActive is true */}
      <video
        ref={videoRef}
        autoPlay={true}
        muted={true}
        playsInline={true}
        className={`w-full h-full object-cover ${!isStreamActive ? 'hidden' : ''}`}
        style={{
          transform: 'scaleX(-1)',
          WebkitTransform: 'scaleX(-1)',
        }}
      />

      {streamError && !isStreamActive ? (
        <div className="w-full h-full bg-red-900/80 flex flex-col items-center justify-center gap-2 p-2 absolute inset-0">
          <AlertTriangle className="h-8 w-8 text-red-500" />
          <p className="text-xs text-red-200 text-center font-semibold">{streamError}</p>
        </div>
      ) : isStreamActive ? (
        <>
          <div className="absolute bottom-2 left-2 flex items-center gap-1 text-xs bg-green-600/95 text-white px-2 py-1 rounded-full font-bold">
            <div className="w-2 h-2 rounded-full bg-green-300 animate-pulse" />
            LIVE
          </div>
          {focusLevel !== undefined && (
            <div className="absolute top-2 left-2 right-2 text-xs bg-black/70 text-white px-2 py-1 rounded font-medium text-center">
              Focus: {Math.round(focusLevel)}%
              {focusStatus && <span className="block text-[10px] opacity-80">{focusStatus}</span>}
            </div>
          )}
        </>
      ) : (
        <div className="flex flex-col items-center justify-center gap-2 w-full h-full bg-gray-900/80 absolute inset-0">
          <Loader className="h-6 w-6 text-gray-300 animate-spin" />
          <p className="text-xs text-gray-300 font-semibold">Initializing...</p>
        </div>
      )}
    </div>
  );
});

WebcamPreview.displayName = 'WebcamPreview';

