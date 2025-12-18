import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { map } from 'rxjs/operators';
import { of } from 'rxjs';

export const authGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (authService.isLoading()) {
    return new Promise((resolve) => {
      const checkAuth = () => {
        if (!authService.isLoading()) {
          resolve(authService.isAuthenticated());
        } else {
          setTimeout(checkAuth, 50);
        }
      };
      checkAuth();
    }).then((isAuth) => {
      if (isAuth) {
        return true;
      }
      router.navigate(['/auth/login'], {
        queryParams: { returnUrl: state.url }
      });
      return false;
    });
  }

  if (authService.isAuthenticated()) {
    return true;
  }

  router.navigate(['/auth/login'], {
    queryParams: { returnUrl: state.url }
  });
  return false;
};
