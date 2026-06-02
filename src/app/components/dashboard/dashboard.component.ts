import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'dashboard-page',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent {
  entities = [
    { label: 'Árbitro', path: '/arbitros' },
    { label: 'Equipo', path: '/equipos' },
    { label: 'Gol', path: '/goles' },
    { label: 'Grupo', path: '/grupos' },
    { label: 'Jugador', path: '/jugadores' },
    { label: 'Rol', path: '/roles' },
    { label: 'Torneo', path: '/torneos' },
    { label: 'Usuarios', path: '/usuarios' }
  ];
}
