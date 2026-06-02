import { Routes } from '@angular/router';
import { LoginComponent } from './components/login/login.component';
import { DashboardComponent } from './components/dashboard/dashboard.component';
import { ShellComponent } from './components/shell/shell.component';
import { CrudPlaceholderComponent } from './components/crud-placeholder/crud-placeholder.component';
import { UsuarioComponent } from './components/usuario/usuario.component';
import { UsuarioFormComponent } from './components/usuario-form/usuario-form.component';
import { UsuarioAppComponent } from './components/usuario-app.component';
import { AuthGuard } from './services/auth.guard';

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
        component: UsuarioAppComponent,
        children: [
          {
            path: '',
            component: UsuarioComponent
          },
          {
            path: 'create',
            component: UsuarioFormComponent
          },
          {
            path: 'edit/:id',
            component: UsuarioFormComponent
          }
        ]
      },
      {
        path: 'arbitros',
        component: CrudPlaceholderComponent,
        data: { entity: 'Árbitro' }
      },
      {
        path: 'equipos',
        component: CrudPlaceholderComponent,
        data: { entity: 'Equipo' }
      },
      {
        path: 'goles',
        component: CrudPlaceholderComponent,
        data: { entity: 'Gol' }
      },
      {
        path: 'grupos',
        component: CrudPlaceholderComponent,
        data: { entity: 'Grupo' }
      },
      {
        path: 'jugadores',
        component: CrudPlaceholderComponent,
        data: { entity: 'Jugador' }
      },
      {
        path: 'roles',
        component: CrudPlaceholderComponent,
        data: { entity: 'Rol' }
      },
      {
        path: 'torneos',
        component: CrudPlaceholderComponent,
        data: { entity: 'Torneo' }
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
