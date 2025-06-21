import { toast } from 'sonner';

interface CallConfig {
  iceServers: RTCIceServer[];
  maxRetries?: number;
  retryDelay?: number;
}

interface CallState {
  peerConnection: RTCPeerConnection | null;
  localStream: MediaStream | null;
  remoteStream: MediaStream | null;
  isCallActive: boolean;
  isMuted: boolean;
  isVideoOff: boolean;
  isScreenSharing: boolean;
}

class CallService {
  private config: CallConfig;
  private state: CallState;
  private maxRetries: number;
  private retryDelay: number;
  private reconnectAttempts: number = 0;
  private reconnectTimeout: NodeJS.Timeout | null = null;

  constructor(config: CallConfig) {
    this.config = config;
    this.maxRetries = config.maxRetries || 3;
    this.retryDelay = config.retryDelay || 1000;
    this.state = {
      peerConnection: null,
      localStream: null,
      remoteStream: null,
      isCallActive: false,
      isMuted: false,
      isVideoOff: false,
      isScreenSharing: false
    };
  }

  public async startCall(participantId: string): Promise<void> {
    try {
      await this.requestPermissions();
      await this.initializeLocalStream();
      await this.createPeerConnection();
      await this.setupPeerConnectionHandlers();
      await this.createAndSendOffer(participantId);
      
      this.state.isCallActive = true;
      this.startConnectionMonitoring();
    } catch (error) {
      console.error('Failed to start call:', error);
      this.handleCallError(error);
      throw error;
    }
  }

