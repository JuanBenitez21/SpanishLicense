import React, { useState, useRef, useEffect } from 'react';
import { View } from 'react-native';
import { Video, ResizeMode, AVPlaybackStatus } from 'expo-av';
import { useProgress } from '@/hooks/useProgress';

type VideoPlayerScreenProps = {
  route: any;
  navigation: any;
};

export default function VideoPlayerScreen({ route, navigation }: VideoPlayerScreenProps) {
  const { lesson } = route.params;
  const videoRef = useRef<Video>(null);
  const { updateProgress, completeLesson } = useProgress();
  const [status, setStatus] = useState<AVPlaybackStatus>({} as AVPlaybackStatus);

  // Actualizar progreso cada 5 segundos
  useEffect(() => {
    if (status.isLoaded && status.positionMillis && status.durationMillis) {
      const percentage = (status.positionMillis / status.durationMillis) * 100;

      if (percentage >= 95) {
        completeLesson(lesson.id);
      } else if (percentage > 0) {
        updateProgress(lesson.id, percentage);
      }
    }
  }, [status]);

  return (
    <View>
      <Video
        ref={videoRef}
        source={{ uri: lesson.video_url }}
        rate={1.0}
        volume={1.0}
        isMuted={false}
        resizeMode={ResizeMode.CONTAIN}
        shouldPlay
        isLooping={false}
        style={{ width: '100%', height: 300 }}
        onPlaybackStatusUpdate={setStatus}
      />
      {/* Agregar controles personalizados */}
    </View>
  );
}