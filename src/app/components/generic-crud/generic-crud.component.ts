import {
  Component,
  OnInit,
  ViewChild,
  ElementRef,
  OnDestroy
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, ActivatedRoute, Router } from '@angular/router';
import { CrudService } from '../../services/crud.service';
import { Subject, debounceTime, distinctUntilChanged, takeUntil } from 'rxjs';
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

          <!-- Buscador -->
          <div class="mb-3" *ngIf="!loading && allItems.length > 0">
            <input
              type="text"
              class="form-control"
              placeholder="Buscar..."
              [(ngModel)]="searchQuery"
              (keyup)="onSearch(searchQuery)">
          </div>

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
                        (
                          entityName === 'EquiposEnTorneo' ||
                          entityName === 'JugadoresEnEquipo' ||
                          entityName === 'CategoriaTorneo' ||
                          entityName === 'Torneos'
                        ) &&
                        !(col === 'activo' || col === 'activa');
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

                      <ng-container
                        *ngIf="
                          entityName === 'Jugadores' &&
                          col === 'foto';
                          else valorNormal
                        ">

                        <img
                          *ngIf="getNestedProperty(item, col)"
                          [src]="buildImageSrc(getNestedProperty(item, col))"
                          class="img-thumbnail"
                          width="100"
                          alt="Imagen">

                      </ng-container>

                      <ng-template #valorNormal>
                        {{
                          col === 'activo' || col === 'activa'
                            ? (getNestedProperty(item, col) ? 'Sí' : 'No')
                            : col === 'huella'
                              ? (getNestedProperty(item, col) ? 'Capturada' : 'Sin capturar')
                              : getNestedProperty(item, col)
                        }}
                      </ng-template>

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

          <!-- Paginación y info -->
          <div *ngIf="!loading && items.length > 0" class="mt-3">
            <div class="d-flex justify-content-between align-items-center">
              <div class="text-muted small">
                Mostrando {{ (currentPage - 1) * pageSize + 1 }} 
                a {{ getMinValue(currentPage * pageSize, totalItems) }} 
                de {{ totalItems }} registros
              </div>
              <nav aria-label="Page navigation">
                <ul class="pagination pagination-sm">
                  <li class="page-item" [ngClass]="{ disabled: currentPage === 1 }">
                    <button class="page-link" (click)="prevPage()" [disabled]="currentPage === 1">
                      Anterior
                    </button>
                  </li>
                  <li class="page-item active">
                    <span class="page-link">
                      Página {{ currentPage }} de {{ getTotalPages() }}
                    </span>
                  </li>
                  <li class="page-item" [ngClass]="{ disabled: currentPage >= getTotalPages() }">
                    <button class="page-link" (click)="nextPage()" [disabled]="currentPage >= getTotalPages()">
                      Siguiente
                    </button>
                  </li>
                </ul>
              </nav>
            </div>
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
            <h5 class="mb-0">
              {{ editingId ? 'Editar' : 'Crear' }} {{ formatLabel(entityNameSingular) }}
            </h5>
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

              <select
                *ngIf="
                  (entityName === 'EquiposEnTorneo' && field === 'equipo') ||
                  (entityName === 'JugadoresEnEquipo' && field === 'equipo')
                "
                [id]="field"
                [name]="field"
                class="form-select"
                [(ngModel)]="currentItem.equipo"
                [disabled]="editingId !== null && entityName !== 'JugadoresEnEquipo'"
                (change)="onEquipoChangeJugador(currentItem.equipo, currentItem.torneo)"
                required>
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
                required>
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
                *ngIf="
                  (entityName === 'EquiposEnTorneo' && field === 'torneo') ||
                  (entityName === 'JugadoresEnEquipo' && field === 'torneo')
                "
                [id]="field"
                [name]="field"
                class="form-select"
                [(ngModel)]="currentItem.torneo"
                (change)="onTorneoChangeEquipo(currentItem.torneo)"
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

              <select
                *ngIf="entityName === 'CategoriaTorneo' && field === 'torneo'"
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
                *ngIf="entityName === 'CategoriaTorneo' && field === 'categoria'"
                [id]="field"
                [name]="field"
                class="form-select"
                [(ngModel)]="currentItem.categoria"
                [disabled]="editingId !== null"
                required>
                <option [ngValue]="null">Seleccione una categoría</option>
                <option *ngFor="let categoria of categorias" [ngValue]="categoria.id">
                  {{ categoria.nombre }}
                </option>
              </select>

              <select
                *ngIf="entityName === 'JugadoresEnEquipo' && field === 'categoriaTorneo'"
                [id]="field"
                [name]="field"
                class="form-select"
                [(ngModel)]="currentItem.categoriaTorneo"
                [disabled]="categoriasTorneo.length === 0">
                <option [ngValue]="null">Seleccione una categoría</option>
                <option *ngFor="let cat of categoriasTorneo" [ngValue]="cat.id">
                  {{ cat.categoriaNombre || cat.nombre }}
                </option>
              </select>

              <select
                *ngIf="field === 'activo' || field === 'activa'"
                [id]="field"
                [name]="field"
                class="form-select"
                [(ngModel)]="currentItem[field]"
                [compareWith]="compareWithBoolean"
                required>
                <option [ngValue]="true">Sí</option>
                <option [ngValue]="false">No</option>
              </select>

              <select
                *ngIf="entityName === 'Torneos' && field === 'estado'"
                [id]="'estado'"
                [name]="'estado'"
                class="form-select"
                [(ngModel)]="currentItem.estado"
                (change)="onEstadoChange(currentItem.estado)"
                required>
                <option [ngValue]="null">Seleccione un estado</option>
                <option *ngFor="let estado of estados" [ngValue]="estado.id">
                  {{ estado.nombre }}
                </option>
              </select>

              <select
                *ngIf="entityName === 'Torneos' && field === 'municipio'"
                [id]="'municipio'"
                [name]="'municipio'"
                class="form-select"
                [(ngModel)]="currentItem.municipio"
                (change)="onMunicipioChange(currentItem.municipio)"
                [disabled]="!currentItem.estado || municipios.length === 0"
                required>
                <option [ngValue]="null">Seleccione un municipio</option>
                <option *ngFor="let municipio of municipios" [ngValue]="municipio.id">
                  {{ municipio.nombre }}
                </option>
              </select>

              <select
                *ngIf="entityName === 'EquiposEnTorneo' && field === 'categoriaTorneo'"
                [id]="'categoriaTorneo'"
                [name]="'categoriaTorneo'"
                class="form-select"
                [(ngModel)]="currentItem.categoriaTorneo"
                [disabled]="!currentItem.torneo"
                required>
                <option [ngValue]="null">Seleccione una categoría</option>
                <option *ngFor="let cat of categoriasTorneo" [ngValue]="cat.id">
                  {{ cat.categoriaNombre }}
                </option>
              </select>

              <input
                *ngIf="entityName === 'Jugadores' && field === 'fechaNacimiento'"
                [id]="field"
                [name]="field"
                type="date"
                class="form-control"
                [(ngModel)]="currentItem[field]"
                required />

              <input
                *ngIf="entityName === 'Torneos' && (field === 'fechaInicio' || field === 'fechaFin')"
                [id]="field"
                [name]="field"
                type="date"
                class="form-control"
                [(ngModel)]="currentItem[field]"
                required />

              <input
                *ngIf="
                  entityName !== 'EquiposEnTorneo' &&
                  !(entityName === 'Usuarios' && field === 'rol') &&
                  !(entityName === 'Jugadores' && field === 'foto') &&
                  !(entityName === 'Jugadores' && field === 'fechaNacimiento') &&
                  !(entityName === 'Jugadores' && field === 'huella') &&
                  !(entityName === 'Torneos' && (field === 'fechaInicio' || field === 'fechaFin')) &&
                  !(entityName === 'Torneos' && (field === 'estado' || field === 'municipio')) &&
                  !(entityName === 'EquiposEnTorneo' && field === 'categoriaTorneo') &&
                  !(entityName === 'CategoriaTorneo' && (field === 'torneo' || field === 'categoria')) &&
                  !(field === 'activo' || field === 'activa') &&
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
                [required]="!excludedFields.includes(field) && !(optionalFields[entityName]?.includes(field))" />

              <!-- HUELLA DIGITAL -->
              <div
                *ngIf="entityName === 'Jugadores' && field === 'huella'"
                class="border rounded p-3">

                <input
                [id]="field"
                [name]="field"
                type="hidden"
                [(ngModel)]="currentItem.huella"
                [required]="entityName !== 'Jugadores'" />

                <div class="mb-2">
                  <span
                    class="badge"
                    [ngClass]="currentItem.huella ? 'bg-success' : 'bg-secondary'">
                    {{ currentItem.huella ? 'Huella capturada' : 'Sin huella capturada' }}
                  </span>
                </div>

                <div class="d-flex gap-2">
                  <button
                    type="button"
                    class="btn btn-outline-primary"
                    (click)="escucharLector()"
                    [disabled]="escuchandoHuella">
                    {{ escuchandoHuella ? 'Escuchando...' : 'Escuchar lector' }}
                  </button>

                <button
                  type="button"
                  class="btn btn-outline-success"
                  (click)="capturarHuella()"
                  [disabled]="!escuchandoHuella">
                  Capturar huella
                </button>

                  <button
                    type="button"
                    class="btn btn-outline-secondary"
                    (click)="limpiarHuella()">
                    Limpiar huella
                  </button>
                </div>

                <small class="text-muted d-block mt-2">
                  {{ huellaStatus }}
                </small>

              </div>

              <!-- FOTO -->
              <div
                *ngIf="entityName === 'Jugadores' && field === 'foto'"
                class="mt-2">

                <ng-container >

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

                </ng-container>

                <div *ngIf="fotoPreview" class="mt-3">
                  <img
                    [src]="fotoPreview"
                    class="img-thumbnail"
                    width="300">
                </div>

              </div>

              <div
                *ngIf="
                  crudForm?.controls?.[field]?.invalid &&
                  (
                    crudForm?.controls?.[field]?.dirty ||
                    crudForm?.controls?.[field]?.touched
                  )
                "
                class="text-danger small mt-1">
                Campo requerido
              </div>

            </div>

            <div class="d-flex gap-2">
              <button
                type="submit"
                class="btn btn-primary"
                [disabled]="crudForm.invalid || submitting">
                {{ submitting ? 'Guardando...' : editingId ? 'Actualizar' : 'Crear' }}
              </button>

              <button
                type="button"
                class="btn btn-secondary"
                (click)="onCancelForm()">
                Cancelar
              </button>
            </div>

          </form>
        </div>
      </div>

      <!-- Modal de selección de categorías para JugadorEnEquipo -->
      <div *ngIf="showCategorySelection && entityName === 'JugadorEnEquipo'" class="card shadow-sm">
        <div class="card-header">
          <div class="d-flex justify-content-between align-items-center">
            <h5 class="mb-0">Selecciona Categorías</h5>
          </div>
        </div>

        <div class="card-body">
          <p class="text-muted">El jugador puede participar en máximo 2 categorías: (Primera + Veteranos) o (Segunda + Veteranos)</p>
          
          <div class="alert alert-info">
            <strong>Categorías seleccionadas:</strong>
            <div *ngIf="categoriasSeleccionadas.length === 0" class="text-muted mt-2">
              Ninguna categoría seleccionada
            </div>
            <div *ngFor="let cat of categoriasSeleccionadas" class="badge bg-primary me-2 mt-2">
              {{ cat.categoria?.nombre }}
            </div>
          </div>

          <div class="row">
            <div *ngFor="let categoria of categoriasDisponibles" class="col-md-6 col-lg-4 mb-3">
              <div class="card" 
                   [class.border-primary]="estaCategoriaSeleccionada(categoria.id)"
                   [class.bg-light]="estaCategoriaSeleccionada(categoria.id)"
                   (click)="seleccionarCategoria(categoria)"
                   style="cursor: pointer;">
                <div class="card-body">
                  <div class="form-check">
                    <input 
                      type="checkbox" 
                      class="form-check-input" 
                      [checked]="estaCategoriaSeleccionada(categoria.id)"
                      [id]="obtenerIdCategoria(categoria.id)">
                    <label class="form-check-label" [for]="obtenerIdCategoria(categoria.id)">
                      <strong>{{ categoria.categoria?.nombre }}</strong>
                    </label>
                  </div>
                  <small class="text-muted d-block mt-2">
                    Edad mínima: {{ categoria.categoria?.edadMinima || 'N/A' }}
                    <span *ngIf="categoria.categoria?.edadMaxima">
                      - Edad máxima: {{ categoria.categoria?.edadMaxima }}
                    </span>
                  </small>
                </div>
              </div>
            </div>
          </div>

          <div class="d-flex gap-2 mt-4">
            <button 
              type="button"
              class="btn btn-success"
              (click)="guardarCategoriasSeleccionadas()"
              [disabled]="categoriasSeleccionadas.length === 0 || submitting">
              {{ submitting ? 'Guardando...' : 'Confirmar Categorías' }}
            </button>

            <button 
              type="button"
              class="btn btn-secondary"
              (click)="cancelarCategoriasSeleccionadas()">
              Cancelar
            </button>
          </div>
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

  private huellaInterval: any = null;
  entityName = '';
  entityNameSingular = '';

  torneos: any[] = [];
  grupos: any[] = [];
  equipos: any[] = [];
  jugadores: any[] = [];
  roles: any[] = [];
  categorias: any[] = [];
  estados: any[] = [];
  municipios: any[] = [];
  categoriasTorneo: any[] = [];

  // Para JugadorEnEquipo + Categorías
  showCategorySelection = false;
  categoriasDisponibles: any[] = [];
  categoriasSeleccionadas: any[] = [];
  jugadorEnEquipoId: number | null = null;

  @ViewChild('video')
  video!: ElementRef<HTMLVideoElement>;

  @ViewChild('canvas')
  canvas!: ElementRef<HTMLCanvasElement>;

  cameraStream!: MediaStream;
  fotoPreview: string | null = null;

  huellaStatus = 'Sin capturar';
  escuchandoHuella = false;
 
  endpoint = '';

  items: any[] = [];
  currentItem: any = {};

  columns: string[] = [];
  formFields: string[] = [];

  excludedFields = ['id'];

  optionalFields: { [key: string]: string[] } = {
    'Categorias': ['edadMinima', 'edadMaxima'],
    'EquiposEnTorneo': ['grupo']
  };

  showForm = false;
  editingId: number | null = null;
  loading = false;
  submitting = false;
  error = false;
  errorMessage = '';

  // Paginación y búsqueda
  searchQuery = '';
  pageSize = 20;
  currentPage = 1;
  totalItems = 0;
  allItems: any[] = [];
  filteredItems: any[] = [];

  // Debounce para búsqueda
  private searchSubject = new Subject<string>();
  private destroy$ = new Subject<void>();

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
      'categoriaTorneo',
      'grupo'
    ],
    Usuarios: [
      'nombre',
      'apellido',
      'nombreUsuario',
      'password',
      'rol'
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
      'fechaFin',
      'activo',
      'estado',
      'municipio'
    ],
    JugadoresEnEquipo: [
      'jugador',
      'torneo',
      'equipo',
      'categoriaTorneo',
      'activo'
    ],
    Categorias: [
      'nombre',
      'edadMinima',
      'edadMaxima'
    ],
    CategoriaTorneo: [
      'torneo',
      'categoria',
      'activa'
    ],
    JugadorEnCategoria: [
      'jugador',
      'categoriaTorneo',
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

    // Suscribir al searchSubject con debounce de 500ms
    this.searchSubject
      .pipe(
        debounceTime(500),
        distinctUntilChanged(),
        takeUntil(this.destroy$)
      )
      .subscribe(query => {
        this.performSearch(query);
      });
  }

  private initializeEntity(): void {
    const data = this.route.snapshot.data;

    this.entityName = data['entity'] || 'Entidad';
    this.entityNameSingular = data['entitySingular'] || this.entityName;

    this.endpoint =
      data['endpoint'] ||
      this.route.snapshot.url[0]?.path ||
      '';

    this.columns = this.modelConfig[this.entityName] ?? [];

    if (this.columns.length === 0) {
      console.warn(`No existe configuración para ${this.entityName}`);
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
        this.allItems = Array.isArray(data)
          ? data
          : (data ? [data] : []);

        this.totalItems = this.allItems.length;
        this.currentPage = 1;
        this.searchQuery = '';
        this.updatePaginatedItems();

        this.loading = false;
      },
      error: (err) => {
        console.error('Error al cargar:', err);

        this.error = true;
        this.errorMessage = `No se pudo cargar ${this.entityName}`;

        this.loading = false;
      }
    });
  }

  private updatePaginatedItems(): void {
    // Ya no necesitamos filtrar localmente porque el backend hace la búsqueda
    // Solo paginamos los items ya filtrados
    this.totalItems = this.allItems.length;
    const totalPages = Math.ceil(this.totalItems / this.pageSize);
    
    if (this.currentPage > totalPages && totalPages > 0) {
      this.currentPage = totalPages;
    }

    const startIndex = (this.currentPage - 1) * this.pageSize;
    const endIndex = startIndex + this.pageSize;
    this.items = this.allItems.slice(startIndex, endIndex);
  }

  onSearch(query: string): void {
    this.searchQuery = query;
    this.currentPage = 1;
    // Emitir al subject para que el debounce lo maneje
    this.searchSubject.next(query);
  }

  private performSearch(query: string): void {
    if (query.trim() === '') {
      // Si la búsqueda está vacía, cargar todos los items
      this.loadData();
    } else {
      // Buscar en el backend
      this.loading = true;
      this.crudService.search(this.endpoint, query).subscribe({
        next: (data) => {
          this.allItems = Array.isArray(data) ? data : (data ? [data] : []);
          this.totalItems = this.allItems.length;
          this.currentPage = 1;
          this.updatePaginatedItems();
          this.loading = false;
        },
        error: (error) => {
          console.error('Error buscando:', error);
          this.error = true;
          this.errorMessage = 'Error al buscar. Intente de nuevo.';
          this.loading = false;
        }
      });
    }
  }

  nextPage(): void {
    const totalPages = Math.ceil(this.totalItems / this.pageSize);
    if (this.currentPage < totalPages) {
      this.currentPage++;
      this.updatePaginatedItems();
    }
  }

  prevPage(): void {
    if (this.currentPage > 1) {
      this.currentPage--;
      this.updatePaginatedItems();
    }
  }

  getTotalPages(): number {
    return Math.ceil(this.totalItems / this.pageSize);
  }

  compareWithBoolean(a: any, b: any): boolean {
    return a === b;
  }

  getMinValue(a: number, b: number): number {
    return Math.min(a, b);
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

  buildImageSrc(valor: string): string {
    if (!valor) {
      return '';
    }

    if (valor.startsWith('data:image')) {
      return valor;
    }

    return `data:image/jpeg;base64,${valor}`;
  }

  private normalizeBooleanFields(item: any): any {
    if (!item) return item;
    
    const normalized = { ...item };
    
    // Normalizar campo 'activo'
    if (normalized.hasOwnProperty('activo')) {
      normalized.activo = this.toBoolean(normalized.activo);
    }
    
    // Normalizar campo 'activa'
    if (normalized.hasOwnProperty('activa')) {
      normalized.activa = this.toBoolean(normalized.activa);
    }
    
    return normalized;
  }

  private toBoolean(value: any): boolean {
    if (typeof value === 'boolean') return value;
    if (typeof value === 'string') return value.toLowerCase() === 'true';
    if (typeof value === 'number') return value !== 0;
    return Boolean(value);
  }

  onCreateClick(): void {
    this.editingId = null;
    this.currentItem = this.normalizeBooleanFields({});
    this.fotoPreview = null;
    this.huellaStatus = 'Sin capturar';
    this.escuchandoHuella = false;

    this.formFields = [...this.columns];
    this.showForm = true;

    if (
      this.entityName === 'EquiposEnTorneo' ||
      this.entityName === 'JugadoresEnEquipo' ||
      this.entityName === 'Usuarios' ||
      this.entityName === 'CategoriaTorneo'
    ) {
      this.loadTorneos();
      this.loadGrupos();
      this.loadEquipos();
      this.loadJugadores();
      this.loadRoles();
      this.loadCategorias();
    }

    if (this.entityName === 'Torneos') {
      this.loadEstados();
    }
  }

  onEditClick(item: any): void {
    this.editingId = item.id;

    const itemToEdit = { ...item };

    // Convertir fechaNacimiento si existe (Jugadores)
    if (itemToEdit.fechaNacimiento) {
      itemToEdit.fechaNacimiento = this.toInputDate(itemToEdit.fechaNacimiento);
    }

    // Convertir fechaInicio y fechaFin si existen (Torneos)
    if (itemToEdit.fechaInicio) {
      itemToEdit.fechaInicio = this.toInputDate(itemToEdit.fechaInicio);
    }
    if (itemToEdit.fechaFin) {
      itemToEdit.fechaFin = this.toInputDate(itemToEdit.fechaFin);
    }

    this.currentItem = this.normalizeBooleanFields(itemToEdit);

   this.fotoPreview = this.currentItem.foto
    ? this.buildImageSrc(this.currentItem.foto)
    : null;

    this.huellaStatus = this.currentItem.huella
      ? 'Huella ya capturada'
      : 'Sin capturar';

    this.escuchandoHuella = false;

    this.formFields = [...this.columns];

    if (
      this.entityName === 'EquiposEnTorneo' ||
      this.entityName === 'JugadoresEnEquipo' ||
      this.entityName === 'Usuarios' ||
      this.entityName === 'CategoriaTorneo'
    ) {
      this.loadTorneos();
      this.loadGrupos();
      this.loadEquipos();
      this.loadJugadores();
      this.loadRoles();
      this.loadCategorias();
    }

    if (this.entityName === 'Torneos') {
      this.loadEstados();
      if (this.currentItem.estado) {
        this.loadMunicipiosByEstado(this.currentItem.estado);
      }
    }

    if (this.entityName === 'EquiposEnTorneo' && this.currentItem.torneo) {
      this.loadCategoriasByTorneo(this.currentItem.torneo);
    }

    this.showForm = true;
  }

    escucharLector(): void {
  if (this.entityName !== 'Jugadores') {
    return;
  }

  this.huellaStatus = 'Iniciando escucha del lector...';
  this.escuchandoHuella = true;

  this.crudService.escucharLectorHuella().subscribe({
    next: (response: any) => {
      this.huellaStatus = response?.mensaje || 'Lector en escucha';
      this.iniciarConsultaHuella();
    },
    error: (err) => {
      console.error(err);

      this.huellaStatus = 'Error al iniciar lector';
      this.escuchandoHuella = false;

      Swal.fire(
        'Error',
        'No se pudo iniciar la escucha del lector',
        'error'
      );
    }
  });
}

private iniciarConsultaHuella(): void {
  this.detenerConsultaHuella();

  this.huellaInterval = setInterval(() => {
    this.crudService.obtenerHuella().subscribe({
      next: (response: any) => {
        this.huellaStatus = response?.mensaje || 'Esperando huella...';

        if (response?.templateBase64) {
          this.currentItem.huella = response.templateBase64;
          this.huellaStatus = 'Huella capturada correctamente';
          this.escuchandoHuella = false;

          this.detenerConsultaHuella();

          Swal.fire(
            'OK',
            'Huella capturada correctamente',
            'success'
          );
        }
      },
      error: (err) => {
        console.error(err);
        this.huellaStatus = 'Error consultando huella';
        this.escuchandoHuella = false;
        this.detenerConsultaHuella();
      }
    });
  }, 4000);
}

private detenerConsultaHuella(): void {
  if (this.huellaInterval) {
    clearInterval(this.huellaInterval);
    this.huellaInterval = null;
  }
}

    capturarHuella(): void {
    if (this.entityName !== 'Jugadores') {
      return;
    }

  this.huellaStatus = 'Obteniendo huella capturada...';

  this.crudService.obtenerHuella().subscribe({
    next: (response: any) => {
      if (!response || !response.templateBase64) {
        this.huellaStatus = response?.mensaje || 'Todavía no se ha capturado la huella';

        Swal.fire(
          'Aviso',
          this.huellaStatus,
          'warning'
        );

        return;
      }

      this.currentItem.huella = response.templateBase64;
      this.huellaStatus = 'Huella capturada correctamente';
      this.escuchandoHuella = false;

      Swal.fire(
        'OK',
        'Huella capturada correctamente',
        'success'
      );
    },
    error: (err) => {
      console.error('Error completo:', err);

      this.huellaStatus = 'Error al obtener huella';
      this.escuchandoHuella = false;

      Swal.fire(
        'Error',
        JSON.stringify(err.error),
        'error'
      );
    }
  });
}


  limpiarHuella(): void {
    this.currentItem.huella = null;
    this.huellaStatus = 'Sin capturar';
    this.escuchandoHuella = false;
    this.detenerConsultaHuella();
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
    const video = this.video.nativeElement;
    const canvas = this.canvas.nativeElement;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    const ctx = canvas.getContext('2d');

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

    const imagen = canvas.toDataURL('image/jpeg');

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

  onSubmitForm(): void {
    if (!this.currentItem) {
      return;
    }

    const payload = { ...this.currentItem };

    if (this.entityName === 'Jugadores' && payload.fechaNacimiento) {
      const [anio, mes, dia] = payload.fechaNacimiento.split('-');
      payload.fechaNacimiento = `${dia}/${mes}/${anio}`;
    }

    if (this.entityName === 'Torneos') {
      if (payload.fechaInicio) {
        const [anio, mes, dia] = payload.fechaInicio.split('-');
        payload.fechaInicio = `${dia}/${mes}/${anio}`;
      }
      if (payload.fechaFin) {
        const [anio, mes, dia] = payload.fechaFin.split('-');
        payload.fechaFin = `${dia}/${mes}/${anio}`;
      }
    }

    this.submitting = true;

    const observable = this.editingId
      ? this.crudService.update(this.endpoint, this.editingId, payload)
      : this.crudService.create(this.endpoint, payload);

    observable.subscribe({
      next: (response) => {
        // Si es JugadorEnEquipo y es creación (no edición), mostrar selección de categorías
        if (this.entityName === 'JugadorEnEquipo' && !this.editingId) {
          this.jugadorEnEquipoId = response?.id;
          this.categoriasSeleccionadas = [];
          this.showCategorySelection = true;
          this.showForm = false;
          this.submitting = false;
          
          // Cargar categorías disponibles
          this.cargarCategoriasDisponibles(this.currentItem.torneo);
          
          Swal.fire('OK', 'Jugador asignado al equipo. Ahora selecciona las categorías.', 'success');
        } else {
          // Para otros tipos, cerrar formulario normalmente
          Swal.fire('OK', 'Guardado correctamente', 'success');
          this.mostrarFormularioPrincipal();
        }
      },
      error: (err) => {
        console.error(err);
        this.submitting = false;

        Swal.fire(
          'Error',
          'No se pudo guardar el registro',
          'error'
        );
      }
    });
  }

  private mostrarFormularioPrincipal(): void {
    this.showForm = false;
    this.showCategorySelection = false;
    this.editingId = null;
    this.currentItem = {};
    this.submitting = false;
    this.fotoPreview = null;
    this.huellaStatus = 'Sin capturar';
    this.escuchandoHuella = false;
    this.categoriasSeleccionadas = [];
    this.jugadorEnEquipoId = null;

    this.cerrarCamara();
    this.loadData();
  }

  private cargarCategoriasDisponibles(torneoId: number): void {
    this.crudService.findAll(`torneos/${torneoId}/categoria-torneo`).subscribe({
      next: (data) => {
        this.categoriasDisponibles = Array.isArray(data) ? data : [];
      },
      error: (err) => {
        console.error('Error cargando categorías:', err);
        this.categoriasDisponibles = [];
      }
    });
  }

  seleccionarCategoria(categoria: any): void {
    const index = this.categoriasSeleccionadas.findIndex(c => c.id === categoria.id);
    
    if (index > -1) {
      // Deseleccionar
      this.categoriasSeleccionadas.splice(index, 1);
    } else {
      // Seleccionar con validación
      if (this.esSeleccionValida(categoria)) {
        this.categoriasSeleccionadas.push(categoria);
      } else {
        Swal.fire('No permitido', 'No puedes seleccionar Primera y Segunda en el mismo torneo. Solo: (Primera + Veteranos) o (Segunda + Veteranos)', 'warning');
      }
    }
  }

  private esSeleccionValida(nuevaCategoria: any): boolean {
    const nombreNueva = nuevaCategoria.categoria?.nombre.toLowerCase() || '';
    
    // Si ya tiene 2 categorías, no permitir más
    if (this.categoriasSeleccionadas.length >= 2) {
      return false;
    }

    // Si ya tiene categorías, validar combinación
    for (let cat of this.categoriasSeleccionadas) {
      const nombreExistente = cat.categoria?.nombre.toLowerCase() || '';
      
      // Prohibir Primera + Segunda
      if ((nombreNueva.includes('primera') && nombreExistente.includes('segunda')) ||
          (nombreNueva.includes('segunda') && nombreExistente.includes('primera'))) {
        return false;
      }
    }

    return true;
  }

  guardarCategoriasSeleccionadas(): void {
    if (this.categoriasSeleccionadas.length === 0) {
      Swal.fire('Advertencia', 'Debes seleccionar al menos una categoría', 'warning');
      return;
    }

    this.submitting = true;

    // Crear cada inscripción en categoría
    const inscripciones = this.categoriasSeleccionadas.map(cat => 
      this.crudService.create('jugador-categoria', {
        jugadorId: this.currentItem.jugador,
        categoriaTorneoId: cat.id,
        activo: true
      })
    );

    // Ejecutar todas las inscripciones en paralelo
    Promise.all(inscripciones.map(ins => ins.toPromise())).then(() => {
      Swal.fire('OK', 'Jugador inscrito en categorías correctamente', 'success');
      this.mostrarFormularioPrincipal();
    }).catch((err) => {
      console.error('Error inscribiendo en categorías:', err);
      Swal.fire('Error', 'No se pudo inscribir en todas las categorías', 'error');
      this.submitting = false;
    });
  }

  cancelarCategoriasSeleccionadas(): void {
    Swal.fire({
      title: '¿Cancelar?',
      text: 'Se eliminará la asignación del jugador al equipo',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#dc3545',
      cancelButtonColor: '#6c757d',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar'
    }).then((result) => {
      if (result.isConfirmed && this.jugadorEnEquipoId) {
        this.crudService.remove('jugador-en-equipo', this.jugadorEnEquipoId).subscribe({
          next: () => {
            this.mostrarFormularioPrincipal();
          },
          error: (err) => {
            console.error('Error eliminando:', err);
          }
        });
      }
    });
  }

  // Métodos helper para el template de selección de categorías
  estaCategoriaSeleccionada(categoriaId: number): boolean {
    return this.categoriasSeleccionadas.some(c => c.id === categoriaId);
  }

  obtenerIdCategoria(categoriaId: number): string {
    return 'cat_' + categoriaId;
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
            console.error('Error al eliminar:', err);

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
    this.huellaStatus = 'Sin capturar';
    this.escuchandoHuella = false;
  }

  onBack(): void {
    this.router.navigate(['/dashboard']);
  }

  ngOnDestroy(): void {
    this.cerrarCamara();
    this.detenerConsultaHuella();
    this.destroy$.next();
    this.destroy$.complete();
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
      next: data => {
        this.torneos = Array.isArray(data) ? data : [];
      },
      error: err => {
        console.error('Error cargando torneos', err);
      }
    });
  }

  private loadCategorias(): void {
    this.crudService.findAll('categorias').subscribe({
      next: data => {
        this.categorias = Array.isArray(data) ? data : [];
      },
      error: err => {
        console.error('Error cargando categorias', err);
      }
    });
  }

  private loadEstados(): void {
    this.crudService.findAll('estados').subscribe({
      next: data => {
        this.estados = Array.isArray(data) ? data : [];
      },
      error: err => {
        console.error('Error cargando estados', err);
      }
    });
  }

  private loadCategoriasByTorneo(torneoId: any): void {
    this.crudService.findAll(`categoria-torneo?torneoId=${torneoId}`).subscribe({
      next: data => {
        this.categoriasTorneo = Array.isArray(data) ? data : [];
      },
      error: err => {
        console.error('Error cargando categorías del torneo', err);
      }
    });
  }

  private loadMunicipiosByEstado(estadoId: any): void {
    this.crudService.findAll(`municipios/estado/${estadoId}`).subscribe({
      next: data => {
        this.municipios = Array.isArray(data) ? data : [];
      },
      error: err => {
        console.error('Error cargando municipios', err);
      }
    });
  }

  onEstadoChange(estadoId: any): void {
    if (estadoId) {
      this.loadMunicipiosByEstado(estadoId);
      this.currentItem.municipio = null;
      this.currentItem.municipioEstado = null;
    }
  }

  onMunicipioChange(municipioId: any): void {
    if (municipioId && this.currentItem.estado) {
      // Obtener el ID de MunicipioEstado
      this.crudService.getWithParams('municipio-estado/find', { municipioId, estadoId: this.currentItem.estado }).subscribe({
        next: (idMunicipioEstado: any) => {
          this.currentItem.municipioEstado = idMunicipioEstado;
        },
        error: err => {
          console.error('Error obteniendo municipio-estado', err);
        }
      });
    }
  }

  onTorneoChangeEquipo(torneoId: any): void {
    if (!torneoId) return;
    
    if (this.entityName === 'EquiposEnTorneo') {
      this.loadCategoriasByTorneo(torneoId);
      this.currentItem.categoriaTorneo = null;
    } else if (this.entityName === 'JugadoresEnEquipo') {
      // Solo resetear categoría, NO equipo
      this.currentItem.categoriaTorneo = null;
    }
  }

  onEquipoChangeJugador(equipoId: any, torneoId: any): void {
    console.log('onEquipoChangeJugador called con equipoId:', equipoId, 'torneoId:', torneoId, 'entityName:', this.entityName);
    
    if (equipoId && torneoId && this.entityName === 'JugadoresEnEquipo') {
      // Buscar los equipos-en-torneo que coincidan con este equipo y torneo
      this.crudService.findAll('equipos-en-torneo').subscribe({
        next: (data: any[]) => {
          console.log('Datos equipos-en-torneo recibidos:', data);
          
          if (Array.isArray(data)) {
            // Convertir IDs a números para comparación correcta
            const equipoIdNum = Number(equipoId);
            const torneoIdNum = Number(torneoId);
            
            // Filtrar los equipos en torneo para este equipo y torneo específico
            const equiposDelEquipo = data.filter(e => {
              const eEquipoNum = Number(e.equipo);
              const eTorneoNum = Number(e.torneo);
              const matches = eEquipoNum === equipoIdNum && eTorneoNum === torneoIdNum;
              console.log(`Comparando: equipo ${eEquipoNum} === ${equipoIdNum}? ${eEquipoNum === equipoIdNum}, torneo ${eTorneoNum} === ${torneoIdNum}? ${eTorneoNum === torneoIdNum}, matches: ${matches}`);
              return matches;
            });
            
            console.log('Equipos filtrados:', equiposDelEquipo);
            
            // Extraer las categorías únicas
            const categoriasDelEquipo = equiposDelEquipo.map(e => ({
              id: e.categoriaTorneo,
              categoriaNombre: e.categoriaTorneoNombre
            }));
            
            console.log('Categorías extraídas:', categoriasDelEquipo);
            
            // Asignar a categoriasTorneo para que el select las muestre
            this.categoriasTorneo = categoriasDelEquipo;
            this.currentItem.categoriaTorneo = null; // Limpiar la selección anterior
            
            console.log('categoriasTorneo asignado:', this.categoriasTorneo);
          }
        },
        error: (err) => {
          console.error('Error cargando categorías del equipo', err);
        }
      });
    } else {
      console.log('Condiciones no cumplidas - equipoId:', equipoId, 'torneoId:', torneoId, 'entityName:', this.entityName);
    }
  }

  private toInputDate(date: string): string {
    if (!date) {
      return '';
    }

    if (date.includes('/')) {
      const [day, month, year] = date.split('/');
      return `${year}-${month}-${day}`;
    }

    return date.slice(0, 5);
  }
}