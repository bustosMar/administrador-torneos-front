import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { CrudService } from '../../services/crud.service';


// ============================================================
// RESPUESTA DE UN EQUIPO
// ============================================================

interface TablaPosicion {

  posicion: number;

  equipoId: number;
  equipo: string;

  grupoId: number | null;
  grupo: string | null;

  partidosJugados: number;
  partidosGanados: number;
  partidosEmpatados: number;
  partidosPerdidos: number;

  golesFavor: number;
  golesContra: number;
  diferenciaGoles: number;

  puntos: number;

}


// ============================================================
// RESPUESTA COMPLETA DEL BACKEND
// ============================================================

interface TablasTorneoResponse {

  general: TablaPosicion[];

  porGrupo: {
    [grupoId: string]: TablaPosicion[];
  };

}


// ============================================================
// MODELO PARA EL HTML
// ============================================================

interface EquipoTabla {

  posicion: number;

  equipoId: number;
  equipo: string;

  grupoId: number | null;
  grupo: string | null;

  pj: number;
  pg: number;
  pe: number;
  pp: number;

  gf: number;
  gc: number;
  dg: number;

  pts: number;

  escudo?: string | null;

}


// ============================================================
// MODELO DE GRUPO
// ============================================================

interface GrupoTabla {

  id: number;

  nombre: string;

  equipos: EquipoTabla[];

}


@Component({
  selector: 'app-tabla-posiciones',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterLink
  ],
  templateUrl: './tabla-posiciones.component.html'
})
export class TablaPosicionesComponent implements OnInit {

  torneoId: number | null = null;

  categoriaId: number | null = null;


  torneos: any[] = [];

  categoriasDisponibles: any[] = [];


  grupos: GrupoTabla[] = [];

  tablaGeneral: EquipoTabla[] = [];


  mensaje = '';

  tipoMensaje: 'info' | 'success' | 'error' = 'info';


  constructor(
    private crudService: CrudService,
    private router: Router
  ) {}


  ngOnInit(): void {

    this.cargarTorneos();

  }


  // ==========================================================
  // TORNEOS
  // ==========================================================

  cargarTorneos(): void {

    this.crudService.findAll('torneos').subscribe({

      next: (response: any) => {

        this.torneos = response;

      },

      error: (error: any) => {

        console.error(
          'Error al cargar torneos',
          error
        );

      }

    });

  }


  // ==========================================================
  // CAMBIO DE TORNEO
  // ==========================================================

  onTorneoChange(
    torneoId: number | null
  ): void {

    this.categoriaId = null;

    this.limpiarTablas();

    this.mensaje = '';


    if (torneoId !== null) {

      this.loadCategoriasByTorneo(
        torneoId
      );

    } else {

      this.categoriasDisponibles = [];

    }

  }


  // ==========================================================
  // CATEGORÍAS
  //
  // ESTE MÉTODO SE DEJA COMO LO TENÍAS
  // ==========================================================

  private loadCategoriasByTorneo(
    torneoId: number
  ): void {

    this.crudService
      .findAll(
        `categoria-torneo?torneoId=${torneoId}`
      )
      .subscribe({

        next: data => {

          this.categoriasDisponibles =
            Array.isArray(data)
              ? data
              : [];

        },

        error: err => {

          console.error(
            'Error cargando categorías del torneo',
            err
          );

          this.categoriasDisponibles = [];

        }

      });

  }


  // ==========================================================
  // GENERAR TABLAS
  // ==========================================================

  generarTablasPosiciones(): void {

    if (
      this.torneoId === null ||
      this.categoriaId === null
    ) {

      this.mensaje =
        'Seleccione un torneo y una categoría.';

      this.tipoMensaje = 'error';

      return;

    }


    this.mensaje = '';

    this.limpiarTablas();


    // ========================================================
    // ENDPOINT
    // ========================================================

    const url =
      `tabla-posiciones?torneoId=${this.torneoId}` +
      `&categoriaId=${this.categoriaId}`;


    console.log(
      'Consultando tabla de posiciones:',
      url
    );


    // ========================================================
    // CONSULTAR BACKEND
    //
    // NO CAMBIAMOS CrudService
    // ========================================================

    this.crudService
      .findAll(url)
      .subscribe({

        next: (response: any) => {

          console.log(
            'Respuesta tabla de posiciones:',
            response
          );


          // ==================================================
          // TABLA GENERAL
          // ==================================================

          const general =
            response?.general;


          this.tablaGeneral =
            Array.isArray(general)

              ? general.map(
                  (equipo: TablaPosicion) =>
                    this.mapearEquipo(equipo)
                )

              : [];


          // ==================================================
          // TABLAS POR GRUPO
          // ==================================================

          this.grupos =
            this.construirGrupos(
              response?.porGrupo
            );


          // ==================================================
          // VALIDAR RESULTADOS
          // ==================================================

          if (
            this.tablaGeneral.length === 0 &&
            this.grupos.length === 0
          ) {

            this.mensaje =
              'No existen partidos jugados para el torneo y categoría seleccionados.';

            this.tipoMensaje = 'info';

            return;

          }


          this.mensaje =
            'Tabla de posiciones generada correctamente.';

          this.tipoMensaje = 'success';

        },


        error: (error: any) => {

          console.error(
            'Error al consultar tabla de posiciones',
            error
          );


          this.limpiarTablas();


          this.mensaje =
            error?.error?.message ??
            error?.error?.mensaje ??
            'Ocurrió un error al consultar la tabla de posiciones.';


          this.tipoMensaje = 'error';

        }

      });

  }


  // ==========================================================
  // CONSTRUIR GRUPOS
  // ==========================================================

  private construirGrupos(
    porGrupo:
      {
        [grupoId: string]: TablaPosicion[];
      }
      | null
      | undefined
  ): GrupoTabla[] {

    if (!porGrupo) {

      return [];

    }


    return Object.entries(porGrupo)

      .map(
        ([grupoId, equipos]) => {


          const equiposMapeados =
            Array.isArray(equipos)

              ? equipos.map(
                  equipo =>
                    this.mapearEquipo(equipo)
                )

              : [];


          const nombreGrupo =
            equiposMapeados.length > 0

              ? (
                  equiposMapeados[0].grupo ??
                  `Grupo ${grupoId}`
                )

              : `Grupo ${grupoId}`;


          return {

            id: Number(grupoId),

            nombre: nombreGrupo,

            equipos: equiposMapeados

          };

        }
      )

      .sort(
        (a, b) =>
          a.id - b.id
      );

  }


  // ==========================================================
  // MAPEAR EQUIPO
  // ==========================================================

  private mapearEquipo(
    equipo: TablaPosicion
  ): EquipoTabla {

    return {

      posicion:
        equipo.posicion,

      equipoId:
        equipo.equipoId,

      equipo:
        equipo.equipo,

      grupoId:
        equipo.grupoId,

      grupo:
        equipo.grupo,

      pj:
        equipo.partidosJugados,

      pg:
        equipo.partidosGanados,

      pe:
        equipo.partidosEmpatados,

      pp:
        equipo.partidosPerdidos,

      gf:
        equipo.golesFavor,

      gc:
        equipo.golesContra,

      dg:
        equipo.diferenciaGoles,

      pts:
        equipo.puntos,

      escudo:
        null

    };

  }


  // ==========================================================
  // LIMPIAR
  // ==========================================================

  private limpiarTablas(): void {

    this.grupos = [];

    this.tablaGeneral = [];

  }


  // ==========================================================
  // REGRESAR
  // ==========================================================

  onBack(): void {

    this.router.navigate([
      '/dashboard'
    ]);

  }

}