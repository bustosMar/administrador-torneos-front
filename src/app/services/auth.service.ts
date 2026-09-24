import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { RuntimeConfigService } from './runtime-config.service';

export interface LoginCredentials {
  nombreUsuario: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  username: string;
  message: string;
  expiresAt?: number;
  roles?: string;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly tokenKey = 'auth_token';

  constructor(
    private http: HttpClient,
    private runtimeConfig: RuntimeConfigService
  ) {}

  login(credentials: LoginCredentials): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${this.runtimeConfig.apiUrl}/auth/login`, credentials).pipe(
      tap(response => {
        this.storeToken(response.token);
      })
    );
  }

  logout(): void {
    localStorage.removeItem(this.tokenKey);
  }

  getToken(): string | null {
    return localStorage.getItem(this.tokenKey);
  }

  isAuthenticated(): boolean {
    const token = this.getToken();
    return !!token && !this.isExpired(token);
  }

  getUsername(): string | null {
    const payload = this.getPayload();
    return payload?.username ?? null;
  }

  getRoles(): string[] {
    const payload = this.getPayload();
    if (!payload) {
      return [];
    }

    const rawAuthorities = payload.authorities ?? payload.roles;
    if (!rawAuthorities) {
      return [];
    }

    if (typeof rawAuthorities === 'string') {
      try {
        return this.extractRoles(JSON.parse(rawAuthorities));
      } catch {
        return [];
      }
    }

    return this.extractRoles(rawAuthorities);
  }

  // Compara ignorando mayúsculas y el prefijo ROLE_ para evitar falsos negativos.
  hasRole(role: string): boolean {
    const target = this.normalizeRole(role);
    return this.getRoles().some(r => this.normalizeRole(r) === target);
  }

  private normalizeRole(role: string): string {
    return role.trim().toUpperCase().replace(/^ROLE_/, '');
  }

  getExpiration(): Date | null {
    const payload = this.getPayload();
    if (!payload?.exp) {
      return null;
    }
    return new Date(payload.exp * 1000);
  }

  private storeToken(token: string): void {
    localStorage.setItem(this.tokenKey, token);
  }

  private getPayload(): any | null {
    const token = this.getToken();
    if (!token) {
      return null;
    }

    const parts = token.split('.');
    if (parts.length !== 3) {
      return null;
    }

    try {
      const payload = parts[1].replace(/-/g, '+').replace(/_/g, '/');
      const decoded = atob(payload);
      return JSON.parse(decoded);
    } catch {
      return null;
    }
  }

  private isExpired(token: string): boolean {
    const payload = this.getPayload();
    if (!payload?.exp) {
      return true;
    }
    return Date.now() >= payload.exp * 1000;
  }

  private extractRoles(authorities: any): string[] {
    if (!Array.isArray(authorities)) {
      return [];
    }

    return authorities
      .map((entry: any) => {
        if (typeof entry === 'string') {
          return entry;
        }
        return entry?.authority ?? entry?.role ?? null;
      })
      .filter((value: string | null): value is string => !!value);
  }
}