  private async requestPermissions(): Promise<void> {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: true
      });
      stream.getTracks().forEach(track => track.stop());
    } catch (error) {
      console.error('Failed to get media permissions:', error);
      throw new Error('Camera and microphone access is required for video calls');
    }
  }

  private async initializeLocalStream(): Promise<void> {
    try {
      this.state.localStream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: true
      });
    } catch (error) {
      console.error('Failed to initialize local stream:', error);
      throw new Error('Failed to access camera and microphone');
    }
  }

  private async createPeerConnection(): Promise<void> {
    try {
      this.state.peerConnection = new RTCPeerConnection({
        iceServers: this.config.iceServers
      });

      // Add local stream tracks to peer connection
      this.state.localStream?.getTracks().forEach(track => {
        if (this.state.localStream && this.state.peerConnection) {
          this.state.peerConnection.addTrack(track, this.state.localStream);
        }
      });
    } catch (error) {
      console.error('Failed to create peer connection:', error);
      throw new Error('Failed to initialize call connection');
    }
  }

  private async setupPeerConnectionHandlers(): Promise<void> {
    if (!this.state.peerConnection) return;

    this.state.peerConnection.onicecandidate = (event) => {
      if (event.candidate) {
        // Send ICE candidate to signaling server
        this.sendIceCandidate(event.candidate);
      }
    };

    this.state.peerConnection.oniceconnectionstatechange = () => {
      const state = this.state.peerConnection?.iceConnectionState;
      console.log('ICE connection state:', state);

      if (state === 'disconnected' || state === 'failed') {
        this.handleConnectionFailure();
      }
    };

    this.state.peerConnection.ontrack = (event) => {
      this.state.remoteStream = event.streams[0];
      this.onRemoteStreamChange?.(event.streams[0]);
    };
  }

  private async createAndSendOffer(participantId: string): Promise<void> {
    if (!this.state.peerConnection) return;

    try {
      const offer = await this.state.peerConnection.createOffer();
      await this.state.peerConnection.setLocalDescription(offer);
      
      // Send offer to signaling server
      this.sendOffer(participantId, offer);
    } catch (error) {
      console.error('Failed to create offer:', error);
      throw new Error('Failed to initiate call');
    }
  }

  private handleConnectionFailure(): void {
    if (this.reconnectAttempts < this.maxRetries) {
      this.reconnectAttempts++;
      console.log(`Attempting to reconnect (${this.reconnectAttempts}/${this.maxRetries})`);
      
      this.reconnectTimeout = setTimeout(() => {
        this.reconnect();
      }, this.retryDelay * Math.pow(2, this.reconnectAttempts - 1));
    } else {
      this.handleCallError(new Error('Call connection lost'));
    }
  }

  private async reconnect(): Promise<void> {
    try {
      await this.cleanup();
      await this.startCall(this.currentParticipantId);
      this.reconnectAttempts = 0;
      toast.success('Call reconnected');
    } catch (error) {
      console.error('Failed to reconnect:', error);
      this.handleCallError(error);
    }
  }

  private startConnectionMonitoring(): void {
    if (!this.state.peerConnection) return;

    setInterval(() => {
      const state = this.state.peerConnection?.iceConnectionState;
      if (state === 'disconnected' || state === 'failed') {
        this.handleConnectionFailure();
      }
    }, 5000);
  }

  public async endCall(): Promise<void> {
    try {
      await this.cleanup();
      this.state.isCallActive = false;
      this.onCallEnded?.();
    } catch (error) {
      console.error('Failed to end call:', error);
      throw error;
    }
  }

  private async cleanup(): Promise<void> {
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
    }

    if (this.state.localStream) {
      this.state.localStream.getTracks().forEach(track => track.stop());
    }

    if (this.state.peerConnection) {
      this.state.peerConnection.close();
    }

    this.state = {
      peerConnection: null,
      localStream: null,
      remoteStream: null,
      isCallActive: false,
      isMuted: false,
      isVideoOff: false,
      isScreenSharing: false
    };
  }

  public toggleMute(): void {
    if (this.state.localStream) {
      const audioTrack = this.state.localStream.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        this.state.isMuted = !audioTrack.enabled;
      }
    }
  }

  public toggleVideo(): void {
    if (this.state.localStream) {
      const videoTrack = this.state.localStream.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        this.state.isVideoOff = !videoTrack.enabled;
      }
    }
  }

  public async toggleScreenShare(): Promise<void> {
    try {
      if (this.state.isScreenSharing) {
        await this.stopScreenShare();
      } else {
        await this.startScreenShare();
      }
    } catch (error) {
      console.error('Failed to toggle screen share:', error);
      throw error;
    }
  }

  private async startScreenShare(): Promise<void> {
    try {
      const screenStream = await navigator.mediaDevices.getDisplayMedia({
        video: true
      });

      const videoTrack = screenStream.getVideoTracks()[0];
      if (this.state.peerConnection) {
        const sender = this.state.peerConnection
          .getSenders()
          .find(s => s.track?.kind === 'video');

        if (sender) {
          await sender.replaceTrack(videoTrack);
        }
      }

      this.state.isScreenSharing = true;
      this.onScreenShareStarted?.(screenStream);
    } catch (error) {
      console.error('Failed to start screen share:', error);
      throw error;
    }
  }

  private async stopScreenShare(): Promise<void> {
    try {
      const videoTrack = this.state.localStream?.getVideoTracks()[0];
      if (this.state.peerConnection && videoTrack) {
        const sender = this.state.peerConnection
          .getSenders()
          .find(s => s.track?.kind === 'video');

        if (sender) {
          await sender.replaceTrack(videoTrack);
        }
      }

      this.state.isScreenSharing = false;
      this.onScreenShareStopped?.();
    } catch (error) {
      console.error('Failed to stop screen share:', error);
      throw error;
    }
  }

  private handleCallError(error: any): void {
    console.error('Call error:', error);
    toast.error(error.message || 'An error occurred during the call');
    this.onCallError?.(error);
  }

  // Event handlers
  public onRemoteStreamChange?: (stream: MediaStream) => void;
  public onCallEnded?: () => void;
  public onCallError?: (error: any) => void;
  public onScreenShareStarted?: (stream: MediaStream) => void;
  public onScreenShareStopped?: () => void;
}

export default CallService; 