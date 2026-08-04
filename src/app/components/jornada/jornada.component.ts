import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterModule, Router } from '@angular/router';
import { CrudService } from '../../services/crud.service';
import { JornadaService } from '../../services/jornada.service';
import { CommonModule } from '@angular/common';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-jornada',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './jornada.component.html'
})
export class JornadaComponent implements OnInit {

  torneoId: number | null = null;
  categoriaId: number | null = null;
  grupoId: number | null = null;
  jornadaVisualizada: any = null;
  mensajeJornadas: string = '';

  torneos: any[] = [];
  grupos: any[] = [];
  jornadas: any[] = [];
  partidos: any[] = []; 
  categoriasDisponibles: any[] = [];
  jornadasResumen: any[] = [];

  constructor(
    private crudService: CrudService,
    private jornadaService: JornadaService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.cargarTorneos();
  }

  cargarTorneos(): void {
    this.crudService.findAll('torneos').subscribe({
      next: (data: any) => {

        console.log('TORNEOS RESPUESTA:', data);

        this.torneos = Array.isArray(data)
          ? data
          : (data?._embedded?.torneos ?? []);

      },
      error: () => {
        this.torneos = [];
      }
    });
  }



generarJornada(): void {

  if (!this.torneoId) {

    Swal.fire(
      'Atención',
      'Seleccione un torneo',
      'warning'
    );

    return;
  }

  if (!this.categoriaId) {

    Swal.fire(
      'Atención',
      'Seleccione una categoría',
      'warning'
    );

    return;
  }

  this.jornadaService
    .visualizarJornada(
      'jornadas',
      this.torneoId,
      this.categoriaId
    )
    .subscribe({

      next: (data: any) => {

        this.jornadaVisualizada = data;

        this.jornadas = data ? [data] : [];

        this.partidos = data?.partidos ?? [];
        this.jornadasResumen = this.construirResumenesPorGrupo(this.partidos, data);

        if (this.jornadas.length === 0) {

          Swal.fire(
            'Atención',
            'No existen jornadas para guardar',
            'warning'
          );

          return;
        }

      },

      error: (err) => {

        console.error(err);

        this.jornadaVisualizada = null;
        this.jornadas = [];
        this.partidos = [];
        this.jornadasResumen = [];

      }

    });

}

 guardarPartidos(): void {

  if (!this.jornadaVisualizada) {
    Swal.fire('Atención', 'Primero visualice la jornada', 'warning');
    return;
  }

  const partidosParaGuardar = this.jornadaVisualizada.partidos.map((partido: any) => ({
    grupo: partido.idGrupo ?? this.jornadaVisualizada.idGrupo,
    grupoNombre: partido.grupo ?? this.jornadaVisualizada.grupo,

    jornada: partido.idJornada ?? this.jornadaVisualizada.idJornada,
    numeroJornada: partido.numeroJornada ?? this.jornadaVisualizada.numeroJornada,

    equipoLocal: partido.idEquipoLocal,
    equipoLocalNombre: partido.equipoLocal,

    equipoVisitante: partido.idEquipoVisitante,
    equipoVisitanteNombre: partido.equipoVisitante,

    hora: partido.hora,
    fecha: partido.fecha ?? this.jornadaVisualizada.fechaProgramada,

    arbitro: partido.idArbitro ?? null,
    arbitroNombre: partido.arbitro ?? null,

    jugado: false
  }));

  console.log(
  JSON.stringify(partidosParaGuardar, null, 2)
);

  this.jornadaService
    .guardarPartidos('partidos/jornada', partidosParaGuardar)
    .subscribe({
      next: () => {
        Swal.fire('OK', 'Partidos guardados correctamente', 'success');
        this.limpiarFormulario();
      },
      error: (err) => {
        console.error(err);
        Swal.fire('Error', 'No fue posible guardar los partidos', 'error');
      }
    });
}

  private limpiarFormulario(): void {

    this.torneoId = null;
    this.grupoId = null;

    this.categoriaId = null;
    this.jornadas = [];
    this.partidos = [];
    this.jornadaVisualizada = null;
    this.jornadasResumen = [];
  }

  /**
   * Convierte:
   * 2026-06-21 -> 21/06/2026
   */
  formatDate(date: string): string {

    if (!date) {
      return '';
    }

    const [year, month, day] = date.split('-');

    return `${day}/${month}/${year}`;
  }

