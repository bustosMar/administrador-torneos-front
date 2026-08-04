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

   search(entity: string, query: string): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/${entity}/search?q=${encodeURIComponent(query)}`);
  }

  getWithParams(endpoint: string, params: Record<string, any>): Observable<any> {
    let url = `${this.apiUrl}/${endpoint}?`;
    Object.keys(params).forEach((key, index) => {
      if (index > 0) url += '&';
      url += `${key}=${params[key]}`;
    });
    return this.http.get<any>(url);
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

  escucharLectorHuellaVerificacion() {
    return this.http.post<any>(`${this.apiUrl}/huellas/verificacion/lector/escuchar`, {});
  }

  consultarLectorHuellaVerificacion() {
    return this.http.get<any>(`${this.apiUrl}/huellas/verificacion/obtener`);
  }

  detenerLectorHuella() {
    return this.http.post<any>(`${this.apiUrl}/huellas/lector/detener`, {});
  }
  
  obtenerHuella() {
    return this.http.get<any>(`${this.apiUrl}/huellas/obtener`);
  }

  obtenerHuellaVerificacion() {
    return this.http.get<any>(`${this.apiUrl}/huellas/verificacion/obtener`);
  }

  
}
