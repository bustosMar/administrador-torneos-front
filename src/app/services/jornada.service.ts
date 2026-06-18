import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class JornadaService {
  private readonly apiUrl = 'http://localhost:8081/api';

  constructor(private http: HttpClient) {}

   generarJornada(entity: string, id: number): Observable<any> {
    return this.http.post<any>(
      `${this.apiUrl}/${entity}/${id}/calendario`,
      {} // 👈 body vacío obligatorio
    );
  }

   generarPartidos(entity: string, id: number): Observable<any> {
    return this.http.post<any>(
      `${this.apiUrl}/${entity}/${id}/jornadas/siguiente`,
      {} // 👈 body vacío obligatorio
    );
  }


}
