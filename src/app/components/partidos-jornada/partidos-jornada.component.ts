import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { CrudService } from '../../services/crud.service';
import { JornadaService } from '../../services/jornada.service';

@Component({
  selector: 'app-partidos-jornada',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './partidos-jornada.component.html'
})
export class PartidosJornadaComponent implements OnInit {

  torneoId: number | null = null;
  categoriaId: number | null = null;

  torneos: any[] = [];
  categoriasDisponibles: any[] = [];
  partidos: any[] = [];
  jornadaResumen: any = null;
  jornadasResumen: any[] = [];

  mensajeJornadas = '';
  tipoMensaje: 'info' | 'success' | 'error' = 'info';

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
      next: (response: any) => {
        this.torneos = response;
      },
      error: (error: any) => {
        console.error('Error al cargar torneos', error);
      }
    });
  }

  onTorneoChange(torneoId: number | null): void {
    this.categoriaId = null;
    this.partidos = [];
    this.jornadaResumen = null;
    this.jornadasResumen = [];

    if (torneoId !== null) {
      this.loadCategoriasByTorneo(torneoId);
    } else {
      this.categoriasDisponibles = [];
    }
  }

  private loadCategoriasByTorneo(torneoId: number): void {
    this.crudService.findAll(`categoria-torneo?torneoId=${torneoId}`).subscribe({
      next: data => {
        this.categoriasDisponibles = Array.isArray(data) ? data : [];
      },
      error: err => {
        console.error('Error cargando categorías del torneo', err);
        this.categoriasDisponibles = [];
      }
    });
  }

  consultarPartidosJornada(): void {
    if (this.torneoId === null || this.categoriaId === null) {
      this.mensajeJornadas = 'Seleccione un torneo y una categoría.';
      this.tipoMensaje = 'error';
      return;
    }

    this.mensajeJornadas = '';
    this.partidos = [];
    this.jornadaResumen = null;
    this.jornadasResumen = [];

    this.jornadaService.partidosJornadaJugada(this.torneoId, this.categoriaId).subscribe({
      next: (response: any[]) => {
        this.partidos = Array.isArray(response) ? response : [];

        if (!this.partidos.length) {
          this.mensajeJornadas = 'No existen partidos para una jornada con estado JUGADA en la categoría seleccionada.';
          this.tipoMensaje = 'info';
          return;
        }

        this.jornadasResumen = this.construirResumenesPorGrupo(this.partidos);
        this.jornadaResumen = this.jornadasResumen[0] ?? null;
      },
      error: (error: any) => {
        console.error('Error al consultar partidos de jornada jugada', error);
        this.partidos = [];
        this.jornadaResumen = null;
        this.jornadasResumen = [];
        this.mensajeJornadas =
          error?.error?.message ??
          error?.error?.mensaje ??
          'Ocurrió un error al consultar los partidos de la jornada.';
        this.tipoMensaje = 'error';
      }
    });
  }

  trackByPartido(index: number, partido: any): any {
    return partido.idPartido ?? index;
  }

  onBack(): void {
    this.router.navigate(['/dashboard']);
  }

  private construirResumenesPorGrupo(partidos: any[]): any[] {
    const resumenes = new Map<string, any>();

    for (const partido of partidos) {
      const idGrupo = partido.idGrupo ?? 'sin-grupo';
      const idJornada = partido.idJornada ?? 'sin-jornada';
      const clave = `${idGrupo}-${idJornada}`;

      if (!resumenes.has(clave)) {
        resumenes.set(clave, {
          torneo: partido.torneo,
          grupo: partido.grupo ?? 'Sin grupo',
          estado: partido.estado,
          numeroJornada: partido.numeroJornada,
          fechaJornada: partido.fecha
        });
      }
    }

    return Array.from(resumenes.values());
  }
}