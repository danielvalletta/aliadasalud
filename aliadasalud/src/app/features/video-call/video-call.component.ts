import {
  Component,
  OnInit,
  AfterViewInit,
  OnDestroy,
  ViewChild,
  ElementRef,
  inject,
  signal,
  ChangeDetectorRef,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { ButtonDirective } from 'primeng/button';
import { AgoraService } from '../../core/services/agora.service';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-video-call',
  standalone: true,
  imports: [CommonModule, ButtonDirective],
  templateUrl: './video-call.component.html',
  styleUrl: './video-call.component.css',
})
export class VideoCallComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('localVideo', { static: false }) localVideoEl!: ElementRef<HTMLDivElement>;
  @ViewChild('remoteVideo', { static: false }) remoteVideoEl!: ElementRef<HTMLDivElement>;

  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private authService = inject(AuthService);
  private cdr = inject(ChangeDetectorRef);
  agoraService = inject(AgoraService);

  channelName = '';
  errorMessage = signal<string | null>(null);
  isInitializing = signal(true);

  ngAfterViewInit() {
    if (this.remoteVideoEl?.nativeElement) {
      this.agoraService.setRemoteVideoEl(this.remoteVideoEl.nativeElement);
    }
  }

  async ngOnInit() {
    this.channelName = this.route.snapshot.paramMap.get('channelName') || '';

    if (!this.channelName) {
      this.errorMessage.set('No se especifico un canal de videollamada');
      this.isInitializing.set(false);
      return;
    }

    await this.iniciarLlamada();
  }

  private async iniciarLlamada() {
    try {
      this.isInitializing.set(true);
      this.errorMessage.set(null);

      const currentUser = this.authService.currentUser();
      if (!currentUser) {
        this.errorMessage.set('No se pudo obtener la informacion del usuario');
        this.isInitializing.set(false);
        return;
      }

      // Generar UID numerico a partir del user ID
      const uid = this.generateNumericUid(currentUser.id);

      // Obtener token desde Supabase Edge Function
      const token = await this.agoraService.fetchToken(this.channelName, uid);

      // Unirse al canal (token puede ser null en modo testing)
      await this.agoraService.joinChannel(this.channelName, token, uid);

      // Crear y publicar tracks de audio/video
      await this.agoraService.createAndPublishTracks();

      this.isInitializing.set(false);

      // Forzar re-render para que #localVideo este disponible en el DOM
      this.cdr.detectChanges();

      // Mostrar video local
      if (this.localVideoEl?.nativeElement) {
        this.agoraService.playLocalVideo(this.localVideoEl.nativeElement);
      }
    } catch (error: any) {
      console.error('Error al iniciar la llamada:', error);

      if (error?.code === 'PERMISSION_DENIED' || error?.name === 'NotAllowedError') {
        this.errorMessage.set(
          'Se necesitan permisos de camara y microfono para la videollamada. Por favor permite el acceso en tu navegador.'
        );
      } else {
        this.errorMessage.set('Error al iniciar la videollamada. Por favor intenta de nuevo.');
      }

      this.isInitializing.set(false);
    }
  }

  async toggleMic() {
    await this.agoraService.toggleMicrophone();
  }

  async toggleCamera() {
    await this.agoraService.toggleCamera();
  }

  async colgar() {
    await this.agoraService.leaveChannel();
    this.router.navigate(['/dashboard']);
  }

  private generateNumericUid(userId: string): number {
    let hash = 0;
    for (let i = 0; i < userId.length; i++) {
      const char = userId.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash |= 0;
    }
    return Math.abs(hash) % 2147483647 || 1;
  }

  ngOnDestroy() {
    this.agoraService.leaveChannel();
  }
}
