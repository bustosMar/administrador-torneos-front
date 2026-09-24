import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { RuntimeConfigService } from './runtime-config.service';

@Injectable({
  providedIn: 'root'
})
export class PresenciaPartidoService {
  constructor(
    private http: HttpClient,
    private runtimeConfig: RuntimeConfigService
  ) {}

  private get apiUrl(): string {
    return this.runtimeConfig.apiUrl;
  }

  obtenerDetalle(idPartido: number): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/presencias/partido/${idPartido}`);
  }

  identificarHuella(idPartido: number, equipoId: number, huella: string, observaciones?: string): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/presencias/partido/${idPartido}/huella`, {
      equipoId,
      huella,
      observaciones: observaciones ?? null
    });
  }

  guardarPresencias(idPartido: number, jugadores: number[], observaciones?: string): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/presencias/partido/${idPartido}/guardar`, {
      jugadores,
      observaciones: observaciones ?? null
    });
  }

  crearGol(payload: any): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/goles`, payload);
  }

  actualizarGol(id: number, payload: any): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/goles/${id}`, payload);
  }

  eliminarGol(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/goles/${id}`);
  }

  crearSancion(payload: any): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/sanciones`, payload);
  }

  actualizarSancion(id: number, payload: any): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/sanciones/${id}`, payload);
  }

  eliminarSancion(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/sanciones/${id}`);
  }
}