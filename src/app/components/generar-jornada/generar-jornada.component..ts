import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { CrudService } from '../../services/crud.service';
import { JornadaService } from '../../services/jornada.service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-generar-jornada',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './generar-jornada.component.html'

})
export class GenerarJornadaComponent implements OnInit {

  torneoId: number | null = null;
  categoriaId: number | null = null;

  torneos: any[] = [];
  categoriasDisponibles: any[] = [];
  jornadas: any[] = [];

  jornadaVisualizada: any = null;

  arbitros: any[] = [];

  /*
   * Temporalmente esta lista se carga desde frontend.
   * Después se sustituirá por una consulta al backend.
   */
  equiposDisponibles: any[] = [];

  mensajeJornadas = '';
  tipoMensaje: 'info' | 'success' | 'error' = 'info';

  constructor(
    private crudService: CrudService,
    private jornadaService: JornadaService,
    private router: Router
  ) {
  }

  ngOnInit(): void {
    this.cargarTorneos();
    this.cargarArbitros();
  }

  cargarTorneos(): void {

    this.crudService.findAll('torneos').subscribe({
      next: (response: any) => {
        this.torneos = response;
      },
      error: (error: any) => {
        console.error('Error al cargar torneos', error);
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

  cargarArbitros(): void {

    this.crudService.findAll('arbitros').subscribe({
      next: (response: any) => {
        this.arbitros = Array.isArray(response)
          ? response
          : response?.content ?? [];
      },
      error: (error: any) => {
        console.error('Error al cargar árbitros', error);
        this.arbitros = [];
      }
    });

  }

  verJornadaActual(): void {

    if (this.torneoId === null || this.categoriaId === null) {

      this.mensajeJornadas =
        'Seleccione un torneo y una categoría.';

      this.tipoMensaje = 'error';
      return;
    }

    this.mensajeJornadas = '';
    this.jornadaService
      .jornadaActual(
        'jornadas',
        this.torneoId,
        this.categoriaId
      )
      .subscribe({
        next: (response: any) => {
        
          const jornadasRespuesta = Array.isArray(response)
            ? response
            : [response];

          this.jornadas = jornadasRespuesta.filter(
            (jornada: any) => jornada !== null
          );

          this.jornadaVisualizada =
            this.jornadas.length > 0
              ? this.jornadas[0]
              : null;

          if (!this.jornadaVisualizada) {

            this.mensajeJornadas =
              'No existe una jornada actual para la categoría seleccionada.';

            this.tipoMensaje = 'info';
            return;
          }

          this.prepararPartidos();

          /*
           * Temporalmente se obtienen los equipos que ya están presentes
           * en la jornada. Después esta parte se sustituirá por la
           * consulta al catálogo de equipos por categoría.
           */
          this.prepararEquiposTemporales();

        },
        error: (error: any) => {

          console.error(
            'Error al consultar la jornada actual',
            error
          );

          this.jornadas = [];
          this.jornadaVisualizada = null;

          this.mensajeJornadas =
            error?.error?.message ??
            error?.error?.mensaje ??
            'Ocurrió un error al consultar la jornada actual.';

          this.tipoMensaje = 'error';

        }
      });

  }

  prepararPartidos(): void {

    if (!this.jornadaVisualizada?.partidos) {
      this.jornadaVisualizada.partidos = [];
      return;
    }

    this.jornadaVisualizada.partidos =
      this.jornadaVisualizada.partidos.map((partido: any) => {

        const arbitroNombre =
          partido.arbitroNombre ??
          partido.arbitro ??
          '';

        const idArbitro =
          partido.idArbitro ??
          partido.arbitro?.id ??
          null;

        return {
          ...partido,

          idArbitro,
          arbitroNombre:
            typeof arbitroNombre === 'string'
              ? arbitroNombre
              : this.obtenerNombreArbitro(arbitroNombre),

          jugado: partido.jugado === true,

          nuevo: false,

          arbitrosFiltrados: [],
          mostrarArbitros: false,

          equiposLocalesFiltrados: [],
          equiposVisitantesFiltrados: [],

          mostrarLocales: false,
          mostrarVisitantes: false
        };

      });

  }

  prepararEquiposTemporales(): void {

    if (!this.jornadaVisualizada?.partidos) {
      this.equiposDisponibles = [];
      return;
    }

    const equipos = new Map<string, any>();

    for (const partido of this.jornadaVisualizada.partidos) {

      if (partido.idEquipoLocal && partido.equipoLocal) {

        equipos.set(
          String(partido.idEquipoLocal),
          {
            id: partido.idEquipoLocal,
            nombre: partido.equipoLocal
          }
        );

      }

      if (partido.idEquipoVisitante && partido.equipoVisitante) {

        equipos.set(
          String(partido.idEquipoVisitante),
          {
            id: partido.idEquipoVisitante,
            nombre: partido.equipoVisitante
          }
        );

      }

    }

    this.equiposDisponibles = Array.from(equipos.values());

  }

  agregarPartido(): void {

    if (!this.jornadaVisualizada) {
      return;
    }

    if (!this.jornadaVisualizada.partidos) {
      this.jornadaVisualizada.partidos = [];
    }

    const nuevoPartido = {
      idPartido: null,
      idJornada: this.jornadaVisualizada.idJornada,

      idEquipoLocal: null,
      equipoLocal: '',

      idEquipoVisitante: null,
      equipoVisitante: '',

      fecha:
        this.jornadaVisualizada.fechaProgramada ?? '',

      hora: '08:00',

      idArbitro: null,
      arbitroNombre: '',

      jugado: false,

      nuevo: true,

      arbitrosFiltrados: [],
      mostrarArbitros: false,

      equiposLocalesFiltrados: [],
      equiposVisitantesFiltrados: [],

      mostrarLocales: false,
      mostrarVisitantes: false
    };

    this.jornadaVisualizada.partidos.push(nuevoPartido);

  }

  eliminarPartidoNuevo(index: number): void {

    const partido =
      this.jornadaVisualizada?.partidos?.[index];

    if (!partido?.nuevo) {
      return;
    }

    this.jornadaVisualizada.partidos.splice(index, 1);

  }

  buscarArbitros(partido: any): void {

    const texto =
      partido.arbitroNombre
        ?.trim()
        .toLowerCase() ?? '';

    /*
     * Cuando el usuario cambia manualmente el texto, se elimina
     * el identificador previamente seleccionado.
     */
    partido.idArbitro = null;

    if (!texto) {

      partido.arbitrosFiltrados =
        this.arbitros.slice(0, 10);

      partido.mostrarArbitros =
        partido.arbitrosFiltrados.length > 0;

      return;
    }

    partido.arbitrosFiltrados =
      this.arbitros
        .filter((arbitro: any) =>
          this.obtenerNombreArbitro(arbitro)
            .toLowerCase()
            .includes(texto)
        )
        .slice(0, 10);

    partido.mostrarArbitros =
      partido.arbitrosFiltrados.length > 0;

  }

  seleccionarArbitro(
    partido: any,
    arbitro: any
  ): void {

    partido.idArbitro = arbitro.id;

    partido.arbitroNombre =
      this.obtenerNombreArbitro(arbitro);

    partido.arbitrosFiltrados = [];
    partido.mostrarArbitros = false;

  }

  obtenerNombreArbitro(arbitro: any): string {

    if (!arbitro) {
      return '';
    }

    if (typeof arbitro === 'string') {
      return arbitro;
    }

    if (arbitro.nombreCompleto) {
      return arbitro.nombreCompleto;
    }

    if (arbitro.nombre) {

      return [
        arbitro.nombre,
        arbitro.apellidoPaterno,
        arbitro.apellidoMaterno
      ]
        .filter(Boolean)
        .join(' ');

    }

    return [
      arbitro.nombres,
      arbitro.apellidoPaterno,
      arbitro.apellidoMaterno
    ]
      .filter(Boolean)
      .join(' ');

  }

  buscarEquipos(
    partido: any,
    tipo: 'local' | 'visitante'
  ): void {

    const texto =
      tipo === 'local'
        ? partido.equipoLocal
            ?.trim()
            .toLowerCase() ?? ''
        : partido.equipoVisitante
            ?.trim()
            .toLowerCase() ?? '';

    if (tipo === 'local') {
      partido.idEquipoLocal = null;
    } else {
      partido.idEquipoVisitante = null;
    }

    let resultados = this.equiposDisponibles.filter(
      (equipo: any) =>
        this.obtenerNombreEquipo(equipo)
          .toLowerCase()
          .includes(texto)
    );

    /*
     * Evita mostrar como opción el equipo seleccionado
     * en el lado contrario.
     */
    resultados = resultados.filter((equipo: any) => {

      if (tipo === 'local') {
        return equipo.id !== partido.idEquipoVisitante;
      }

      return equipo.id !== partido.idEquipoLocal;

    });

    resultados = resultados.slice(0, 10);

    if (tipo === 'local') {

      partido.equiposLocalesFiltrados = resultados;
      partido.mostrarLocales = resultados.length > 0;

    } else {

      partido.equiposVisitantesFiltrados = resultados;
      partido.mostrarVisitantes = resultados.length > 0;

    }

  }

  seleccionarEquipoLocal(
    partido: any,
    equipo: any
  ): void {

    partido.idEquipoLocal = equipo.id;

    partido.equipoLocal =
      this.obtenerNombreEquipo(equipo);

    partido.equiposLocalesFiltrados = [];
    partido.mostrarLocales = false;

  }

  seleccionarEquipoVisitante(
    partido: any,
    equipo: any
  ): void {

    partido.idEquipoVisitante = equipo.id;

    partido.equipoVisitante =
      this.obtenerNombreEquipo(equipo);

    partido.equiposVisitantesFiltrados = [];
    partido.mostrarVisitantes = false;

  }

  obtenerNombreEquipo(equipo: any): string {

    return (
      equipo?.nombre ??
      equipo?.equipoNombre ??
      equipo?.nombreEquipo ??
      equipo?.equipo?.nombre ??
      ''
    );

  }

  guardarPartidos(): void {

    if (!this.jornadaVisualizada?.partidos?.length) {
      return;
    }

    const errorValidacion =
      this.validarPartidos();

   
    if (errorValidacion) {

      this.mensajeJornadas = errorValidacion;
      this.tipoMensaje = 'error';

      return;
    }

     
    const partidosRequest = this.jornadaVisualizada.partidos.map((partido: any) => ({
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
    id: partido.idPartido ?? null,
    jugado: partido.jugado ?? false
  
  }));

      console.log(JSON.stringify(partidosRequest, null, 2));

       this.jornadaService
          .guardarPartidos('partidos/jornada', partidosRequest)
          .subscribe({
            next: () => {
              Swal.fire('OK', 'Partidos guardados correctamente', 'success');
              this.limpiarFormulario();
            },
            error: (err) => {
              console.error(err);
               this.mensajeJornadas =
                err?.error?.message ??
                err?.error?.mensaje ??
                err?.message ??
                'No fue posible guardar los partidos';
              Swal.fire('Error', 'No fue posible guardar los partidos', 'error');
            }
          });
      

}

  validarPartidos(): string | null {

    for (
      let i = 0;
      i < this.jornadaVisualizada.partidos.length;
      i++
    ) {

      const partido =
        this.jornadaVisualizada.partidos[i];

      if (partido.nuevo) {

        if (
          partido.idEquipoLocal === null ||
          partido.idEquipoVisitante === null
        ) {
          return `Seleccione los equipos del partido ${i + 1}.`;
        }

        if (
          partido.idEquipoLocal ===
          partido.idEquipoVisitante
        ) {
          return `El equipo local y visitante no pueden ser iguales en el partido ${i + 1}.`;
        }

      }

      if (!partido.fecha) {
        return `Capture la fecha del partido ${i + 1}.`;
      }

      if (!partido.hora) {
        return `Capture la hora del partido ${i + 1}.`;
      }

      /*
       * El árbitro se considera opcional.
       * Para hacerlo obligatorio, descomenta:
       *
       * if (partido.idArbitro === null) {
       *   return `Seleccione un árbitro para el partido ${i + 1}.`;
       * }
       */
    }

     return null;

  }

  trackByPartido(index: number, partido: any): any {
    return partido.idPartido ?? partido;
  }

  onBack(): void {
    this.router.navigate(['/dashboard']);
  }


  private limpiarFormulario(): void {

    this.torneoId = null;

    this.categoriaId = null;
    this.jornadas = [];
  }

}