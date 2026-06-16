import {
  Component, OnInit, ViewChild, ElementRef, OnDestroy
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, ActivatedRoute, Router } from '@angular/router';
import { CrudService } from '../../services/crud.service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-generic-crud',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  template: `
  <div class="container-fluid my-4">

    <!-- LISTADO -->
    <div *ngIf="!showForm" class="card shadow-sm">
      <div class="card-header d-flex justify-content-between align-items-center">
        <h5 class="mb-0">{{ formatLabel(entityName) }}</h5>

        <div>
          <button class="btn btn-primary me-2" (click)="onCreateClick()">
            <i class="bi bi-plus"></i> Crear {{ entityNameSingular }}
          </button>

          <button class="btn btn-secondary" (click)="onBack()">
            <i class="bi bi-arrow-left"></i> Regresar
          </button>
        </div>
      </div>

      <div class="card-body">

        <div *ngIf="loading" class="alert alert-info">Cargando datos...</div>
        <div *ngIf="error" class="alert alert-danger">{{ errorMessage }}</div>

        <div *ngIf="!loading && items.length > 0" class="table-responsive">
          <table class="table table-hover table-striped">
            <thead class="table-light">
              <tr>
                <th *ngFor="let col of columns">
                  {{ formatLabel(col) }}
                </th>
                <th>Acciones</th>
              </tr>
            </thead>

            <tbody>
              <tr *ngFor="let item of items">
                <td *ngFor="let col of columns">
                  {{ getNestedProperty(item, col) }}
                </td>

                <td>
                  <button class="btn btn-info btn-sm me-2" (click)="onEditClick(item)">
                    Editar
                  </button>

                  <button class="btn btn-danger btn-sm" (click)="onDeleteClick(item.id)">
                    Eliminar
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

      </div>
    </div>

    <!-- FORM -->
    <div *ngIf="showForm" class="card shadow-sm">

      <div class="card-header d-flex justify-content-between align-items-center">
        <h5 class="mb-0">
          {{ editingId ? 'Editar' : 'Crear' }} {{ formatLabel(entityNameSingular) }}
        </h5>

        <button class="btn btn-secondary btn-sm" (click)="onCancelForm()">
          Cancelar
        </button>
      </div>

      <div class="card-body">
        <form (ngSubmit)="onSubmitForm()" #crudForm="ngForm">

          <div *ngFor="let field of formFields" class="mb-3">

            <label class="form-label">{{ formatLabel(field) }}</label>

            <!-- ===================== -->
            <!-- FECHAS TORNEOS -->
            <!-- ===================== -->
            <input
              *ngIf="
                entityName === 'Torneos' &&
                (field === 'fechaInicio' || field === 'fechaFin')
              "
              [id]="field"
              [name]="field"
              type="date"
              class="form-control"
              [(ngModel)]="currentItem[field]"
              required
            />

            <!-- ===================== -->
            <!-- FECHA JUGADORES -->
            <!-- ===================== -->
            <input
              *ngIf="
                entityName === 'Jugadores' &&
                field === 'fechaNacimiento'
              "
              [id]="field"
              [name]="field"
              type="date"
              class="form-control"
              [(ngModel)]="currentItem[field]"
              required
            />

            <!-- ===================== -->
            <!-- INPUT GENERAL -->
            <!-- ===================== -->
            <input
              *ngIf="
                !(
                  (entityName === 'Torneos' &&
                    (field === 'fechaInicio' || field === 'fechaFin')
                  ) ||
                  (entityName === 'Jugadores' &&
                    field === 'fechaNacimiento'
                  )
                )
              "
              [id]="field"
              [name]="field"
              type="text"
              class="form-control"
              [(ngModel)]="currentItem[field]"
              required
            />

          </div>

          <button class="btn btn-primary" type="submit">
            {{ editingId ? 'Actualizar' : 'Crear' }}
          </button>

        </form>
      </div>

    </div>

  </div>
  `
})
export class GenericCrudComponent implements OnInit, OnDestroy {

  entityName = '';
  entityNameSingular = '';

  endpoint = '';
  items: any[] = [];
  currentItem: any = {};

  columns: string[] = [];
  formFields: string[] = [];

  showForm = false;
  editingId: number | null = null;

