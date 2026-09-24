import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { RuntimeConfigService } from './runtime-config.service';

@Injectable({
  providedIn: 'root'
})
export class JornadaService {
  constructor(
    private http: HttpClient,
    private runtimeConfig: RuntimeConfigService
  ) {}

  private get apiUrl(): string {
    return this.runtimeConfig.apiUrl;
  }


   generarJornadas(entity: string, id: number, idCategoria: number): Observable<any> {
    return this.http.post<any>(
      `${this.apiUrl}/${entity}/${id}/${idCategoria}/calendario`,
      {} // 👈 body vacío obligatorio
    );
  }

  generarPartidos(entity: string, id: number): Observable<any> {
    return this.http.post<any>(
      `${this.apiUrl}/${entity}/${id}/jornadas/siguiente`,
      {} // 👈 body vacío obligatorio
    );
  }


   guardarPartidos(
      endpoint: string,
      partidos: any[]
    ): Observable<any> {
    
      return this.http.post<any>(
        `${this.apiUrl}/${endpoint}`,
        partidos
      );
    }


  visualizarJornada(
      endpoint: string,
      idTorneo: number,
      idCategoria: number
    ): Observable<any> {
      return this.http.get<any>(
        `${this.apiUrl}/${endpoint}/${idTorneo}/${idCategoria}/previsualizar-partidos`
      );
    }

     jornadaActual(
      endpoint: string,
      idTorneo: number,
      idCategoria: number
    ): Observable<any> {
      return this.http.get<any>(
        `${this.apiUrl}/${endpoint}/${idTorneo}/${idCategoria}/jornadas-actual`
      );
    }

    partidosJornadaJugada(
      idTorneo: number,
      idCategoria: number
    ): Observable<any[]> {
      return this.http.get<any[]>(
        `${this.apiUrl}/partidos/torneo/${idTorneo}/categoria/${idCategoria}/jornada-jugada`
      );
    }


}
