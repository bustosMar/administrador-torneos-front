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
    return this.http.get<any>(`${this.apiUrl}/${entity}/${id}`);
  }

   guardarJornada(entity: string, item: any): Observable<any> {
    return this.http.post<void>(`${this.apiUrl}/${entity}`,item);
  }


}
