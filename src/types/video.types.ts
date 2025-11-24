// src/types/video.types.ts

export interface VideoCallConfig {
    channelName: string;
    token: string;
    uid: number;
    classId: string;
    isTeacher: boolean;
    teacherName?: string;
    studentName?: string;
  }
  
  export interface VideoCallParticipant {
    uid: number;
    name: string;
    isTeacher: boolean;
    isAudioMuted: boolean;
    isVideoMuted: boolean;
  }
  
  export interface VideoCallStats {
    duration: number; // en segundos
    networkQuality: 'excellent' | 'good' | 'poor' | 'bad' | 'unknown';
    participants: VideoCallParticipant[];
  }
  
  export enum VideoCallStatus {
    Idle = 'idle',
    Connecting = 'connecting',
    Connected = 'connected',
    Reconnecting = 'reconnecting',
    Disconnected = 'disconnected',
    Failed = 'failed',
  }
  
  export interface AgoraEngineEvents {
    onJoinChannelSuccess: (channel: string, uid: number, elapsed: number) => void;
    onUserJoined: (uid: number, elapsed: number) => void;
    onUserOffline: (uid: number, reason: number) => void;
    onError: (error: number) => void;
    onNetworkQuality: (uid: number, txQuality: number, rxQuality: number) => void;
    onRtcStats: (stats: any) => void;
    onRemoteVideoStateChanged: (uid: number, state: number, reason: number) => void;
    onRemoteAudioStateChanged: (uid: number, state: number, reason: number) => void;
  }
  
  export interface VideoCallSettings {
    enableVideo: boolean;
    enableAudio: boolean;
    enableBeauty: boolean;
    videoProfile: 'low' | 'medium' | 'high';
  }