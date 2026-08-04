import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class PresenciaPartidoService {
  private readonly apiUrl = 'http://localhost:8081/api';

  constructor(private http: HttpClient) {}

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
}