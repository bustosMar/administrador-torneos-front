import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';

interface RuntimeConfig {
  apiUrl: string;
}

@Injectable({
  providedIn: 'root'
})
export class RuntimeConfigService {
  private config?: RuntimeConfig;

  constructor(private http: HttpClient) {}

  load(): Promise<void> {
    return firstValueFrom(this.http.get<RuntimeConfig>('/assets/config.json'))
      .then(config => {
        this.config = config;
      });
  }

  get apiUrl(): string {
    if (!this.config?.apiUrl) {
      throw new Error('La configuración de runtime del frontend no se ha cargado.');
    }
    return this.config.apiUrl.replace(/\/$/, '');
  }
}