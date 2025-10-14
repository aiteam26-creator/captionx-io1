import { supabase } from "@/integrations/supabase/client";

interface Caption {
  word: string;
  start: number;
  end: number;
}

interface FrameData {
  imageData: number[];
  width: number;
  height: number;
  timestamp: number;
  jpegDataUrl?: string;
}

/**
 * Extracts frames from video at regular intervals for shot detection
 */
export const extractFramesForShotDetection = async (
  videoElement: HTMLVideoElement,
  sampleRate = 1 // Extract 1 frame per second
): Promise<FrameData[]> => {
  const frames: FrameData[] = [];
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  
  if (!ctx) throw new Error('Could not get canvas context');

  const duration = videoElement.duration;
  canvas.width = 320; // Reduced size for faster processing
  canvas.height = Math.floor((320 * videoElement.videoHeight) / videoElement.videoWidth);

  // Extract frames at intervals
  for (let time = 0; time < duration; time += sampleRate) {
    await new Promise<void>((resolve) => {
      videoElement.currentTime = time;
      videoElement.onseeked = () => {
        ctx.drawImage(videoElement, 0, 0, canvas.width, canvas.height);
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        
        // Also save as base64 JPEG for storage
        const jpegDataUrl = canvas.toDataURL('image/jpeg', 0.85);
        
        frames.push({
          imageData: Array.from(imageData.data),
          width: canvas.width,
          height: canvas.height,
          timestamp: time,
          jpegDataUrl
        });
        
        resolve();
      };
    });
  }

  return frames;
};

/**
 * Detects shots and extracts keyframes using edge function
 */
export const detectShotsAndExtractKeyframes = async (
  videoElement: HTMLVideoElement,
  videoId: string,
  captions: Caption[],
  onProgress?: (progress: number) => void
): Promise<any[]> => {
  // Extract frames
  onProgress?.(10);
  const frames = await extractFramesForShotDetection(videoElement);
  
  onProgress?.(30);
  
  // Send to edge function for shot detection
  const { data, error } = await supabase.functions.invoke('extract-keyframes', {
    body: {
      frames,
      videoId,
      captions
    }
  });

  if (error) throw error;
  if (!data || !data.keyframes) throw new Error('No keyframes received');

  onProgress?.(100);
  return data.keyframes;
};

/**
 * Retrieves keyframes for a specific video
 */
export const getKeyframesForVideo = async (videoId: string) => {
  const { data, error } = await supabase
    .from('keyframes')
    .select('*')
    .eq('video_id', videoId)
    .order('timestamp', { ascending: true });

  if (error) throw error;
  return data;
};
