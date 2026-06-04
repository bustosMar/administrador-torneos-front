import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, NgForm } from '@angular/forms';
import { RouterModule, ActivatedRoute, Router } from '@angular/router';
import { CrudService } from '../../services/crud.service';
import Swal from 'sweetalert2';

@Component({
    selector: 'app-generic-crud',
    standalone: true,
    imports: [CommonModule, FormsModule, RouterModule],
    template: `
    <div class="container-fluid my-4">
      <!-- Tabla de listado -->
      <div *ngIf="!showForm" class="card shadow-sm">
        <div class="card-header d-flex justify-content-between align-items-center">
          <h5 class="mb-0">{{ entityName }}</h5>
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
                  <th *ngFor="let col of columns">{{ col }}</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                <tr *ngFor="let item of items">
                  <td *ngFor="let col of columns">{{ getNestedProperty(item, col) }}</td>
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

          <div *ngIf="!loading && items.length === 0" class="alert alert-warning">
            No hay registros para {{ entityName }}
          </div>
        </div>
      </div>

      <!-- Formulario de crear/editar -->
      <div *ngIf="showForm" class="card shadow-sm">
            <div class="card-header">
              <div class="d-flex justify-content-between align-items-center">
                <h5 class="mb-0">{{ editingId ? 'Editar' : 'Crear' }} {{ entityNameSingular }}</h5>
                <button class="btn btn-secondary btn-sm" (click)="onCancelForm()">
                  <i class="bi bi-x"></i> Cancelar
                </button>
              </div>
            </div>
            <div class="card-body">
  <form (ngSubmit)="onSubmitForm()" #crudForm="ngForm">

    <div *ngFor="let field of formFields" class="mb-3">

  <label [for]="field" class="form-label">
    {{ formatLabel(field) }}
  </label>

  <!-- SELECT -->
      <select
      *ngIf="entityName === 'Grupos' && field === 'torneo'"
      [id]="field"
      [name]="field"
      class="form-select"
      [(ngModel)]="currentItem.torneo"
      required>
    
      <option [ngValue]="null">Seleccione un torneo</option>


       <option *ngFor="let torneo of torneos" [value]="torneo.id">
            {{ torneo.nombre }}
         </option>
    
    </select>

  <!-- INPUT -->
  <input
    *ngIf="!(entityName === 'Grupos' && field === 'torneo')"
    [id]="field"
    [name]="field"
    type="text"
    class="form-control"
    [(ngModel)]="currentItem[field]"
    [required]="!excludedFields.includes(field)"
  />

  <!-- VALIDACIÓN GLOBAL (SIN fieldRef) -->
  <div
    *ngIf="crudForm?.controls?.[field]?.invalid &&
           (crudForm?.controls?.[field]?.dirty ||
            crudForm?.controls?.[field]?.touched)"
    class="text-danger small mt-1">

    Campo requerido

  </div>

</div>

    <div class="d-flex gap-2">
      <button type="submit" class="btn btn-primary" [disabled]="crudForm.invalid || submitting">
        {{ submitting ? 'Guardando...' : editingId ? 'Actualizar' : 'Crear' }}
      </button>

      <button type="button" class="btn btn-secondary" (click)="onCancelForm()">
        Cancelar
      </button>
    </div>

  </form>
</div>
      </div>
    </div>
  `,
    styles: [`
    .bi {
      margin-right: 0.5rem;
    }
  `]
})
export class GenericCrudComponent implements OnInit {

    entityName = '';
    entityNameSingular = '';
    torneos: any[] = [];

    endpoint = '';

    items: any[] = [];
    currentItem: any = {};

    columns: string[] = [];
    formFields: string[] = [];

    excludedFields = ['id'];

    showForm = false;
    editingId: number | null = null;
    loading = false;
    submitting = false;
    error = false;
    errorMessage = '';

