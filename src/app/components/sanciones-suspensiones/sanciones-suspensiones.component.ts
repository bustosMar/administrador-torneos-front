import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { CrudService } from '../../services/crud.service';


// ============================================================
// MODELOS
// ============================================================

interface SancionModel {

  id: number;

  partido: number | null;

  jugador: number | null;

  equipoTorneo: number | null;

  minuto: number;

  tipo: string;

  observacion: string | null;

  suspensionGenerada?: boolean;

  suspensionPendienteRevision?: boolean;

  mensajeSuspension?: string | null;

  amarillasPrevias?: number;

}


interface SuspensionModel {

  id: number;

  jugador: number | null;

  fechaInicio: string;

  fechaFin: string;

  motivo: string | null;

}


interface JugadorSancionesSuspensionesResponse {

  jugadorId: number;

  jugador: string;

  equipoId: number | null;

  equipo: string | null;

  sanciones: SancionModel[];

  suspensiones: SuspensionModel[];

}


interface JugadoresSancionesSuspensionesResponse {

  jugadores: JugadorSancionesSuspensionesResponse[];

}


// ============================================================
// COMPONENTE
// ============================================================

@Component({

  selector: 'app-sanciones-suspensiones',

  standalone: true,

  imports: [
    CommonModule,
    FormsModule
  ],

  templateUrl: './sanciones-suspensiones.component.html'

})
export class SancionesSuspensionesComponent implements OnInit {


  // ==========================================================
  // BUSCADOR
  // ==========================================================

  nombreBusqueda = '';


  // ==========================================================
  // RESULTADO
  // ==========================================================

  jugadorResultado:
    JugadorSancionesSuspensionesResponse | null = null;


  // ==========================================================
  // SUGERENCIAS
  // ==========================================================

  jugadoresEncontrados:
    JugadorSancionesSuspensionesResponse[] = [];


  // ==========================================================
  // ESTADOS
  // ==========================================================

  cargando = false;

