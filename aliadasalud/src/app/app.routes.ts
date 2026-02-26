import { Routes } from '@angular/router';
import { LoginComponent } from './features/auth/login/login.component';
import { RegisterComponent } from './features/auth/register/register.component';
import { DashboardComponent } from './features/dashboard/dashboard.component';
import { CompleteProfileComponent } from './features/profile/complete-profile/complete-profile.component';
import { authGuard } from './core/guards/auth.guard';
import { guestGuard } from './core/guards/guest.guard';
import { profileCompleteGuard } from './core/guards/profile-complete.guard';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'auth/login',
    pathMatch: 'full'
  },
  {
    path: 'auth/login',
    component: LoginComponent,
    canActivate: [guestGuard]
  },
  {
    path: 'auth/register',
    component: RegisterComponent,
    canActivate: [guestGuard]
  },
  {
    path: 'profile/complete',
    component: CompleteProfileComponent,
    canActivate: [authGuard]
  },
  {
    path: 'dashboard',
    component: DashboardComponent,
    canActivate: [authGuard, profileCompleteGuard]
  },
  {
    path: 'video-call/:channelName',
    loadComponent: () =>
      import('./features/video-call/video-call.component').then(m => m.VideoCallComponent),
    canActivate: [authGuard, profileCompleteGuard]
  },
  {
    path: '**',
    redirectTo: 'auth/login'
  }
];