  loading = false;
  error = false;
  errorMessage = '';

  modelConfig: Record<string, string[]> = {
    Torneos: ['nombre', 'fechaInicio', 'fechaFin'],
    Jugadores: ['nombre', 'apellido', 'fechaNacimiento']
  };

  constructor(
    private crudService: CrudService,
    private route: ActivatedRoute,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.initializeEntity();
    this.loadData();
  }

  private initializeEntity(): void {
    const data = this.route.snapshot.data;

    this.entityName = data['entity'];
    this.entityNameSingular = data['entitySingular'];

    this.endpoint = data['endpoint'];

    this.columns = this.modelConfig[this.entityName] ?? [];
  }

  private loadData(): void {
    this.crudService.findAll(this.endpoint).subscribe({
      next: data => {
        this.items = Array.isArray(data) ? data : [];
      }
    });
  }

  onCreateClick(): void {
    this.currentItem = {};
    this.formFields = [...this.columns];
    this.showForm = true;
  }

  onEditClick(item: any): void {

    this.editingId = item.id;

    this.currentItem = {
      ...item,
      fechaNacimiento: this.toInputDate(item.fechaNacimiento),
      fechaInicio: this.toInputDate(item.fechaInicio),
      fechaFin: this.toInputDate(item.fechaFin)
    };

    this.formFields = [...this.columns];
    this.showForm = true;
  }

  onSubmitForm(): void {

    const payload = { ...this.currentItem };

    // ==========================
    // CONVERSIÓN TORNEOS
    // ==========================
    if (this.entityName === 'Torneos') {

      if (payload.fechaInicio) {
        const [y, m, d] = payload.fechaInicio.split('-');
        payload.fechaInicio = `${d}/${m}/${y}`;
      }

      if (payload.fechaFin) {
        const [y, m, d] = payload.fechaFin.split('-');
        payload.fechaFin = `${d}/${m}/${y}`;
      }
    }

    // ==========================
    // CONVERSIÓN JUGADORES
    // ==========================
    if (this.entityName === 'Jugadores' && payload.fechaNacimiento) {
      const [y, m, d] = payload.fechaNacimiento.split('-');
      payload.fechaNacimiento = `${d}/${m}/${y}`;
    }

    const obs = this.editingId
      ? this.crudService.update(this.endpoint, this.editingId, payload)
      : this.crudService.create(this.endpoint, payload);

    obs.subscribe({
      next: () => {
        this.showForm = false;
        this.loadData();
      }
    });
  }

  toInputDate(date: string): string {
    if (!date) return '';

    if (date.includes('/')) {
      const [d, m, y] = date.split('/');
      return `${y}-${m}-${d}`;
    }

    return date?.substring(0, 10);
  }

  onCancelForm(): void {
    this.showForm = false;
    this.currentItem = {};
    this.editingId = null;
  }

  onBack(): void {
    this.router.navigate(['/dashboard']);
  }

  getNestedProperty(obj: any, path: string) {
    return path.split('.').reduce((o, i) => o?.[i], obj);
  }

  formatLabel(text: string): string {
    return text
      .replace(/([a-z])([A-Z])/g, '$1 $2')
      .replace(/^./, s => s.toUpperCase());
  }

  ngOnDestroy(): void {}


   onDeleteClick(id: number): void {

        Swal.fire({
            title: '¿Está seguro?',
            text: `¿Desea eliminar este ${this.entityNameSingular}?`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#dc3545',
            cancelButtonColor: '#6c757d',
            confirmButtonText: 'Sí, eliminar',
            cancelButtonText: 'Cancelar'
        }).then((result) => {

            if (result.isConfirmed) {

                this.crudService.remove(
                    this.endpoint,
                    id
                ).subscribe({
                    next: () => {

                        this.items = this.items.filter(
                            item => item.id !== id
                        );

                        Swal.fire(
                            'Eliminado',
                            `${this.entityNameSingular} eliminado correctamente`,
                            'success'
                        );
                    },
                    error: (err) => {

                        console.error(
                            'Error al eliminar:',
                            err
                        );

                        Swal.fire(
                            'Error',
                            `No se pudo eliminar ${this.entityNameSingular}`,
                            'error'
                        );
                    }
                });
            }
        });
    }

}