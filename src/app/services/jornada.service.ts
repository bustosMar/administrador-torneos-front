import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class JornadaService {
  private readonly apiUrl = 'http://localhost:8081/api';

  constructor(private http: HttpClient) {}


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


}
