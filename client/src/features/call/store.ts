import { create } from 'zustand';
import { CallState, CallOptions, CallParticipant } from './types';

interface CallStore extends CallState {
  startCall: (participantId: string, options: CallOptions) => Promise<void>;
  endCall: () => void;
  toggleMute: () => void;
  toggleVideo: () => void;
  toggleScreenShare: () => Promise<void>;
  addParticipant: (participant: CallParticipant) => void;
  removeParticipant: (participantId: string) => void;
  updateParticipant: (participantId: string, updates: Partial<CallParticipant>) => void;
}

export const useCallStore = create<CallStore>((set, get) => ({
  isInCall: false,
  isCallActive: false,
  participants: {},
  localStream: null,
  screenStream: null,
  error: null,

  startCall: async (participantId, options) => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: options.audio,
        video: options.video,
      });

      set({
        isInCall: true,
        isCallActive: true,
        localStream: stream,
        participants: {
          [participantId]: {
            id: participantId,
            stream: null,
            isMuted: false,
            isVideoOff: false,
            isScreenSharing: false,
          },
        },
      });

      // TODO: Implement WebRTC connection
    } catch (error) {
      set({ error: (error as Error).message });
    }
  },

  endCall: () => {
    const { localStream, screenStream } = get();
    if (localStream) {
      localStream.getTracks().forEach((track) => track.stop());
    }
    if (screenStream) {
      screenStream.getTracks().forEach((track) => track.stop());
    }

    set({
      isInCall: false,
      isCallActive: false,
      participants: {},
      localStream: null,
      screenStream: null,
    });
  },

  toggleMute: () => {
    const { localStream } = get();
    if (localStream) {
      const audioTrack = localStream.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
      }
    }
  },

  toggleVideo: () => {
    const { localStream } = get();
    if (localStream) {
      const videoTrack = localStream.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
      }
    }
  },

  toggleScreenShare: async () => {
    try {
      const { screenStream } = get();
      if (screenStream) {
        screenStream.getTracks().forEach((track) => track.stop());
        set({ screenStream: null });
      } else {
        const stream = await navigator.mediaDevices.getDisplayMedia({
          video: true,
        });
        set({ screenStream: stream });
      }
    } catch (error) {
      set({ error: (error as Error).message });
    }
  },

  addParticipant: (participant) => {
    set((state) => ({
      participants: {
        ...state.participants,
        [participant.id]: participant,
      },
    }));
  },

  removeParticipant: (participantId) => {
    set((state) => {
      const { [participantId]: removed, ...remaining } = state.participants;
      return { participants: remaining };
    });
  },

  updateParticipant: (participantId, updates) => {
    set((state) => ({
      participants: {
        ...state.participants,
        [participantId]: {
          ...state.participants[participantId],
          ...updates,
        },
      },
    }));
  },
})); 