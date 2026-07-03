import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class CrudService {
  private readonly apiUrl = 'http://localhost:8081/api';

  constructor(private http: HttpClient) {}

  findAll(entity: string): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/${entity}`);
  }

  findById(entity: string, id: number): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/${entity}/${id}`);
  }

  create(entity: string, item: any): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/${entity}`, item);
  }

  update(entity: string, id: number, item: any): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/${entity}/${id}`, item);
  }

  remove(entity: string, id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${entity}/${id}`);
  }

  escucharLectorHuella() {
     return this.http.post<any>(`${this.apiUrl}/huellas/lector/escuchar`,{});
  }
  
  obtenerHuella() {
    return this.http.get<any>(`${this.apiUrl}/huellas/obtener`);
  }

  
}
