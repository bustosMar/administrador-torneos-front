import {Component,OnInit,ViewChild,ElementRef,OnDestroy} from '@angular/core';
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
            <ng-container
                  *ngIf="
                    entityName === 'EquiposEnTorneo' ||
                    entityName === 'JugadoresEnEquipo';
                    else normal
                  ">
                
                  <ng-container
                    *ngIf="
                      entityName === 'JugadoresEnEquipo' &&
                      col === 'jugador';
                      else defaultValue
                    ">
                    {{ item.jugadorNombre }} {{ item.jugadorApellido }}
                  </ng-container>
                
                  <ng-template #defaultValue>
                    {{ item[col + 'Nombre'] ?? item[col] }}
                  </ng-template>
                
                </ng-container>
                
               <ng-template #normal>
                      {{
                        col === 'activo'
                          ? (getNestedProperty(item, col) ? 'Sí' : 'No')
                          : getNestedProperty(item, col)
                      }}
                </ng-template>
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

          <div *ngIf="!loading && items.length === 0" class="alert alert-warning">
            No hay registros para {{ entityName }}
          </div>
        </div>
      </div>

      <!-- Formulario de crear/editar -->
      <div *ngIf="showForm" class="card shadow-sm">
            <div class="card-header">
              <div class="d-flex justify-content-between align-items-center">
                <h5 class="mb-0"> {{ editingId ? 'Editar' : 'Crear' }}  {{ formatLabel(entityNameSingular) }}</h5>
                <button class="btn btn-secondary btn-sm" (click)="onCancelForm()">
                  <i class="bi bi-x"></i> Cancelar
                </button>
              </div>
            </div>
            <div class="card-body">
  <form (ngSubmit)="onSubmitForm()" #crudForm="ngForm">

    <div *ngFor="let field of formFields" class="mb-3">

       <!-- LABEL ÚNICO Y DINÁMICO -->
      <label [for]="field" class="form-label">
        {{ formatLabel(field) }}
      </label>

    <select
      *ngIf="(entityName === 'EquiposEnTorneo' && field === 'equipo') || 
             (entityName === 'JugadoresEnEquipo' && field === 'equipo')"
      [id]="field"
      [name]="field"
      class="form-select"
      [(ngModel)]="currentItem.equipo"
      [disabled]="editingId !== null && entityName !== 'JugadoresEnEquipo'"
      required
    >
      <option [ngValue]="null">Seleccione un equipo</option>
    
      <option *ngFor="let equipo of equipos" [ngValue]="equipo.id">
        {{ equipo.nombre }}
      </option>
    </select>

    <select
      *ngIf="entityName === 'Usuarios' && field === 'rol'"
      [id]="field"
      [name]="field"
      class="form-select"
      [(ngModel)]="currentItem.rol"
      required
    >
      <option [ngValue]="null">Seleccione un Rol</option>
    
      <option *ngFor="let rol of roles" [ngValue]="rol.id">
        {{ rol.nombre }}
      </option>
    </select>



    <select
          *ngIf="entityName === 'JugadoresEnEquipo' && field === 'jugador'"
          [id]="field"
          [name]="field"
          class="form-select"
          [(ngModel)]="currentItem.jugador"
          [disabled]="editingId !== null"
          required>
        
          <option [ngValue]="null">Seleccione un jugador</option>
        
          <option *ngFor="let jugador of jugadores" [ngValue]="jugador.id">
            {{ jugador.nombre }} {{ jugador.apellido || '' }}
          </option>
    </select>    
    

          

    <select
          *ngIf="entityName === 'EquiposEnTorneo' && field === 'torneo' || entityName === 'JugadoresEnEquipo' && field === 'torneo'"
          [id]="field"
          [name]="field"
          class="form-select"
          [(ngModel)]="currentItem.torneo"
          [disabled]="editingId !== null"
          required>
        
          <option [ngValue]="null">Seleccione un torneo</option>
        
          <option *ngFor="let torneo of torneos" [ngValue]="torneo.id">
            {{ torneo.nombre }}
          </option>
    </select>

    <select
          *ngIf="entityName === 'EquiposEnTorneo' && field === 'grupo'"
          [id]="field"
          [name]="field"
          class="form-select"
          [(ngModel)]="currentItem.grupo"
          required>
        
          <option [ngValue]="null">Seleccione un grupo</option>
        
          <option *ngFor="let grupo of grupos" [ngValue]="grupo.id">
            {{ grupo.nombre }}
          </option>
    </select>

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

  <!-- INPUT -->
      <input
          *ngIf="
            entityName !== 'EquiposEnTorneo' &&
            !(entityName === 'Usuarios' && field === 'rol') &&
            !(entityName === 'Jugadores' && field === 'foto') &&
            !(entityName === 'Jugadores' && field === 'fechaNacimiento') &&
            (
              entityName !== 'JugadoresEnEquipo' ||
              field === 'activo'
            )
          "
          [id]="field"
          [name]="field"
          type="text"
          class="form-control"
          [(ngModel)]="currentItem[field]"
          [required]="!excludedFields.includes(field)"
        />


    <div
      *ngIf="
        entityName === 'Jugadores' &&
        field === 'foto'
      "
      class="mt-2"
    >

  <video
    #video
    autoplay
    playsinline
    width="300"
    class="border rounded">
  </video>

  <canvas
    #canvas
    style="display:none">
  </canvas>

  <div class="mt-2">

    <button
      type="button"
      class="btn btn-primary me-2"
      (click)="iniciarCamara()">

      Abrir cámara
    </button>

    <button
      type="button"
      class="btn btn-success"
      (click)="capturarFoto()">

      Tomar foto
    </button>

  </div>

  <div
    *ngIf="fotoPreview"
    class="mt-3">

    <img
      [src]="fotoPreview"
      class="img-thumbnail"
      width="300">

  </div>

