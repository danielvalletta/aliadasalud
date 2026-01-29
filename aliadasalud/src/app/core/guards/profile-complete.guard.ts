import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { PacienteService } from '../services/paciente.service';
import { map, catchError } from 'rxjs/operators';
import { of } from 'rxjs';

export const profileCompleteGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const pacienteService = inject(PacienteService);
  const router = inject(Router);

  if (authService.isLoading()) {
    return new Promise((resolve) => {
      const checkAuth = () => {
        if (!authService.isLoading()) {
          const currentUser = authService.currentUser();

          if (!currentUser) {
            resolve(true);
            return;
          }

          // Ahora sí verificar el perfil
          pacienteService.tienePerfilCompleto(currentUser.id).subscribe({
            next: (tienesPerfil) => {
              if (tienesPerfil) {
                resolve(true);
              } else {
                router.navigate(['/profile/complete']);
                resolve(false);
              }
            },
            error: () => {
              router.navigate(['/profile/complete']);
              resolve(false);
            }
          });
        } else {
          setTimeout(checkAuth, 50);
        }
      };
      checkAuth();
    });
  }

  const currentUser = authService.currentUser();

  if (!currentUser) {
    router.navigate(['/auth/login']);
    return false;
  }

  return pacienteService.tienePerfilCompleto(currentUser.id).pipe(
    map(tienesPerfil => {
      if (tienesPerfil) {
        return true;
      } else {
        router.navigate(['/profile/complete']);
        return false;
      }
    }),
    catchError(() => {
      router.navigate(['/profile/complete']);
      return of(false);
    })
  );
};
