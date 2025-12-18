import { Injectable, signal } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, from, of, throwError } from 'rxjs';
import { map, catchError, tap } from 'rxjs/operators';
import { SupabaseService } from './supabase.service';
import { User, RegisterData, LoginData, AuthResponse } from '../models/user.model';
import { Session } from '@supabase/supabase-js';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  currentUser = signal<User | null>(null);
  isAuthenticated = signal<boolean>(false);
  isLoading = signal<boolean>(true);

  constructor(
    private supabase: SupabaseService,
    private router: Router
  ) {
    this.initAuthListener();
  }

  private async initAuthListener() {
    try {
      const { data: { user } } = await this.supabase.client.auth.getUser();
      this.setUser(user ? this.mapSupabaseUser(user) : null);

      this.supabase.client.auth.onAuthStateChange((event, session) => {
        if (session?.user) {
          this.setUser(this.mapSupabaseUser(session.user));
        } else {
          this.clearUser();
        }
      });
    } catch (error) {
      console.error('Error initializing auth:', error);
      this.clearUser();
    } finally {
      this.isLoading.set(false);
    }
  }

  register(data: RegisterData): Observable<AuthResponse> {
    return from(
      this.supabase.client.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          data: data.metadata || {}
        }
      })
    ).pipe(
      map(({ data: authData, error }) => {
        if (error) {
          return this.createErrorResponse(error);
        }

        if (authData.user) {
          const user = this.mapSupabaseUser(authData.user);
          this.setUser(user);
          return { user, error: null, success: true };
        }

        return {
          user: null,
          error: 'No se pudo crear el usuario',
          success: false
        };
      }),
      catchError(error => of(this.createErrorResponse(error)))
    );
  }

  login(data: LoginData): Observable<AuthResponse> {
    return from(
      this.supabase.client.auth.signInWithPassword({
        email: data.email,
        password: data.password
      })
    ).pipe(
      map(({ data: authData, error }) => {
        if (error) {
          return this.createErrorResponse(error);
        }

        if (authData.user) {
          const user = this.mapSupabaseUser(authData.user);
          this.setUser(user);
          return { user, error: null, success: true };
        }

        return {
          user: null,
          error: 'Credenciales inválidas',
          success: false
        };
      }),
      catchError(error => of(this.createErrorResponse(error)))
    );
  }

  logout(): Observable<AuthResponse> {
    return from(this.supabase.client.auth.signOut()).pipe(
      map(({ error }) => {
        if (error) {
          return this.createErrorResponse(error);
        }

        this.clearUser();
        this.router.navigate(['/login']);

        return {
          user: null,
          error: null,
          success: true
        };
      }),
      catchError(error => of(this.createErrorResponse(error)))
    );
  }

  getSession(): Observable<Session | null> {
    return from(this.supabase.client.auth.getSession()).pipe(
      map(({ data: { session } }) => session),
      catchError(() => of(null))
    );
  }

  refreshSession(): Observable<Session | null> {
    return from(this.supabase.client.auth.refreshSession()).pipe(
      map(({ data: { session }, error }) => {
        if (error) {
          console.error('Error refreshing session:', error);
          return null;
        }
        return session;
      }),
      catchError(() => of(null))
    );
  }

  resetPassword(email: string): Observable<AuthResponse> {
    return from(
      this.supabase.client.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`
      })
    ).pipe(
      map(({ error }) => {
        if (error) {
          return this.createErrorResponse(error);
        }

        return {
          user: null,
          error: null,
          success: true
        };
      }),
      catchError(error => of(this.createErrorResponse(error)))
    );
  }

  updatePassword(newPassword: string): Observable<AuthResponse> {
    return from(
      this.supabase.client.auth.updateUser({
        password: newPassword
      })
    ).pipe(
      map(({ data, error }) => {
        if (error) {
          return this.createErrorResponse(error);
        }

        return {
          user: data.user ? this.mapSupabaseUser(data.user) : null,
          error: null,
          success: true
        };
      }),
      catchError(error => of(this.createErrorResponse(error)))
    );
  }

  updateProfile(metadata: Record<string, any>): Observable<AuthResponse> {
    return from(
      this.supabase.client.auth.updateUser({
        data: metadata
      })
    ).pipe(
      map(({ data, error }) => {
        if (error) {
          return this.createErrorResponse(error);
        }

        if (data.user) {
          const user = this.mapSupabaseUser(data.user);
          this.setUser(user);
          return { user, error: null, success: true };
        }

        return {
          user: null,
          error: 'No se pudo actualizar el perfil',
          success: false
        };
      }),
      catchError(error => of(this.createErrorResponse(error)))
    );
  }

  private mapSupabaseUser(supabaseUser: any): User {
    return {
      id: supabaseUser.id,
      email: supabaseUser.email || '',
      created_at: supabaseUser.created_at,
      updated_at: supabaseUser.updated_at,
      email_confirmed_at: supabaseUser.email_confirmed_at,
      last_sign_in_at: supabaseUser.last_sign_in_at,
      role: supabaseUser.role,
      user_metadata: supabaseUser.user_metadata
    };
  }

  private setUser(user: User | null) {
    this.currentUser.set(user);
    this.isAuthenticated.set(user !== null);
  }

  private clearUser() {
    this.currentUser.set(null);
    this.isAuthenticated.set(false);
  }

  private createErrorResponse(error: any): AuthResponse {
    let errorMessage = 'Ha ocurrido un error';

    if (error instanceof Error) {
      errorMessage = error.message;
    } else if (typeof error === 'string') {
      errorMessage = error;
    } else if (error?.message) {
      errorMessage = error.message;
    }

    if (errorMessage.includes('Invalid login credentials')) {
      errorMessage = 'Email o contraseña incorrectos';
    } else if (errorMessage.includes('Email not confirmed')) {
      errorMessage = 'Por favor confirma tu email antes de iniciar sesión';
    } else if (errorMessage.includes('User already registered')) {
      errorMessage = 'Este email ya está registrado';
    }

    return {
      user: null,
      error: errorMessage,
      success: false
    };
  }
}
