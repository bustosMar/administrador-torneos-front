import { Routes } from '@angular/router';
import { LoginComponent } from './components/login/login.component';
import { DashboardComponent } from './components/dashboard/dashboard.component';
import { ShellComponent } from './components/shell/shell.component';
import { GenericCrudComponent } from './components/generic-crud/generic-crud.component';
import { AuthGuard } from './services/auth.guard';
import { JornadaComponent } from './components/jornada/jornada.component';
import { GenerarJornadaComponent } from './components/generar-jornada/generar-jornada.component.';

export const routes: Routes = [
  {
    path: '',
    pathMatch: 'full',
    redirectTo: '/login'
  },
  {
    path: 'login',
    component: LoginComponent
  },
  {
    path: '',
    component: ShellComponent,
    canActivate: [AuthGuard],
    children: [
      {
        path: 'dashboard',
        component: DashboardComponent
      },
      {
        path: 'usuarios',
        component: GenericCrudComponent,
        data: { entity: 'Usuarios', entitySingular: 'Usuarios', endpoint: 'usuarios' }
      },
      {
        path: 'arbitros',
        component: GenericCrudComponent,
        data: { entity: 'Arbitros', entitySingular: 'Árbitros', endpoint: 'arbitros' }
      },
      {
        path: 'equipos',
        component: GenericCrudComponent,
        data: { entity: 'Equipos', entitySingular: 'Equipos', endpoint: 'equipos' }
      },
      {
        path: 'grupos',
        component: GenericCrudComponent,
        data: { entity: 'Grupos', entitySingular: 'Grupos', endpoint: 'grupos' }
      },
      {
        path: 'jugadores',
        component: GenericCrudComponent,
        data: { entity: 'Jugadores', entitySingular: 'Jugadores', endpoint: 'jugadores' }
      },
      {
        path: 'roles',
        component: GenericCrudComponent,
        data: { entity: 'Roles', entitySingular: 'Roles', endpoint: 'roles' }
      },
      {
        path: 'torneos',
        component: GenericCrudComponent,
        data: { entity: 'Torneos', entitySingular: 'Torneos', endpoint: 'torneos' }
      },
      {
        path: 'equipos-en-torneo',
        component: GenericCrudComponent,
        data: { entity: 'EquiposEnTorneo', entitySingular: 'Equipos en Torneo', endpoint: 'equipos-en-torneo' }
      },
      {
        path: 'jugadores-en-equipo',
        component: GenericCrudComponent,
        data: { entity: 'JugadoresEnEquipo', entitySingular: 'Jugadores en Equipo', endpoint: 'jugadores-en-equipo' }
      },
      {
        path: 'categorias',
        component: GenericCrudComponent,
        data: { entity: 'Categorias', entitySingular: 'Categoría', endpoint: 'categorias' }
      },
      {
        path: 'categoria-torneo',
        component: GenericCrudComponent,
        data: { entity: 'CategoriaTorneo', entitySingular: 'Categoría Torneo', endpoint: 'categoria-torneo' }
      },
      {
        path: 'jornada',
        component: JornadaComponent
      },
      {
        path: 'generar-jornada',
        component: GenerarJornadaComponent
      },
      {
        path: 'partidos-jornada',
        loadComponent: () => import('./components/partidos-jornada/partidos-jornada.component').then(m => m.PartidosJornadaComponent)
      },
      {
        path: 'partidos-jornada/:idPartido/presencias',
        loadComponent: () => import('./components/presencia-partido/presencia-partido.component').then(m => m.PresenciaPartidoComponent)
      },
      {
        path: 'tabla-posiciones',
        loadComponent: () => import('./components/tabla-posiciones/tabla-posiciones.component').then(m => m.TablaPosicionesComponent)
      },
      {
        path: 'tabla-goleo',
        loadComponent: () => import('./components/tabla-goleo/tabla-goleo.component').then(m => m.TablaGoleoComponent)
      },
      {
        path: '',
        pathMatch: 'full',
        redirectTo: 'dashboard'
      }
    ]
  },
  {
    path: '**',
    redirectTo: '/login'
  }
];
