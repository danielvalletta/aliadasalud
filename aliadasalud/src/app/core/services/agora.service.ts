import { inject, Injectable, NgZone, signal } from '@angular/core';
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

  private ngZone = inject(NgZone);

  constructor(private supabase: SupabaseService) {
    this.client = AgoraRTC.createClient({ mode: 'rtc', codec: 'vp9' });
    this.setupEventListeners();
  }

  private setupEventListeners() {
    this.client.on('user-published', async (user, mediaType) => {
      await this.client.subscribe(user, mediaType);

      if (mediaType === 'video') {
        // Reproducir video directamente en el DOM
        if (this.remoteVideoEl && user.videoTrack) {
          user.videoTrack.play(this.remoteVideoEl);
        }
        // Actualizar signal dentro de la zona de Angular para que el template reaccione
        this.ngZone.run(() => this.remoteUser.set(user));
      } else if (mediaType === 'audio') {
        user.audioTrack?.play();
      }
    });

    this.client.on('user-unpublished', (user, mediaType) => {
      if (mediaType === 'video') {
        this.ngZone.run(() => this.remoteUser.set({ ...user } as IAgoraRTCRemoteUser));
      }
    });

    this.client.on('user-left', () => {
      this.ngZone.run(() => this.remoteUser.set(null));
    });

    this.client.on('connection-state-change', (curState) => {
      this.ngZone.run(() => this.connectionState.set(curState as any));
    });
  }

  async fetchToken(channelName: string, uid: number): Promise<string | null> {
    // En desarrollo: usar token temporal si esta configurado en environment
    if (!environment.production && (environment as any).agoraDevToken) {
      console.log('[Agora] Usando token de desarrollo');
      return (environment as any).agoraDevToken;
    }

    // En produccion: obtener token desde Supabase Edge Function
    console.log('[Agora] Solicitando token a Edge Function...');
    try {
      const { data: sessionData } = await this.supabase.client.auth.getSession();
      const accessToken = sessionData.session?.access_token;
      console.log('[Agora] Session token existe:', !!accessToken);

      const url = `${environment.supabaseUrl}/functions/v1/agora-token`;
      console.log('[Agora] Llamando a:', url);

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ channelName, uid }),
      });

      console.log('[Agora] Response status:', response.status);

      if (!response.ok) {
        const errorBody = await response.text();
        console.error('[Agora] Error response:', errorBody);
        return null;
      }

      const data = await response.json();
      console.log('[Agora] Token obtenido:', data.token ? 'SI' : 'NO');
      return data.token;
    } catch (error) {
      console.error('[Agora] Error al obtener token:', error);
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
