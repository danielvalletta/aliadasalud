import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const guestGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (authService.isLoading()) {
    return new Promise((resolve) => {
      const checkAuth = () => {
        if (!authService.isLoading()) {
          resolve(!authService.isAuthenticated());
        } else {
          setTimeout(checkAuth, 50);
        }
      };
      checkAuth();
    }).then((isGuest) => {
      if (isGuest) {
        return true;
      }
      router.navigate(['/dashboard']);
      return false;
    });
  }

  if (!authService.isAuthenticated()) {
    return true;
  }

  router.navigate(['/dashboard']);
  return false;
};
