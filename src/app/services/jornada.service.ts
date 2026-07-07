import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class JornadaService {
  private readonly apiUrl = 'http://localhost:8081/api';

  constructor(private http: HttpClient) {}

  generarPartidos(entity: string, id: number): Observable<any> {
    return this.http.post<any>(
      `${this.apiUrl}/${entity}/${id}/jornadas/siguiente`,
      {} // 👈 body vacío obligatorio
    );
  }

   guardarJornada(entity: string, id: number, idCategoria: number): Observable<any> {
    return this.http.post<any>(
      `${this.apiUrl}/${entity}/${id}/${idCategoria}/calendario`,
      {} // 👈 body vacío obligatorio
    );
  }

  visualizarJornada(
      endpoint: string,
      idTorneo: number,
      idCategoria: number
    ) {
      return this.http.get(
        `${this.apiUrl}/${endpoint}/${idTorneo}/${idCategoria}/previsualizar-partidos`
      );
    }


}
