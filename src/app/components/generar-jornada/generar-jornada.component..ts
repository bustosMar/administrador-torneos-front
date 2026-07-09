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
  equiposDisponibles: any[] = [];
  partidos: any[] = []; 

  jornadas: any[] = [];
  jornadaVisualizada: any = null;

  mensajeJornadas: string = '';

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
      next: (data: any[]) => {
        this.torneos = data;
      },
      error: (error) => {
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

  
  cargarEquiposPorTorneoYCategoria(idTorneo: number, idCategoria: number): void {
    this.crudService.findAll(`equipos-en-torneo/torneo/${idTorneo}/categoria/${idCategoria}`).subscribe({
      next: (data: any[]) => {
        this.equiposDisponibles = data;
      },
      error: (error) => {
        console.error('Error al cargar equipos del torneo y categoría', error);
      }
    });
  }

  verJornadaActual(): void {
    if (this.torneoId === null || this.categoriaId === null) {
      this.mensajeJornadas = 'Debe seleccionar un torneo y una categoría.';
      return;
    }
    

     this.jornadaService
      .jornadaActual(
        'jornadas',
        this.torneoId,
        this.categoriaId
      )
      .subscribe({
  
        next: (data: any) => {
  
          this.jornadaVisualizada = data;
  
          this.jornadas = data ? [data] : [];
  
          this.partidos = data?.partidos ?? [];
  
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
  
        }
  
      });
  
  }


  guardarPartidos(): void {
    if (!this.jornadaVisualizada || !this.jornadaVisualizada.partidos?.length) {
      this.mensajeJornadas = 'No hay partidos para guardar.';
      return;
    }

    this.crudService.create('partidos/jornada', this.jornadaVisualizada.partidos).subscribe({
      next: () => {
        this.mensajeJornadas = 'Partidos guardados correctamente.';
      },
      error: (error) => {
        console.error('Error al guardar partidos', error);
        this.mensajeJornadas = 'Ocurrió un error al guardar los partidos.';
      }
    });
  }

  onBack(): void {
    this.router.navigate(['/dashboard']);
  }
}