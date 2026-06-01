import { Injectable } from '@angular/core';
import { Usuario } from '../models/usuario';
import { Observable} from 'rxjs';
import { HttpClient } from '@angular/common/http';

@Injectable({
  providedIn: 'root'
})
export class Usuarioservice {

  private usuarios: Usuario[] = [];

  private url: string = 'http://localhost:8081/api/usuarios';

  constructor(private http: HttpClient) { }

  findAll(): Observable<Usuario[]> {
    return this.http.get<Usuario[]>(this.url);
  }

  findById(id: number): Observable<Usuario> {
    return this.http.get<Usuario>(`${this.url}/${id}`);
  }

  create(usuario: Usuario): Observable<Usuario>{
    return this.http.post<Usuario>(this.url, usuario);
  }

  update(usuario: Usuario): Observable<Usuario>{
    return this.http.put<Usuario>(`${this.url}/${usuario.id}`, usuario);
  }

  remove(id: number): Observable<void>{
    return this.http.delete<void>(`${this.url}/${id}`);
  }
}
