import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { CrudService } from '../../services/crud.service';


// ============================================================
// GOLEADOR QUE VIENE DEL BACKEND
// ============================================================

interface TablaGoleadorResponse {

  jugadorId: number;

  jugador: string;

  equipoId: number;

  equipo: string;

  goles: number;

}


// ============================================================
// RESPUESTA COMPLETA DEL BACKEND
// ============================================================

interface TablaGoleoResponse {

  goleadores: TablaGoleadorResponse[];

}


// ============================================================
// MODELO PARA EL HTML
// ============================================================

interface JugadorTablaGoleo {

  posicion: number;

  jugadorId: number;

  jugador: string;

  equipoId: number;

  equipo: string;

  goles: number;

}


@Component({

  selector: 'app-tabla-goleo',

  standalone: true,

  imports: [
    CommonModule,
    FormsModule
  ],

  templateUrl: './tabla-goleo.component.html'

})
export class TablaGoleoComponent implements OnInit {


  // ==========================================================
  // FILTROS
  // ==========================================================

  torneoId: number | null = null;

  categoriaId: number | null = null;


  // ==========================================================
  // CATÁLOGOS
  // ==========================================================

  torneos: any[] = [];

  categoriasDisponibles: any[] = [];


  // ==========================================================
  // TABLA DE GOLEO
  // ==========================================================

  tablaGoleo: JugadorTablaGoleo[] = [];


  // ==========================================================
  // MENSAJES
  // ==========================================================

  mensaje = '';

  tipoMensaje:
    'info' |
    'success' |
    'error' = 'info';


  // ==========================================================
  // CONSTRUCTOR
  // ==========================================================

  constructor(

    private crudService: CrudService,

    private router: Router

  ) {}


  // ==========================================================
  // INIT
  // ==========================================================

  ngOnInit(): void {

    this.cargarTorneos();

  }


  // ==========================================================
  // CARGAR TORNEOS
  // ==========================================================

  cargarTorneos(): void {

    this.crudService
      .findAll('torneos')
      .subscribe({

        next: (response: any) => {

          this.torneos =
            Array.isArray(response)
              ? response
              : [];

        },

        error: (error: any) => {

          console.error(
            'Error al cargar torneos:',
            error
          );

          this.torneos = [];

          this.mensaje =
            'No fue posible cargar los torneos.';

          this.tipoMensaje = 'error';

        }

      });

  }


  // ==========================================================
  // CAMBIO DE TORNEO
  // ==========================================================

  onTorneoChange(
    torneoId: number | null
  ): void {

    // --------------------------------------------------------
    // Limpiar categoría
    // --------------------------------------------------------

    this.categoriaId = null;


    // --------------------------------------------------------
    // Limpiar tabla
    // --------------------------------------------------------

    this.limpiarTabla();


    // --------------------------------------------------------
    // Limpiar mensaje
    // --------------------------------------------------------

    this.mensaje = '';


    // --------------------------------------------------------
    // Si no seleccionó torneo
    // --------------------------------------------------------

    if (torneoId === null) {

      this.categoriasDisponibles = [];

      return;

    }


    // --------------------------------------------------------
    // Cargar categorías
    // --------------------------------------------------------

    this.loadCategoriasByTorneo(
      torneoId
    );

  }


  // ==========================================================
  // CARGAR CATEGORÍAS
  // ==========================================================

  private loadCategoriasByTorneo(
    torneoId: number
  ): void {

    this.crudService
      .findAll(
        `categoria-torneo?torneoId=${torneoId}`
      )
      .subscribe({

        next: (response: any) => {

          this.categoriasDisponibles =
            Array.isArray(response)
              ? response
              : [];

        },

        error: (error: any) => {

          console.error(
            'Error cargando categorías:',
            error
          );

          this.categoriasDisponibles = [];

          this.mensaje =
            'No fue posible cargar las categorías.';

          this.tipoMensaje = 'error';

        }

      });

  }


  // ==========================================================
  // GENERAR TABLA DE GOLEO
  // ==========================================================