  /**
   * Obtiene el siguiente domingo.
   * Retorna YYYY-MM-DD.
   */
  getNextSunday(): string {

    const today = new Date();

    const dayOfWeek = today.getDay();

    const diff = (7 - dayOfWeek) % 7 || 7;

    const nextSunday = new Date(today);

    nextSunday.setDate(
      today.getDate() + diff
    );

    const year = nextSunday.getFullYear();

    const month = String(
      nextSunday.getMonth() + 1
    ).padStart(2, '0');

    const day = String(
      nextSunday.getDate()
    ).padStart(2, '0');

    return `${year}-${month}-${day}`;
  }

  onBack(): void {
    this.router.navigate(['/dashboard']);
  }

  eliminarJornada(index: number): void {

      Swal.fire({
        title: '¿Eliminar partido?',
        text: 'El partido será removido de la jornada actual.',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: 'Sí, eliminar',
        cancelButtonText: 'Cancelar'
      }).then((result) => {
    
        if (result.isConfirmed) {
    
          this.jornadas.splice(index, 1);
    
          Swal.fire(
            'Eliminado',
            'Partido eliminado correctamente.',
            'success'
          );
        }
    
      });
    
    }

    onTorneoChange(torneoId: number | null) {
      if (torneoId !== null) {
        this.loadCategoriasByTorneo(torneoId);
      }
    }

       private loadCategoriasByTorneo(torneoId: any): void {
        this.crudService.findAll(`categoria-torneo?torneoId=${torneoId}`).subscribe({
          next: data => {
            this.categoriasDisponibles = Array.isArray(data) ? data : [];
          },
          error: err => {
            console.error('Error cargando categorías del torneo', err);
          }
        });
      }

      visualizarJornada(): void {

        if (!this.torneoId) {
          Swal.fire('Atención', 'Seleccione un torneo', 'warning');
          return;
        }
      
        if (!this.categoriaId) {
          Swal.fire('Atención', 'Seleccione una categoría', 'warning');
          return;
        }
      
        this.jornadaService
          .visualizarJornada(
            'jornadas',
            this.torneoId,
            this.categoriaId
          )
          .subscribe({
            next: (data: any) => {
              this.jornadaVisualizada = data;
              this.partidos = data?.partidos ?? [];
              this.jornadasResumen = this.construirResumenesPorGrupo(this.partidos, data);
            },
            error: (err) => {
              console.error(err);
              this.jornadaVisualizada = null;
              this.partidos = [];
              this.jornadasResumen = [];
      
              Swal.fire(
                'Error',
                'No fue posible visualizar la jornada',
                'error'
              );
            }
          });
      }

  generarJornadas(): void {

  this.mensajeJornadas = '';
  this.jornadas = [];
  this.jornadaVisualizada = null;
  this.partidos = [];
  this.jornadasResumen = [];

  if (!this.torneoId || !this.categoriaId) {
    this.mensajeJornadas = 'Seleccione un torneo y una categoría.';
    return;
  }
  this.jornadaService
    .generarJornadas('jornadas',this.torneoId, this.categoriaId)
    .subscribe({

      next: (response: any[]) => {

        this.jornadas = response || [];

        if (this.jornadas.length === 0) {
          this.mensajeJornadas = 'No hay jornadas para programar.';
        }

      },

      error: (err) => {

        this.jornadas = [];
        this.jornadaVisualizada = null;

        this.mensajeJornadas =
          err?.error?.message || 'No hay jornadas para programar.';

      }

    });
}

  private construirResumenesPorGrupo(partidos: any[], jornadaBase: any): any[] {
    if (!partidos?.length) {
      if (!jornadaBase) {
        return [];
      }

      return [{
        torneo: jornadaBase.torneo,
        grupo: jornadaBase.grupo ?? 'Sin grupo',
        estado: jornadaBase.estado,
        numeroJornada: jornadaBase.numeroJornada,
        fechaProgramada: jornadaBase.fechaProgramada
      }];
    }

    const resumenes = new Map<string, any>();

    for (const partido of partidos) {
      const idGrupo = partido.idGrupo ?? jornadaBase?.idGrupo ?? 'sin-grupo';
      const idJornada = partido.idJornada ?? jornadaBase?.idJornada ?? 'sin-jornada';
      const clave = `${idGrupo}-${idJornada}`;

      if (!resumenes.has(clave)) {
        resumenes.set(clave, {
          torneo: partido.torneo ?? jornadaBase?.torneo,
          grupo: partido.grupo ?? jornadaBase?.grupo ?? 'Sin grupo',
          estado: partido.estado ?? jornadaBase?.estado,
          numeroJornada: partido.numeroJornada ?? jornadaBase?.numeroJornada,
          fechaProgramada: partido.fecha ?? jornadaBase?.fechaProgramada
        });
      }
    }

    return Array.from(resumenes.values());
  }

}