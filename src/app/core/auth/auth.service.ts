import { HttpClient, HttpContext } from '@angular/common/http';
import { Injectable, signal } from '@angular/core';
import { toObservable } from '@angular/core/rxjs-interop';
import { catchError, map, of, tap } from 'rxjs';
import { AuthSession, JwtPayload, LoginRequest, LoginResponse, UserRole } from './auth.models';
import { inject } from '@angular/core';
import { SESSION_STORAGE } from './session-storage.token';
import { INLINE_ERROR_HANDLING } from '../error-handling/http-error-context';
import { LoggerService } from '../services/logger.service';

const SESSION_TOKEN_KEY = 'auth_token';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly sessionStorage = inject(SESSION_STORAGE);
  private readonly logger = inject(LoggerService);
  private readonly authStateSignal = signal<AuthSession | null>(this.restoreSession());

  readonly authState = this.authStateSignal.asReadonly();
  readonly authState$ = toObservable(this.authState);
  readonly isAuthenticated = mapReadonlySignal(this.authState, (session) => session !== null);

  login(payload: LoginRequest) {
    return this.http
      .post<LoginResponse>('/auth/login', payload, {
        context: new HttpContext().set(INLINE_ERROR_HANDLING, true),
      })
      .pipe(
        map((response) => this.toSession(response)),
        tap((session) => this.persistSession(session)),
      );
  }

  logout() {
    return this.http.post<void>('/auth/logout', {}).pipe(
      catchError(() => of(void 0)),
      tap(() => this.clearSession()),
    );
  }

  currentRole(): UserRole | null {
    return this.authStateSignal()?.profile.role ?? null;
  }

  hasRole(role: UserRole): boolean {
    return this.currentRole() === role;
  }

  private restoreSession(): AuthSession | null {
    const token = this.sessionStorage?.getItem(SESSION_TOKEN_KEY) ?? null;
    if (!token) {
      return null;
    }

    const payload = decodeJwtPayload(token);
    if (!payload || payload.exp * 1000 <= Date.now()) {
      this.sessionStorage?.removeItem(SESSION_TOKEN_KEY);
      return null;
    }

    return {
      token,
      profile: {
        id: payload.sub,
        email: payload.email,
        displayName: payload.name,
        role: payload.role,
      },
    };
  }

  private toSession(response: LoginResponse): AuthSession {
    const payload = decodeJwtPayload(response.token);
    if (!payload) {
      this.logger.error('Login response token is malformed.');
      throw new Error('Login response token is malformed.');
    }

    return {
      token: response.token,
      profile: response.profile,
    };
  }

  private persistSession(session: AuthSession): void {
    // Storage strategy: keep the source of truth in memory and mirror token to sessionStorage for refresh recovery.
    this.authStateSignal.set(session);
    this.sessionStorage?.setItem(SESSION_TOKEN_KEY, session.token);
  }

  private clearSession(): void {
    this.authStateSignal.set(null);
    this.sessionStorage?.removeItem(SESSION_TOKEN_KEY);
  }
}

function mapReadonlySignal<TInput, TOutput>(
  source: () => TInput,
  mapper: (value: TInput) => TOutput,
): () => TOutput {
  return () => mapper(source());
}

function decodeJwtPayload(token: string): JwtPayload | null {
  const segments = token.split('.');
  if (segments.length < 2) {
    return null;
  }

  try {
    const payloadSegment = segments[1]?.replace(/-/g, '+').replace(/_/g, '/') ?? '';
    const padded = payloadSegment.padEnd(Math.ceil(payloadSegment.length / 4) * 4, '=');
    const json = atob(padded);
    const parsed = JSON.parse(json) as Partial<JwtPayload>;

    if (
      typeof parsed.sub !== 'string' ||
      typeof parsed.email !== 'string' ||
      typeof parsed.name !== 'string' ||
      (parsed.role !== 'user' && parsed.role !== 'admin') ||
      typeof parsed.exp !== 'number'
    ) {
      return null;
    }

    return parsed as JwtPayload;
  } catch {
    return null;
  }
}