  generarTablaGoleo(): void {

    // ========================================================
    // VALIDAR FILTROS
    // ========================================================

    if (

      this.torneoId === null ||

      this.categoriaId === null

    ) {

      this.mensaje =
        'Seleccione un torneo y una categoría.';

      this.tipoMensaje = 'error';

      return;

    }


    // ========================================================
    // LIMPIAR INFORMACIÓN ANTERIOR
    // ========================================================

    this.tablaGoleo = [];

    this.mensaje = '';


    // ========================================================
    // URL
    // ========================================================

    const url =

      `tabla-goleo?torneoId=${this.torneoId}` +

      `&categoriaId=${this.categoriaId}`;


    console.log(
      'Consultando tabla de goleo:',
      url
    );


    // ========================================================
    // CONSULTAR BACKEND
    //
    // IMPORTANTE:
    //
    // CrudService.findAll() devuelve any[],
    // por eso aquí recibimos any y después validamos
    // la estructura real.
    // ========================================================

    this.crudService

      .findAll(url)

      .subscribe({

        next: (response: any) => {

          console.log(
            'Respuesta tabla de goleo:',
            response
          );


          // ==================================================
          // VALIDAR RESPUESTA
          // ==================================================

          if (

            !response ||

            !Array.isArray(
              response.goleadores
            )

          ) {

            console.error(
              'Respuesta inesperada:',
              response
            );

            this.tablaGoleo = [];

            this.mensaje =
              'El servidor no devolvió una tabla de goleo válida.';

            this.tipoMensaje = 'error';

            return;

          }


          // ==================================================
          // OBTENER GOLEADORES
          // ==================================================

          const goleadores:
            TablaGoleadorResponse[] =
              response.goleadores;


          // ==================================================
          // CONVERTIR A MODELO DEL HTML
          // ==================================================

          this.tablaGoleo =
            goleadores.map(
              (
                goleador:
                  TablaGoleadorResponse
              ) => {

                return this.mapearJugador(
                  goleador
                );

              }
            );


          // ==================================================
          // ORDENAR
          //
          // 1. Más goles
          // 2. Nombre
          // ==================================================

          this.tablaGoleo.sort(

            (
              a,
              b
            ) => {

              // --------------------------------------------
              // MÁS GOLES
              // --------------------------------------------

              if (
                b.goles !== a.goles
              ) {

                return (
                  b.goles -
                  a.goles
                );

              }


              // --------------------------------------------
              // NOMBRE
              // --------------------------------------------

              return (

                a.jugador ?? ''

              ).localeCompare(

                b.jugador ?? '',

                undefined,

                {
                  sensitivity: 'base'
                }

              );

            }

          );


          // ==================================================
          // ASIGNAR POSICIONES
          // ==================================================

          this.asignarPosiciones();


          // ==================================================
          // SIN RESULTADOS
          // ==================================================

          if (
            this.tablaGoleo.length === 0
          ) {

            this.mensaje =
              'No existen goles registrados para el torneo y categoría seleccionados.';

            this.tipoMensaje =
              'info';

            return;

          }


          // ==================================================
          // ÉXITO
          // ==================================================

          this.mensaje =
            'Tabla de goleo generada correctamente.';

          this.tipoMensaje =
            'success';

        },


        // ====================================================
        // ERROR
        // ====================================================

        error: (error: any) => {

          console.error(
            'Error al consultar tabla de goleo:',
            error
          );


          this.tablaGoleo = [];


          this.mensaje =

            error?.error?.message ??

            error?.error?.mensaje ??

            'Ocurrió un error al consultar la tabla de goleo.';


          this.tipoMensaje =
            'error';

        }

      });

  }


  // ==========================================================
  // MAPEAR GOLEADOR
  // ==========================================================

  private mapearJugador(

    goleador:
      TablaGoleadorResponse

  ): JugadorTablaGoleo {

    return {

      posicion: 0,

      jugadorId:
        goleador.jugadorId,

      jugador:
        goleador.jugador,

      equipoId:
        goleador.equipoId,

      equipo:
        goleador.equipo,

      goles:
        goleador.goles ?? 0

    };

  }


  // ==========================================================
  // ASIGNAR POSICIONES
  // ==========================================================

  private asignarPosiciones(): void {

    for (

      let i = 0;

      i < this.tablaGoleo.length;

      i++

    ) {

      this.tablaGoleo[i].posicion =
        i + 1;

    }

  }


  // ==========================================================
  // LIMPIAR TABLA
  // ==========================================================

  private limpiarTabla(): void {

    this.tablaGoleo = [];

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