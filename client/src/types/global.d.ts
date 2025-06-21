declare module 'zustand' {
  export function create<T>(config: (set: any, get: any) => T): () => T & {
    setState: (partial: Partial<T>) => void;
    getState: () => T;
  };
}

interface Window {
  MediaStream: typeof MediaStream;
  RTCPeerConnection: typeof RTCPeerConnection;
  RTCSessionDescription: typeof RTCSessionDescription;
  RTCIceCandidate: typeof RTCIceCandidate;
} 