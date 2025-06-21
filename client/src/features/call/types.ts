export interface CallParticipant {
  id: string;
  stream: MediaStream | null;
  isMuted: boolean;
  isVideoOff: boolean;
  isScreenSharing: boolean;
}

export interface CallState {
  isInCall: boolean;
  isCallActive: boolean;
  participants: Record<string, CallParticipant>;
  localStream: MediaStream | null;
  screenStream: MediaStream | null;
  error: string | null;
}

export interface CallOptions {
  audio: boolean;
  video: boolean;
  screenShare: boolean;
}

export interface CallMetadata {
  callId: string;
  participants: string[];
  startTime: Date;
  type: 'video' | 'audio';
  status: 'pending' | 'active' | 'ended';
} 