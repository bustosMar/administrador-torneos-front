import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterModule, ActivatedRoute, Router } from '@angular/router';
import { CrudService } from '../../services/crud.service';
import { JornadaService } from '../../services/jornada.service';
import { CommonModule } from '@angular/common';


@Component({
  selector: 'app-jornada',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './jornada.component.html'
})
export class JornadaComponent implements OnInit {

  // FORMULARIO
  torneoId!: number;
  grupoId!: number;

  // 🔥 LISTAS (igual que "jugadores" en tu ejemplo)
  torneos: any[] = [];
  grupos: any[] = [];
  jornadas: any[] = [];

  constructor(
    private crudService: CrudService,
    private jornadaService: JornadaService,
    private route: ActivatedRoute,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.cargarTorneos();
    this.cargarGrupos();
  }


  cargarTorneos() {
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


  cargarGrupos() {
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

  generarJornada() {
    this.jornadaService.generarJornada(
      'jornadas',
      this.torneoId
    ).subscribe({
      next: (data: any) => {
  
        const fechaDomingo = this.getNextSunday();
  
        this.jornadas = (Array.isArray(data)
          ? data
          : (data?._embedded?.grupos ?? [])
        ).map((j: any) => ({
          ...j,
          fecha: fechaDomingo,   // 👈 todos al próximo domingo
          hora: j.hora ?? '08:00' // opcional default
        }));
      },
      error: () => {
        this.jornadas = [];
      }
    });
  }

  guardarJornada() {
      this.jornadaService.generarJornada('jornadas',
                      this.torneoId).subscribe({
        next: (data: any) => {
          this.jornadas = Array.isArray(data)
            ? data
            : (data?._embedded?.grupos ?? []);
        },
        error: () => {
          this.grupos = [];
        }
      });
    }

  

  onBack(): void {
        this.router.navigate(['/dashboard']);
    }

    getNextSunday(): string {
      const today = new Date();
    
      const day = today.getDay(); // 0 = domingo, 1 = lunes...
      const diff = (7 - day) % 7 || 7; // siempre siguiente domingo
    
      const nextSunday = new Date();
      nextSunday.setDate(today.getDate() + diff);
    
      return nextSunday.toISOString().split('T')[0]; // formato YYYY-MM-DD
    }
    
}