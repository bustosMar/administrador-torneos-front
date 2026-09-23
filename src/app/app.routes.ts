import { Routes } from '@angular/router';
import { LoginComponent } from './components/login/login.component';
import { DashboardComponent } from './components/dashboard/dashboard.component';
import { ShellComponent } from './components/shell/shell.component';
import { GenericCrudComponent } from './components/generic-crud/generic-crud.component';
import { AuthGuard } from './services/auth.guard';
import { RoleGuard } from './services/role.guard';
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
        canActivate: [RoleGuard],
        data: { entity: 'Usuarios', entitySingular: 'Usuarios', endpoint: 'usuarios', roles: ['ADMIN'] }
      },
      {
        path: 'arbitros',
        component: GenericCrudComponent,
        canActivate: [RoleGuard],
        data: { entity: 'Arbitros', entitySingular: 'Árbitros', endpoint: 'arbitros', roles: ['ADMIN'] }
      },
      {
        path: 'equipos',
        component: GenericCrudComponent,
        canActivate: [RoleGuard],
        data: { entity: 'Equipos', entitySingular: 'Equipos', endpoint: 'equipos', roles: ['ADMIN'] }
      },
      {
        path: 'grupos',
        component: GenericCrudComponent,
        canActivate: [RoleGuard],
        data: { entity: 'Grupos', entitySingular: 'Grupos', endpoint: 'grupos', roles: ['ADMIN'] }
      },
      {
        path: 'jugadores',
        component: GenericCrudComponent,
        canActivate: [RoleGuard],
        data: { entity: 'Jugadores', entitySingular: 'Jugadores', endpoint: 'jugadores', roles: ['ADMIN'] }
      },
      {
        path: 'roles',
        component: GenericCrudComponent,
        canActivate: [RoleGuard],
        data: { entity: 'Roles', entitySingular: 'Roles', endpoint: 'roles', roles: ['ADMIN'] }
      },
      {
        path: 'torneos',
        component: GenericCrudComponent,
        canActivate: [RoleGuard],
        data: { entity: 'Torneos', entitySingular: 'Torneos', endpoint: 'torneos', roles: ['ADMIN'] }
      },
      {
        path: 'equipos-en-torneo',
        component: GenericCrudComponent,
        canActivate: [RoleGuard],
        data: { entity: 'EquiposEnTorneo', entitySingular: 'Equipos en Torneo', endpoint: 'equipos-en-torneo', roles: ['ADMIN'] }
      },
      {
        path: 'jugadores-en-equipo',
        component: GenericCrudComponent,
        canActivate: [RoleGuard],
        data: { entity: 'JugadoresEnEquipo', entitySingular: 'Jugadores en Equipo', endpoint: 'jugadores-en-equipo', roles: ['ADMIN'] }
      },
      {
        path: 'categorias',
        component: GenericCrudComponent,
        canActivate: [RoleGuard],
        data: { entity: 'Categorias', entitySingular: 'Categoría', endpoint: 'categorias', roles: ['ADMIN'] }
      },
      {
        path: 'categoria-torneo',
        component: GenericCrudComponent,
        canActivate: [RoleGuard],
        data: { entity: 'CategoriaTorneo', entitySingular: 'Categoría Torneo', endpoint: 'categoria-torneo', roles: ['ADMIN'] }
      },
      {
        path: 'jornada',
        component: JornadaComponent,
        canActivate: [RoleGuard],
        data: { roles: ['ADMIN'] }
      },
      {
        path: 'generar-jornada',
        component: GenerarJornadaComponent,
        canActivate: [RoleGuard],
        data: { roles: ['ADMIN'] }
      },
      {
        path: 'partidos-jornada',
        canActivate: [RoleGuard],
        data: { roles: ['ADMIN', 'REFEREE'] },
        loadComponent: () => import('./components/partidos-jornada/partidos-jornada.component').then(m => m.PartidosJornadaComponent)
      },
      {
        path: 'partidos-jornada/:idPartido/presencias',
        canActivate: [RoleGuard],
        data: { roles: ['ADMIN', 'REFEREE'] },
        loadComponent: () => import('./components/presencia-partido/presencia-partido.component').then(m => m.PresenciaPartidoComponent)
      },
      {
        path: 'tabla-posiciones',
        canActivate: [RoleGuard],
        data: { roles: ['ADMIN'] },
        loadComponent: () => import('./components/tabla-posiciones/tabla-posiciones.component').then(m => m.TablaPosicionesComponent)
      },
      {
        path: 'tabla-goleo',
        canActivate: [RoleGuard],
        data: { roles: ['ADMIN'] },
        loadComponent: () => import('./components/tabla-goleo/tabla-goleo.component').then(m => m.TablaGoleoComponent)
      },
       {
        path: 'sanciones-suspensiones',
        canActivate: [RoleGuard],
        data: { roles: ['ADMIN', 'USER'] },
        loadComponent: () => import('./components/sanciones-suspensiones/sanciones-suspensiones.component').then(m => m.SancionesSuspensionesComponent)
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
