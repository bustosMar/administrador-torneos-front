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
    {
      label: 'Torneos',
      path: '/torneos',
      image: 'assets/img/torneo.jpg'
    },
    {
      label: 'Grupos',
      path: '/grupos',
      image: 'assets/img/grupo.jpg'
    },
    {
      label: 'Equipos',
      path: '/equipos',
      image: 'assets/img/equipo.jpg'
    },
    {
      label: 'Equipos en Torneo',
      path: '/equipos-en-torneo',
      image: 'assets/img/equiposParticipantes.jpg'
    },
    {
      label: 'Categorías',
      path: '/categorias',
      image: 'assets/img/categorias.jpg'
    },
    {
      label: 'Categorías por Torneo',
      path: '/categoria-torneo',
      image: 'assets/img/categoriasentorneo.jpeg'
    },
    {
      label: 'Jugadores',
      path: '/jugadores',
      image: 'assets/img/jugador.jpg'
    },
     {
      label: 'Jugadores en Equipo',
      path: '/jugadores-en-equipo',
      image: 'assets/img/jugadoresenequipo.jpg'
    },
    {
      label: 'Árbitros',
      path: '/arbitros',
      image: 'assets/img/arbitro.jpg'
    },
    {
      label: 'Roles',
      path: '/roles',
      image: 'assets/img/rol.jpg'
    },
    {
      label: 'Usuarios',
      path: '/usuarios',
      image: 'assets/img/usuario.jpg'
    },
  ];

}