    /**
     * Configuración estática de campos
     */
    private modelConfig: Record<string, string[]> = {
        Arbitros: [
            'nombre',
            'apellido'
        ],
        Equipos: [
            'nombre'
        ],
        Usuarios: [
            'nombre',
            'apellido',
            'nombreUsuario',
            'password',
        ],
        Jugadores: [
            'nombre',
            'apellido',
            'fechaNacimiento',
            'foto',
            'huella',
        ],
        Roles: [
            'nombre'
        ],
        Grupos: [
            'nombre',
            'torneo'
        ],
        Goles: [
            'minuto',
            'descripcion'
        ],
        Torneos: [
            'nombre',
            'fechaInicio',
            'fechaFin'
        ]
    };

    constructor(
        private crudService: CrudService,
        private route: ActivatedRoute,
        private router: Router
    ) { }

    ngOnInit(): void {
        this.initializeEntity();
        this.loadData();
    }

    private initializeEntity(): void {
        const data = this.route.snapshot.data;

        this.entityName = data['entity'] || 'Entidad';
        this.entityNameSingular =
            data['entitySingular'] || this.entityName;

        this.endpoint =
            data['endpoint'] ||
            this.route.snapshot.url[0]?.path ||
            '';

        /**
         * Obtiene columnas únicamente del arreglo estático
         */
        this.columns =
            this.modelConfig[this.entityName] ?? [];

        if (this.columns.length === 0) {
            console.warn(
                `No existe configuración para ${this.entityName}`
            );
        }
    }

    private loadData(): void {
        if (!this.endpoint) {
            return;
        }

        this.loading = true;
        this.error = false;

        this.crudService.findAll(this.endpoint).subscribe({
            next: (data) => {
                this.items = Array.isArray(data)
                    ? data
                    : (data ? [data] : []);

                this.loading = false;
            },
            error: (err) => {
                console.error('Error al cargar:', err);

                this.error = true;
                this.errorMessage =
                    `No se pudo cargar ${this.entityName}`;

                this.loading = false;
            }
        });
    }

    getNestedProperty(obj: any, path: string): any {
        return path
            .split('.')
            .reduce(
                (current, prop) => current?.[prop],
                obj
            );
    }

    formatLabel(field: string): string {
        return field
            .replace(/([A-Z])/g, ' $1')
            .replace(/^./, str => str.toUpperCase())
            .trim();
    }

    onCreateClick(): void {
        this.editingId = null;

        this.currentItem = {};

        this.formFields = [...this.columns];

        this.showForm = true;

        if (this.entityName === 'Grupos') {
            this.loadTorneos();
        }


    }

    private loadTorneos(): void {
        this.crudService.findAll('torneos').subscribe({
            next: (data) => {
                this.torneos = Array.isArray(data) ? data : [];
            },
            error: (err) => {
                console.error('Error cargando torneos', err);
            }
        });
    }

    onEditClick(item: any): void {
        this.editingId = item.id;

        this.currentItem = { ...item };

        this.formFields = [...this.columns];

        if (this.entityName === 'Grupos') {
            this.loadTorneos();
        }

        this.showForm = true;
    }

    onSubmitForm(): void {
        if (!this.currentItem) {
            return;
        }

        this.submitting = true;

        const observable = this.editingId
            ? this.crudService.update(
                this.endpoint,
                this.editingId,
                this.currentItem
            )
            : this.crudService.create(
                this.endpoint,
                this.currentItem
            );

        observable.subscribe({
            next: (result) => {

                if (this.editingId) {

                    const index = this.items.findIndex(
                        item => item.id === this.editingId
                    );

                    if (index > -1) {
                        this.items[index] = result;
                    }

                    Swal.fire(
                        'Actualizado',
                        `${this.entityNameSingular} actualizado correctamente`,
                        'success'
                    );

                } else {

                    this.items.push(result);

                    Swal.fire(
                        'Creado',
                        `${this.entityNameSingular} creado correctamente`,
                        'success'
                    );
                }

                this.showForm = false;
                this.submitting = false;
            },
            error: (err) => {

                console.error('Error al guardar:', err);

                Swal.fire(
                    'Error',
                    `No se pudo guardar ${this.entityNameSingular}`,
                    'error'
                );

                this.submitting = false;
            }
        });
    }

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

    onCancelForm(): void {
        this.showForm = false;
        this.editingId = null;
        this.currentItem = {};
    }

    onBack(): void {
        this.router.navigate(['/dashboard']);
    }
}