</div>
    

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
export class GenericCrudComponent implements OnInit, OnDestroy {

    entityName = '';
    entityNameSingular = '';
    torneos: any[] = [];
    grupos: any[] = [];
    equipos: any[] = [];
    jugadores: any[] = [];
    roles: any[] = [];

    @ViewChild('video')
    video!: ElementRef<HTMLVideoElement>;
    
    @ViewChild('canvas')
    canvas!: ElementRef<HTMLCanvasElement>;
    
    cameraStream!: MediaStream;
    
    fotoPreview: string | null = null;

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
        EquiposEnTorneo: [
           'equipo',
            'torneo',
            'grupo'
        ],
        Usuarios: [
            'nombre',
            'apellido',
            'nombreUsuario',
            'password',
            'rol',
        ],
        Jugadores: [
            'nombre',
            'apellido',
            'fechaNacimiento',
            'foto',
            'huella'
        ],
        Roles: [
            'nombre'
        ],
        Grupos: [
            'nombre'
        ],
        Goles: [
            'minuto',
            'descripcion'
        ],
        Torneos: [
            'nombre',
            'fechaInicio',
            'fechaFin'
        ],JugadoresEnEquipo: [
            'jugador',
            'equipo',
            'torneo',
            'activo'
            
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

        console.log(this.endpoint);

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

    formatLabel(text: string): string {
        if (!text) {
            return '';
        }
    
        return text
            .replace(/([a-z])([A-Z])/g, '$1 $2')
            .replace(/\s+/g, ' ')
            .trim()
            .replace(/^./, str => str.toUpperCase());
    }

    onCreateClick(): void {
        this.editingId = null;

        this.currentItem = {};

        this.fotoPreview = null;

        this.formFields = [...this.columns];

        this.showForm = true;
        if (this.entityName === 'EquiposEnTorneo' || this.entityName === 'JugadoresEnEquipo' || this.entityName === 'Usuarios') {
            this.loadTorneos();
            this.loadGrupos();
            this.loadEquipos();
            this.loadJugadores();
            this.loadRoles();
        }


    }

    private loadEquipos(): void {
        this.crudService.findAll('equipos').subscribe({
            next: data => {
                this.equipos = Array.isArray(data) ? data : [];
            },
            error: err => {
                console.error('Error cargando equipos', err);
            }
        });
    }
    
     private loadRoles(): void {
        this.crudService.findAll('roles').subscribe({
            next: data => {
                this.roles = Array.isArray(data) ? data : [];
            },
            error: err => {
                console.error('Error cargando roles', err);
            }
        });
    }

    private loadJugadores(): void {
        this.crudService.findAll('jugadores').subscribe({
            next: data => {
                this.jugadores = Array.isArray(data) ? data : [];
            },
            error: err => {
                console.error('Error cargando jugadores', err);
            }
        });
    }
    
    private loadGrupos(): void {
      this.crudService.findAll('grupos').subscribe({
        next: data => {
          this.grupos = Array.isArray(data) ? data : [];
        },
        error: err => {
                console.error('Error cargando grupos', err);
        }
      });
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

        this.fotoPreview =this.currentItem.foto || null;

        this.formFields = [...this.columns];

         if (this.entityName === 'EquiposEnTorneo' || this.entityName === 'JugadoresEnEquipo' || this.entityName === 'Usuarios') {
            this.loadTorneos();
            this.loadGrupos();
            this.loadEquipos();
            this.loadJugadores();
            this.loadRoles();
        }

        this.showForm = true;
    }

    async iniciarCamara(): Promise<void> {

    try {

        this.cameraStream =
            await navigator.mediaDevices.getUserMedia({
                video: true
            });

        this.video.nativeElement.srcObject =
            this.cameraStream;

    } catch (error) {

        console.error(error);

        Swal.fire(
            'Error',
            'No se pudo acceder a la cámara',
            'error'
        );
    }
}

capturarFoto(): void {

    const video =
        this.video.nativeElement;

    const canvas =
        this.canvas.nativeElement;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    const ctx =
        canvas.getContext('2d');

    if (!ctx) {
        return;
    }

    ctx.drawImage(
        video,
        0,
        0,
        canvas.width,
        canvas.height
    );

    const imagen =
        canvas.toDataURL('image/jpeg');

    this.fotoPreview = imagen;

    this.currentItem.foto = imagen;
}

cerrarCamara(): void {

    if (this.cameraStream) {

        this.cameraStream
            .getTracks()
            .forEach(track => track.stop());
    }
}

ngOnDestroy(): void {

    this.cerrarCamara();
}

onSubmitForm(): void {
    if (!this.currentItem) return;

    const payload = { ...this.currentItem }; // 👈 CLAVE: NO mutar original

    if (this.entityName === 'Jugadores' && payload.fechaNacimiento) {

        const [anio, mes, dia] = payload.fechaNacimiento.split('-');

        payload.fechaNacimiento = `${dia}/${mes}/${anio}`;
    }

    this.submitting = true;

    const observable = this.editingId
        ? this.crudService.update(this.endpoint, this.editingId, payload)
        : this.crudService.create(this.endpoint, payload);

    observable.subscribe({
        next: () => {
            Swal.fire('OK', 'Guardado correctamente', 'success');

            this.showForm = false;
            this.editingId = null;
            this.currentItem = {};
            this.submitting = false;

            this.loadData();
        },
        error: (err) => {
            console.error(err);
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

        this.cerrarCamara();
        this.showForm = false;
        this.editingId = null;
        this.currentItem = {};
        this.fotoPreview = null;

    }

    onBack(): void {
        this.router.navigate(['/dashboard']);
    }
}