  cargandoResultado = false;


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

  }


  // ==========================================================
  // CAMBIO DEL BUSCADOR
  // ==========================================================

  onBuscarJugador(): void {

    const texto =
      this.nombreBusqueda?.trim() ?? '';


    // --------------------------------------------------------
    // SI ESTÁ VACÍO
    // --------------------------------------------------------

    if (texto.length === 0) {

      this.jugadoresEncontrados = [];

      return;

    }


    // --------------------------------------------------------
    // MÍNIMO DE CARACTERES
    // --------------------------------------------------------

    if (texto.length < 2) {

      this.jugadoresEncontrados = [];

      return;

    }


    this.cargando = true;


    // --------------------------------------------------------
    // CONSULTAR JUGADORES
    //
    // Endpoint:
    //
    // /api/sanciones/buscar-jugadores?nombre=...
    // --------------------------------------------------------

    const url =
      `sanciones/buscar-jugadores?nombre=${encodeURIComponent(texto)}`;


    this.crudService
      .findAll(url)
      .subscribe({

        next: (response: any) => {

          console.log(
            'Jugadores encontrados:',
            response
          );


          if (Array.isArray(response)) {

            this.jugadoresEncontrados =
              response.map(
                (jugador: any) => ({

                  jugadorId:
                    jugador.jugadorId ??
                    jugador.id,

                  jugador:
                    jugador.jugador ??
                    this.construirNombreJugador(
                      jugador
                    ),

                  equipoId:
                    jugador.equipoId ??
                    null,

                  equipo:
                    jugador.equipo ??
                    null,

                  sanciones: [],

                  suspensiones: []

                })
              );

          } else {

            this.jugadoresEncontrados = [];

          }


          this.cargando = false;

        },

        error: (error: any) => {

          console.error(
            'Error al buscar jugadores:',
            error
          );


          this.jugadoresEncontrados = [];

          this.cargando = false;

          this.mensaje =
            'No fue posible buscar jugadores.';

          this.tipoMensaje = 'error';

        }

      });

  }


  // ==========================================================
  // SELECCIONAR JUGADOR
  // ==========================================================

  seleccionarJugador(
    jugador: JugadorSancionesSuspensionesResponse
  ): void {


    // --------------------------------------------------------
    // VALIDAR
    // --------------------------------------------------------

    if (
      !jugador ||
      jugador.jugadorId == null
    ) {

      return;

    }


    // --------------------------------------------------------
    // MOSTRAR NOMBRE EN BUSCADOR
    // --------------------------------------------------------

    this.nombreBusqueda =
      jugador.jugador;


    // --------------------------------------------------------
    // LIMPIAR SUGERENCIAS
    // --------------------------------------------------------

    this.jugadoresEncontrados = [];


    // --------------------------------------------------------
    // CONSULTAR INFORMACIÓN
    // --------------------------------------------------------

    this.buscarSancionesSuspensiones(
      jugador.jugadorId
    );

  }


  // ==========================================================
  // BUSCAR SANCIONES Y SUSPENSIONES
  // ==========================================================

  buscarSancionesSuspensiones(
    jugadorId: number
  ): void {


    if (
      jugadorId == null
    ) {

      return;

    }


    this.cargandoResultado = true;

    this.mensaje = '';

    this.jugadorResultado = null;


    // --------------------------------------------------------
    // ENDPOINT
    // --------------------------------------------------------

    const url =
      `sanciones/buscar-por-jugador-id?jugadorId=${jugadorId}`;


    console.log(
      'Consultando sanciones/suspensiones:',
      url
    );


    this.crudService
      .findAll(url)
      .subscribe({

        next: (response: any) => {

          console.log(
            'Respuesta sanciones/suspensiones:',
            response
          );


          // ==================================================
          // VALIDAR RESPUESTA
          // ==================================================

          if (
            !response ||
            !Array.isArray(response.jugadores)
          ) {

            this.jugadorResultado = null;

            this.cargandoResultado = false;

            this.mensaje =
              'El servidor no devolvió una respuesta válida.';

            this.tipoMensaje = 'error';

            return;

          }


          // ==================================================
          // OBTENER PRIMER JUGADOR
          // ==================================================

          const jugadores =
            response.jugadores;


          if (
            jugadores.length === 0 ||
            !jugadores[0]
          ) {

            this.jugadorResultado = null;

            this.cargandoResultado = false;

            this.mensaje =
              'No se encontró información del jugador.';

            this.tipoMensaje = 'info';

            return;

          }


          // ==================================================
          // CREAR VARIABLE LOCAL NO NULA
          //
          // AQUÍ ESTÁ EL AJUSTE IMPORTANTE
          // ==================================================

          const jugadorResultado:
            JugadorSancionesSuspensionesResponse =
              jugadores[0];


          // ==================================================
          // NORMALIZAR SANCIONES
          // ==================================================

          const sanciones:
            SancionModel[] =
            Array.isArray(
              jugadorResultado.sanciones
            )
              ? jugadorResultado.sanciones
              : [];


          // ==================================================
          // NORMALIZAR SUSPENSIONES
          // ==================================================

          const suspensiones:
            SuspensionModel[] =
            Array.isArray(
              jugadorResultado.suspensiones
            )
              ? jugadorResultado.suspensiones
              : [];


          // ==================================================
          // ASIGNAR OBJETO COMPLETO
          // ==================================================

          this.jugadorResultado = {

            jugadorId:
              jugadorResultado.jugadorId,

            jugador:
              jugadorResultado.jugador,

            equipoId:
              jugadorResultado.equipoId ??
              null,

            equipo:
              jugadorResultado.equipo ??
              null,

            sanciones:
              sanciones,

            suspensiones:
              suspensiones

          };


          // ==================================================
          // FINALIZAR CARGA
          // ==================================================

          this.cargandoResultado = false;


          // ==================================================
          // VALIDAR SI TIENE INFORMACIÓN
          //
          // Usamos las variables locales.
          //
          // Así TypeScript no puede marcar
          // jugadorResultado como null.
          // ==================================================

          if (
            sanciones.length === 0 &&
            suspensiones.length === 0
          ) {

            this.mensaje =
              'El jugador no tiene sanciones ni suspensiones registradas.';

            this.tipoMensaje = 'info';

          } else {

            this.mensaje =
              'Información del jugador cargada correctamente.';

            this.tipoMensaje = 'success';

          }

        },


        // ====================================================
        // ERROR
        // ====================================================

        error: (error: any) => {

          console.error(
            'Error al consultar sanciones/suspensiones:',
            error
          );


          this.jugadorResultado = null;

          this.cargandoResultado = false;


          this.mensaje =
            error?.error?.message ??
            error?.error?.mensaje ??
            'Ocurrió un error al consultar las sanciones y suspensiones.';


          this.tipoMensaje = 'error';

        }

      });

  }


  // ==========================================================
  // CONSTRUIR NOMBRE
  // ==========================================================

  private construirNombreJugador(
    jugador: any
  ): string {

    if (!jugador) {

      return 'Jugador sin nombre';

    }


    const nombre =
      jugador.nombre ??
      '';


    const apellido =
      jugador.apellido ??
      '';


    const nombreCompleto =
      `${nombre} ${apellido}`.trim();


    if (
      nombreCompleto.length === 0
    ) {

      return 'Jugador sin nombre';

    }


    return nombreCompleto;

  }


  // ==========================================================
  // LIMPIAR
  // ==========================================================

  limpiarBusqueda(): void {

    this.nombreBusqueda = '';

    this.jugadoresEncontrados = [];

    this.jugadorResultado = null;

    this.mensaje = '';

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