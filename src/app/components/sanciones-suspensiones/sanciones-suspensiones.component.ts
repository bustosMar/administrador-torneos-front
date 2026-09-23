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

  editingSuspensionId: number | null = null;
  suspensionDraft: SuspensionModel | null = null;
  nuevaSuspension = {
    fechaInicio: '',
    fechaFin: '',
    motivo: ''
  };


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
    jugadorId: number,
    mensajeExito?: string
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
              mensajeExito ??
              'El jugador no tiene sanciones ni suspensiones registradas.';

            this.tipoMensaje = 'info';

          } else {

            this.mensaje =
              mensajeExito ??
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

  editarSuspension(suspension: SuspensionModel): void {
    this.editingSuspensionId = suspension.id;
    this.suspensionDraft = {
      ...suspension,
      fechaInicio: this.toInputDate(suspension.fechaInicio),
      fechaFin: this.toInputDate(suspension.fechaFin)
    };
  }

  cancelarEdicionSuspension(): void {
    this.editingSuspensionId = null;
    this.suspensionDraft = null;
  }

  crearSuspension(): void {
    const jugadorId = this.jugadorResultado?.jugadorId;

    if (!jugadorId || !this.nuevaSuspension.fechaInicio || !this.nuevaSuspension.fechaFin) {
      this.mensaje = 'El jugador y las fechas de la suspensión son obligatorios.';
      this.tipoMensaje = 'error';
      return;
    }

    if (this.nuevaSuspension.fechaFin < this.nuevaSuspension.fechaInicio) {
      this.mensaje = 'La fecha fin no puede ser anterior a la fecha inicio.';
      this.tipoMensaje = 'error';
      return;
    }

    this.crudService.create('suspensiones', {
      jugadorId,
      fechaInicio: this.toBackendDate(this.nuevaSuspension.fechaInicio),
      fechaFin: this.toBackendDate(this.nuevaSuspension.fechaFin),
      motivo: this.nuevaSuspension.motivo || null
    }).subscribe({
      next: () => {
        this.nuevaSuspension = { fechaInicio: '', fechaFin: '', motivo: '' };
        this.buscarSancionesSuspensiones(jugadorId, 'Suspensión creada correctamente.');
      },
      error: (error: any) => {
        this.mensaje = error?.error?.message ?? error?.error?.mensaje ?? 'No fue posible crear la suspensión.';
        this.tipoMensaje = 'error';
      }
    });
  }

  guardarSuspension(suspension: SuspensionModel): void {
    if (!this.suspensionDraft || this.editingSuspensionId !== suspension.id) {
      return;
    }

    if (!this.suspensionDraft.fechaInicio || !this.suspensionDraft.fechaFin) {
      this.mensaje = 'Las fechas de la suspensión son obligatorias.';
      this.tipoMensaje = 'error';
      return;
    }

    if (this.suspensionDraft.fechaFin < this.suspensionDraft.fechaInicio) {
      this.mensaje = 'La fecha fin no puede ser anterior a la fecha inicio.';
      this.tipoMensaje = 'error';
      return;
    }

    const payload = {
      id: suspension.id,
      fechaInicio: this.toBackendDate(this.suspensionDraft.fechaInicio),
      fechaFin: this.toBackendDate(this.suspensionDraft.fechaFin),
      motivo: this.suspensionDraft.motivo ?? null
    };

    this.crudService.update('suspensiones', suspension.id, payload).subscribe({
      next: () => {
        this.cancelarEdicionSuspension();

        if (this.jugadorResultado) {
          this.buscarSancionesSuspensiones(this.jugadorResultado.jugadorId, 'Suspensión actualizada correctamente.');
        }
      },
      error: (error: any) => {
        this.mensaje = error?.error?.message ?? error?.error?.mensaje ?? 'No fue posible actualizar la suspensión.';
        this.tipoMensaje = 'error';
      }
    });
  }

  private toInputDate(value: string): string {
    if (!value) {
      return value;
    }

    const [day, month, year] = value.includes('/')
      ? value.split('/')
      : value.split('-');

    return value.includes('/') ? `${year}-${month}-${day}` : value;
  }

  private toBackendDate(value: string): string {
    if (!value) {
      return value;
    }

    if (value.includes('/')) {
      return value;
    }

    const [year, month, day] = value.split('-');
    return `${day}/${month}/${year}`;
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