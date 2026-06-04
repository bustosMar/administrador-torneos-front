import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { CrudService } from '../../services/crud.service';

@Component({
  selector: 'crud-placeholder',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="card shadow-sm">
      <div class="card-body">
        <h3 class="card-title">CRUD de {{ entityName }}</h3>

        <div *ngIf="loading" class="alert alert-info">Cargando datos...</div>
        <div *ngIf="error" class="alert alert-danger">No se pudo cargar los datos de {{ entityName }}.</div>

        <div *ngIf="!loading && items.length > 0">
          <div class="table-responsive">
            <table class="table table-bordered table-sm">
              <thead>
                <tr>
                  <th *ngFor="let column of columns">{{ column }}</th>
                </tr>
              </thead>
              <tbody>
                <tr *ngFor="let item of items">
                  <td *ngFor="let column of columns">{{ item[column] }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <div *ngIf="!loading && items.length === 0" class="alert alert-warning">
          No hay registros para {{ entityName }} en el backend.
        </div>
      </div>
    </div>
  `
})
export class CrudPlaceholderComponent implements OnInit {
  entityName = this.route.snapshot.data['entity'] ?? 'Entidad';
  endpoint = this.route.snapshot.data['endpoint'] ?? '';
  items: any[] = [];
  columns: string[] = [];
  loading = false;
  error = false;

  constructor(
    private route: ActivatedRoute,
    private crudService: CrudService
  ) {}

  ngOnInit(): void {
    if (!this.endpoint) {
      const currentPath = this.route.snapshot.url[0]?.path;
      this.endpoint = currentPath ?? '';
    }

    if (!this.endpoint) {
      this.error = true;
      return;
    }

    this.loading = true;
    this.crudService.findAll(this.endpoint).subscribe({
      next: data => {
        this.items = Array.isArray(data) ? data : [data];
        this.columns = this.extractColumns(this.items);
        this.loading = false;
      },
      error: () => {
        this.error = true;
        this.loading = false;
      }
    });
  }

  private extractColumns(items: any[]): string[] {
    const allColumns = new Set<string>();
    items.forEach(item => {
      if (item && typeof item === 'object') {
        Object.keys(item).forEach(key => allColumns.add(key));
      }
    });
    return Array.from(allColumns).slice(0, 8);
  }
}
