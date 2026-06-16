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
  grupoId: number | null = null;

  torneos: any[] = [];
  grupos: any[] = [];
  jornadas: any[] = [];

  constructor(
    private crudService: CrudService,
    private jornadaService: JornadaService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.cargarTorneos();
    this.cargarGrupos();
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

  cargarGrupos(): void {
    this.crudService.findAll('grupos').subscribe({
      next: (data: any) => {

        this.grupos = Array.isArray(data)
          ? data
          : (data?._embedded?.grupos ?? []);

      },
      error: () => {
        this.grupos = [];
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

   

    this.jornadaService
      .generarJornada('jornadas', this.torneoId)
      .subscribe({
        next: (data: any) => {

          const fechaDomingo = this.getNextSunday();

          this.jornadas = (
            Array.isArray(data)
              ? data
              : (data?._embedded?.grupos ?? [])
          ).map((j: any) => ({
            ...j,
            fecha: fechaDomingo,
            hora: j.hora ?? '08:00'
          }));

           if (this.jornadas.length === 0) {

            Swal.fire(
              'Atención',
              'No existen jornadas para guardar',
              'warning'
            );
      
            return;
          }

        },
        error: () => {
          this.jornadas = [];
        }
      });
  }

  guardarJornada(): void {

    if (this.jornadas.length === 0) {

      Swal.fire(
        'Atención',
        'No existen jornadas para guardar',
        'warning'
      );

      return;
    }

    const payload = this.jornadas.map(j => ({
      idTorneo: j.idTorneo,
      idGrupo: j.idGrupo,
      idLocal: j.idLocal,
      idVisitante: j.idVisitante,
      fecha: this.formatDate(j.fecha),
      hora: j.hora
    }));

    console.log('PAYLOAD:', payload);

    this.jornadaService
      .guardarJornada('partidos/jornada', payload)
      .subscribe({
        next: () => {

          Swal.fire(
            'OK',
            'Guardado correctamente',
            'success'
          );

          this.limpiarFormulario();
        },
        error: (err) => {
          console.error(err);

          Swal.fire(
            'Error',
            'No fue posible guardar la jornada',
            'error'
          );
        }
      });
  }

  private limpiarFormulario(): void {

    this.torneoId = null;
    this.grupoId = null;

    this.jornadas = [];
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

}