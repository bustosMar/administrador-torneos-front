import { Injectable } from '@angular/core';
import { Usuario } from '../models/usuario';
import { Observable} from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { RuntimeConfigService } from './runtime-config.service';

@Injectable({
  providedIn: 'root'
})
export class Usuarioservice {

  private usuarios: Usuario[] = [];

  constructor(
    private http: HttpClient,
    private runtimeConfig: RuntimeConfigService
  ) { }

  private get url(): string {
    return `${this.runtimeConfig.apiUrl}/usuarios`;
  }

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
