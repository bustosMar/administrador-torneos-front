import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { CrudService } from '../../services/crud.service';
import { PresenciaPartidoService } from '../../services/presencia-partido.service';

@Component({
  selector: 'app-presencia-partido',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './presencia-partido.component.html'
})
export class PresenciaPartidoComponent implements OnInit, OnDestroy {

  eventosJugador: Record<number, any[]> = {};

  idPartido: number | null = null;
  detalle: any = null;
  jugadorDetectado: any = null;
  jugadoresPendientesLocal: any[] = [];
  jugadoresPendientesVisitante: any[] = [];
  equipoActivo: 'local' | 'visitante' | null = null;
  mostrarJugadorDetectado = false;
  observaciones = '';
  busquedaJugador = '';
  sugerenciasJugadores: any[] = [];
  golEditable: Record<number, { minuto: number | null; tipo: string }> = {};
  sancionEditable: Record<number, { minuto: number | null; tipo: string; observacion: string }> = {};

  mensaje = '';
  tipoMensaje: 'info' | 'success' | 'error' = 'info';

  huellaStatus = 'Sin captura iniciada';
  escuchandoHuella = false;
  private huellaInterval: ReturnType<typeof setInterval> | null = null;
  private consultandoHuella = false;
  private procesandoCaptura = false;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private crudService: CrudService,
    private presenciaPartidoService: PresenciaPartidoService
  ) {}

  ngOnInit(): void {
    const param = this.route.snapshot.paramMap.get('idPartido');
    this.idPartido = param ? Number(param) : null;

    if (!this.idPartido) {
      this.mensaje = 'No se recibió un partido válido.';
      this.tipoMensaje = 'error';
      return;
    }

    this.cargarDetalle();
  }

  ngOnDestroy(): void {
    this.detenerConsultaHuella();
    this.detenerLectorRemoto();
  }

  cargarDetalle(): void {
    if (!this.idPartido) {
      return;
    }

    this.presenciaPartidoService.obtenerDetalle(this.idPartido).subscribe({
      next: (response: any) => {
        this.detalle = response;
      },
      error: (error: any) => {
        console.error('Error al cargar detalle del partido', error);
        this.mensaje =
          error?.error?.message ??
          error?.error?.mensaje ??
          'No fue posible cargar el detalle del partido.';
        this.tipoMensaje = 'error';
      }
    });
  }

  escucharLector(equipo: 'local' | 'visitante'): void {
    this.detenerConsultaHuella();
    this.equipoActivo = equipo;
    this.jugadorDetectado = null;
    this.mostrarJugadorDetectado = false;
    this.procesandoCaptura = false;

    this.huellaStatus = 'Iniciando escucha del lector...';
    this.escuchandoHuella = true;

    this.detenerLectorRemoto(() => {
      this.crudService.escucharLectorHuellaVerificacion().subscribe({
        next: (response: any) => {
          console.log('[PRESENCIA][HUELLA] Escucha de verificacion iniciada', response);
          this.huellaStatus = response?.mensaje || 'Lector en escucha';
          this.consultarHuellaVerificacion();
          this.iniciarConsultaHuella();
        },
        error: (err) => {
          console.error(err);
          this.huellaStatus = 'Error al iniciar lector';
          this.escuchandoHuella = false;
          this.mensaje = 'No se pudo iniciar la escucha del lector.';
          this.tipoMensaje = 'error';
        }
      });
    });
  }

  capturarHuella(): void {
    if (!this.equipoActivo) {
      this.mensaje = 'Seleccione primero si registrará presencia para el equipo local o visitante.';
      this.tipoMensaje = 'info';
      return;
    }

    this.huellaStatus = 'Obteniendo huella capturada...';
    this.mensaje = this.huellaStatus;
    this.tipoMensaje = 'info';

    this.consultarHuellaVerificacion();
  }

  private iniciarConsultaHuella(): void {
    this.detenerConsultaHuella();

    this.huellaInterval = setInterval(() => {
      this.consultarHuellaVerificacion();
    }, 1500);
  }

  private consultarHuellaVerificacion(): void {
    if (this.consultandoHuella || this.procesandoCaptura) {
      return;
    }

    this.consultandoHuella = true;

    this.crudService.consultarLectorHuellaVerificacion().subscribe({
      next: (response: any) => {
        this.consultandoHuella = false;
        console.log('[PRESENCIA][HUELLA] Consulta de verificacion', response);

        if (!response?.templateBase64) {
          this.huellaStatus = response?.mensaje || 'Todavía no se ha capturado la huella';
          this.mensaje = this.huellaStatus;
          this.tipoMensaje = 'info';
          return;
        }

        this.procesandoCaptura = true;
        this.detenerConsultaHuella();
        this.escuchandoHuella = false;
        this.identificarHuella(response.templateBase64);
      },
      error: (err) => {
        this.consultandoHuella = false;
        console.error(err);
        this.huellaStatus = 'Error al obtener huella';
        this.mensaje = 'No se pudo recuperar la huella capturada.';
        this.tipoMensaje = 'error';
      }
    });
  }

  private identificarHuella(huella: string): void {
    if (!this.idPartido || !this.equipoActivo || !this.detalle) {
      return;
    }

    const equipoId = this.equipoActivo === 'local'
      ? this.detalle.idEquipoLocal
      : this.detalle.idEquipoVisitante;

    this.presenciaPartidoService.identificarHuella(this.idPartido, equipoId, huella, this.observaciones).subscribe({
      next: (response: any) => {
        this.procesandoCaptura = false;
        this.jugadorDetectado = response?.jugador ?? null;
        this.mostrarJugadorDetectado = !!this.jugadorDetectado;
        this.huellaStatus = response?.mensaje || 'Presencia procesada';
        this.mensaje = this.huellaStatus;
        this.tipoMensaje = 'success';

        if (this.detalle && this.jugadorDetectado && this.equipoActivo) {
          this.detalle.presenciasRegistradas = response?.presenciasRegistradas ?? [];
          this.agregarPendiente(this.jugadorDetectado, this.equipoActivo);
          this.actualizarJugadoresPresentes();
        }

        this.busquedaJugador = '';
        this.sugerenciasJugadores = [];

        this.observaciones = '';
      },
      error: (error: any) => {
        this.procesandoCaptura = false;
        console.error('Error al registrar presencia', error);
        this.mensaje =
          error?.error?.message ??
          error?.error?.mensaje ??
          'No fue posible registrar la presencia.';
        this.tipoMensaje = 'error';
        this.huellaStatus = this.mensaje;
      }
    });
  }

  buscarJugadorPorTexto(): void {
    if (!this.equipoActivo || !this.detalle) {
      this.sugerenciasJugadores = [];
      return;
    }

    const texto = this.busquedaJugador.trim().toLowerCase();

    if (!texto) {
      this.sugerenciasJugadores = [];
      return;
    }

    const jugadoresEquipo = this.equipoActivo === 'local'
      ? (this.detalle.jugadoresLocal ?? [])
      : (this.detalle.jugadoresVisitante ?? []);

    this.sugerenciasJugadores = jugadoresEquipo
      .filter((jugador: any) => (jugador?.nombreCompleto ?? '').toLowerCase().includes(texto))
      .slice(0, 8);
  }

  seleccionarJugadorPorTexto(jugador: any): void {
    if (!this.equipoActivo || !jugador) {
      return;
    }

    this.jugadorDetectado = jugador;
    this.mostrarJugadorDetectado = true;

    this.agregarPendiente(jugador, this.equipoActivo);
    this.actualizarJugadoresPresentes();

    this.huellaStatus = `Jugador seleccionado por búsqueda: ${jugador.nombreCompleto}`;
    this.mensaje = this.huellaStatus;
    this.tipoMensaje = 'success';

    this.busquedaJugador = '';
    this.sugerenciasJugadores = [];
  }

  guardarPendientes(): void {
    if (!this.idPartido) {
      return;
    }

    const ids = [...this.jugadoresPendientesLocal, ...this.jugadoresPendientesVisitante]
      .map(jugador => jugador.idJugador);

    if (!ids.length) {
      return;
    }

    this.presenciaPartidoService.guardarPresencias(this.idPartido, ids, this.observaciones).subscribe({
      next: (response: any) => {
        if (this.detalle) {
          this.detalle.presenciasRegistradas = response?.presenciasRegistradas ?? [];
          this.actualizarJugadoresPresentes();
        }

        this.jugadoresPendientesLocal = [];
        this.jugadoresPendientesVisitante = [];
        this.jugadorDetectado = null;
        this.mostrarJugadorDetectado = false;
        this.equipoActivo = null;
        this.mensaje = response?.mensaje ?? 'Presencias guardadas correctamente.';
        this.tipoMensaje = 'success';
        this.observaciones = '';
      },
      error: (error: any) => {
        console.error('Error al guardar presencias', error);
        this.mensaje =
          error?.error?.message ??
          error?.error?.mensaje ??
          'No fue posible guardar las presencias.';
        this.tipoMensaje = 'error';
      }
    });
  }

  quitarPendiente(idJugador: number): void {
    this.jugadoresPendientesLocal = this.jugadoresPendientesLocal.filter(jugador => jugador.idJugador !== idJugador);
    this.jugadoresPendientesVisitante = this.jugadoresPendientesVisitante.filter(jugador => jugador.idJugador !== idJugador);
  }

  cerrarJugadorDetectado(): void {
    this.jugadorDetectado = null;
    this.mostrarJugadorDetectado = false;
  }

  private agregarPendiente(jugador: any, equipo: 'local' | 'visitante'): void {
    const yaRegistrado = (this.detalle?.presenciasRegistradas ?? []).some(
      (item: any) => item.idJugador === jugador.idJugador
    );

    if (yaRegistrado) {
      this.mensaje = 'El jugador ya estaba registrado en presencias.';
      this.tipoMensaje = 'info';
      return;
    }

    const listaPendiente = equipo === 'local'
      ? this.jugadoresPendientesLocal
      : this.jugadoresPendientesVisitante;

    const yaPendiente = listaPendiente.some(item => item.idJugador === jugador.idJugador);

    if (yaPendiente) {
      this.mensaje = 'El jugador ya está en la lista temporal.';
      this.tipoMensaje = 'info';
      return;
    }

    if (equipo === 'local') {
      this.jugadoresPendientesLocal = [...this.jugadoresPendientesLocal, jugador];
      return;
    }

    this.jugadoresPendientesVisitante = [...this.jugadoresPendientesVisitante, jugador];
  }

  private actualizarJugadoresPresentes(): void {
    if (!this.detalle) {
      return;
    }

    const presentes = new Set<number>(
      (this.detalle.presenciasRegistradas ?? []).map((jugador: any) => jugador.idJugador)
    );

    this.detalle.jugadoresLocal = (this.detalle.jugadoresLocal ?? []).map((jugador: any) => ({
      ...jugador,
      presente: presentes.has(jugador.idJugador)
    }));

    this.detalle.jugadoresVisitante = (this.detalle.jugadoresVisitante ?? []).map((jugador: any) => ({
      ...jugador,
      presente: presentes.has(jugador.idJugador)
    }));
  }

  get pendientesLocal(): any[] {
    return this.jugadoresPendientesLocal;
  }

  get pendientesVisitante(): any[] {
    return this.jugadoresPendientesVisitante;
  }

  get registradasLocal(): any[] {
    return this.filtrarPorEquipo(this.detalle?.presenciasRegistradas ?? [], this.detalle?.equipoLocal);
  }

  get registradasVisitante(): any[] {
    return this.filtrarPorEquipo(this.detalle?.presenciasRegistradas ?? [], this.detalle?.equipoVisitante);
  }

  getGolForm(idJugador: number): { minuto: number | null; tipo: string } {
    if (!this.golEditable[idJugador]) {
      this.golEditable[idJugador] = { minuto: null, tipo: 'NORMAL' };
    }
    return this.golEditable[idJugador];
  }

  getSancionForm(idJugador: number): { minuto: number | null; tipo: string; observacion: string } {
    if (!this.sancionEditable[idJugador]) {
      this.sancionEditable[idJugador] = { minuto: null, tipo: 'AMARILLA', observacion: '' };
    }
    return this.sancionEditable[idJugador];
  }

  registrarGol(jugador: any, equipo: 'local' | 'visitante'): void {
  if (!this.idPartido || !jugador?.idJugador || !this.detalle) {
    return;
  }

  const form = this.getGolForm(jugador.idJugador);
  const minuto = Number(form.minuto);

  if (!Number.isFinite(minuto) || minuto < 0 || minuto > 130) {
    this.mensaje = 'Capture un minuto válido para el gol (0-130).';
    this.tipoMensaje = 'error';
    return;
  }

  const equipoId = equipo === 'local'
    ? this.detalle.idEquipoLocal
    : this.detalle.idEquipoVisitante;

     const payload = {
      partido: this.idPartido,
      jugador: jugador.idJugador,
      equipoTorneo: equipoId,
      minuto,
      tipo: form.tipo || 'NORMAL'
    };

  console.log('Payload gol:', payload);

  this.presenciaPartidoService.crearGol(payload).subscribe({
    next: (response: any) => {
      this.mensaje = `Gol registrado para ${jugador.nombreCompleto}.`;
      this.tipoMensaje = 'success';

      this.golEditable[jugador.idJugador] = {
        minuto: null,
        tipo: 'NORMAL'
      };

      const evento = {
        id: response?.id ?? null,
        clase: 'GOL',
        minuto,
        tipo: form.tipo || 'NORMAL',
        observacion: null,
        equipo
      };

      this.eventosJugador[jugador.idJugador] = [
        ...(this.eventosJugador[jugador.idJugador] ?? []),
        evento
      ];
    },
    error: (error: any) => {
      console.error('Error al registrar gol', error);

      this.mensaje =
        error?.error?.message ??
        error?.error?.mensaje ??
        'No fue posible registrar el gol.';

      this.tipoMensaje = 'error';
    }
  });
}

  registrarSancion(jugador: any, equipo: 'local' | 'visitante'): void {
    if (!this.idPartido || !jugador?.idJugador || !this.detalle) {
      return;
    }

    const form = this.getSancionForm(jugador.idJugador);
    const minuto = Number(form.minuto);

    if (!Number.isFinite(minuto) || minuto < 0 || minuto > 130) {
      this.mensaje = 'Capture un minuto válido para la sanción (0-130).';
      this.tipoMensaje = 'error';
      return;
    }

    const equipoId = equipo === 'local' ? this.detalle.idEquipoLocal : this.detalle.idEquipoVisitante;

    const payload = {
      partido: this.idPartido,
      jugador: jugador.idJugador,
      equipoTorneo: equipoId,
      minuto,
      tipo: form.tipo || 'AMARILLA',
      observacion: form.observacion || null
    };

    this.presenciaPartidoService.crearSancion(payload).subscribe({
      next: (response: any) => {
        this.mensaje = `Sanción registrada para ${jugador.nombreCompleto}.`;
        this.tipoMensaje = 'success';
        this.sancionEditable[jugador.idJugador] = { minuto: null, tipo: 'AMARILLA', observacion: '' };

        const evento = {
          id: response?.id ?? null,
          clase: 'SANCION',
          minuto,
          tipo: form.tipo || 'AMARILLA',
          observacion: form.observacion || '',
          equipo
        };

        this.eventosJugador[jugador.idJugador] = [
          ...(this.eventosJugador[jugador.idJugador] ?? []),
          evento
        ];
      },
      error: (error: any) => {
        console.error('Error al registrar sanción', error);
        this.mensaje =
          error?.error?.message ??
          error?.error?.mensaje ??
          'No fue posible registrar la sanción.';
        this.tipoMensaje = 'error';
      }
    });
  }

  getEventosJugador(idJugador: number): any[] {
    return this.eventosJugador[idJugador] ?? [];
  }

  guardarEvento(jugador: any, evento: any): void {
    if (!this.idPartido || !jugador?.idJugador || !evento?.id || !this.detalle) {
      return;
    }

    const equipoId = evento.equipo === 'local'
      ? this.detalle.idEquipoLocal
      : this.detalle.idEquipoVisitante;

    const payloadBase = {
      partido: { id: this.idPartido },
      jugador: { id: jugador.idJugador },
      equipoTorneo: { id: equipoId },
      minuto: Number(evento.minuto),
      tipo: evento.tipo
    };

    if (!Number.isFinite(payloadBase.minuto) || payloadBase.minuto < 0 || payloadBase.minuto > 130) {
      this.mensaje = 'El minuto del evento debe estar entre 0 y 130.';
      this.tipoMensaje = 'error';
      return;
    }

    if (evento.clase === 'GOL') {
      this.presenciaPartidoService.actualizarGol(evento.id, payloadBase).subscribe({
        next: () => {
          this.mensaje = 'Gol actualizado correctamente.';
          this.tipoMensaje = 'success';
        },
        error: (error: any) => {
          console.error('Error al actualizar gol', error);
          this.mensaje = error?.error?.message ?? error?.error?.mensaje ?? 'No fue posible actualizar el gol.';
          this.tipoMensaje = 'error';
        }
      });
      return;
    }

    const payloadSancion = {
      partido: this.idPartido,
      jugador: jugador.idJugador,
      equipoTorneo: equipoId,
      minuto: payloadBase.minuto,
      tipo: payloadBase.tipo,
      observacion: evento.observacion || null
    };

    this.presenciaPartidoService.actualizarSancion(evento.id, payloadSancion).subscribe({
      next: () => {
        this.mensaje = 'Sanción actualizada correctamente.';
        this.tipoMensaje = 'success';
      },
      error: (error: any) => {
        console.error('Error al actualizar sanción', error);
        this.mensaje = error?.error?.message ?? error?.error?.mensaje ?? 'No fue posible actualizar la sanción.';
        this.tipoMensaje = 'error';
      }
    });
  }

  eliminarEvento(jugador: any, evento: any): void {
    if (!evento?.id || !jugador?.idJugador) {
      return;
    }

    if (evento.clase === 'GOL') {
      this.presenciaPartidoService.eliminarGol(evento.id).subscribe({
        next: () => this.quitarEventoLocal(jugador.idJugador, evento.id, 'GOL'),
        error: (error: any) => {
          console.error('Error al eliminar gol', error);
          this.mensaje = error?.error?.message ?? error?.error?.mensaje ?? 'No fue posible eliminar el gol.';
          this.tipoMensaje = 'error';
        }
      });
      return;
    }

    this.presenciaPartidoService.eliminarSancion(evento.id).subscribe({
      next: () => this.quitarEventoLocal(jugador.idJugador, evento.id, 'SANCION'),
      error: (error: any) => {
        console.error('Error al eliminar sanción', error);
        this.mensaje = error?.error?.message ?? error?.error?.mensaje ?? 'No fue posible eliminar la sanción.';
        this.tipoMensaje = 'error';
      }
    });
  }

  private quitarEventoLocal(idJugador: number, idEvento: number, clase: 'GOL' | 'SANCION'): void {
    this.eventosJugador[idJugador] = (this.eventosJugador[idJugador] ?? []).filter(
      evento => !(evento.id === idEvento && evento.clase === clase)
    );

    this.mensaje = clase === 'GOL'
      ? 'Gol eliminado correctamente.'
      : 'Sanción eliminada correctamente.';
    this.tipoMensaje = 'success';
  }

  private filtrarPorEquipo(jugadores: any[], equipo: string | undefined): any[] {
    if (!equipo) {
      return [];
    }

    return (jugadores ?? []).filter(jugador => jugador.equipo === equipo);
  }

  private detenerConsultaHuella(): void {
    if (this.huellaInterval) {
      clearInterval(this.huellaInterval);
      this.huellaInterval = null;
    }

    this.consultandoHuella = false;
  }

  private detenerLectorRemoto(onComplete?: () => void): void {
    this.crudService.detenerLectorHuella().subscribe({
      next: () => {
        this.escuchandoHuella = false;
        if (onComplete) {
          onComplete();
        }
      },
      error: () => {
        this.escuchandoHuella = false;
        if (onComplete) {
          onComplete();
        }
      }
    });
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

  onBack(): void {
    this.router.navigate(['/partidos-jornada']);
  }
}