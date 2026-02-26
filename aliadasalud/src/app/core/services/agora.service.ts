import { Injectable, signal } from '@angular/core';
import AgoraRTC, {
  IAgoraRTCClient,
  IAgoraRTCRemoteUser,
  ICameraVideoTrack,
  IMicrophoneAudioTrack,
} from 'agora-rtc-sdk-ng';
import { environment } from '../../../environments/environment';
import { SupabaseService } from './supabase.service';

@Injectable({
  providedIn: 'root',
})
export class AgoraService {
  private client: IAgoraRTCClient;
  private localAudioTrack: IMicrophoneAudioTrack | null = null;
  private localVideoTrack: ICameraVideoTrack | null = null;
  private remoteVideoEl: HTMLElement | null = null;

  isJoined = signal(false);
  remoteUser = signal<IAgoraRTCRemoteUser | null>(null);
  isMicOn = signal(true);
  isCameraOn = signal(true);
  connectionState = signal<'DISCONNECTED' | 'CONNECTING' | 'CONNECTED' | 'DISCONNECTING'>(
    'DISCONNECTED'
  );

  setRemoteVideoEl(el: HTMLElement) {
    this.remoteVideoEl = el;
  }

  constructor(private supabase: SupabaseService) {
    this.client = AgoraRTC.createClient({ mode: 'rtc', codec: 'vp9' });
    this.setupEventListeners();
  }

  private setupEventListeners() {
    this.client.on('user-published', async (user, mediaType) => {
      await this.client.subscribe(user, mediaType);

      if (mediaType === 'video') {
        this.remoteUser.set(user);
        // Reproducir video directamente sin depender de signals/effects
        if (this.remoteVideoEl && user.videoTrack) {
          user.videoTrack.play(this.remoteVideoEl);
        }
      } else if (mediaType === 'audio') {
        // Reproducir audio directamente
        user.audioTrack?.play();
      }
    });

    this.client.on('user-unpublished', (user, mediaType) => {
      if (mediaType === 'video') {
        this.remoteUser.set({ ...user } as IAgoraRTCRemoteUser);
      }
    });

    this.client.on('user-left', () => {
      this.remoteUser.set(null);
    });

    this.client.on('connection-state-change', (curState) => {
      this.connectionState.set(curState as any);
    });
  }

  async fetchToken(channelName: string, uid: number): Promise<string | null> {
    // En desarrollo: usar token temporal si esta configurado en environment
    if (!environment.production && (environment as any).agoraDevToken) {
      return (environment as any).agoraDevToken;
    }

    // En produccion: obtener token desde Supabase Edge Function
    try {
      const { data: sessionData } = await this.supabase.client.auth.getSession();
      const token = sessionData.session?.access_token;

      const response = await fetch(
        `${environment.supabaseUrl}/functions/v1/agora-token`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ channelName, uid }),
        }
      );

      if (!response.ok) {
        console.error('Error al obtener token de Agora');
        return null;
      }

      const data = await response.json();
      return data.token;
    } catch (error) {
      console.error('Error al obtener token:', error);
      return null;
    }
  }

  async joinChannel(channelName: string, token: string | null, uid: number): Promise<void> {
    this.connectionState.set('CONNECTING');
    await this.client.join(environment.agoraAppId, channelName, token, uid);
    this.isJoined.set(true);
  }

  async createAndPublishTracks(): Promise<void> {
    [this.localAudioTrack, this.localVideoTrack] =
      await AgoraRTC.createMicrophoneAndCameraTracks();

    await this.client.publish([this.localAudioTrack, this.localVideoTrack]);
  }

  playLocalVideo(element: HTMLElement): void {
    this.localVideoTrack?.play(element);
  }

  playRemoteVideo(element: HTMLElement): void {
    const user = this.remoteUser();
    user?.videoTrack?.play(element);
  }

  playRemoteAudio(): void {
    const user = this.remoteUser();
    user?.audioTrack?.play();
  }

  async toggleMicrophone(): Promise<void> {
    if (this.localAudioTrack) {
      const newState = !this.isMicOn();
      await this.localAudioTrack.setEnabled(newState);
      this.isMicOn.set(newState);
    }
  }

  async toggleCamera(): Promise<void> {
    if (this.localVideoTrack) {
      const newState = !this.isCameraOn();
      await this.localVideoTrack.setEnabled(newState);
      this.isCameraOn.set(newState);
    }
  }

  async leaveChannel(): Promise<void> {
    this.localAudioTrack?.close();
    this.localVideoTrack?.close();
    this.localAudioTrack = null;
    this.localVideoTrack = null;

    if (this.isJoined()) {
      await this.client.leave();
    }

    this.isJoined.set(false);
    this.remoteUser.set(null);
    this.isMicOn.set(true);
    this.isCameraOn.set(true);
    this.connectionState.set('DISCONNECTED');
  }
}
