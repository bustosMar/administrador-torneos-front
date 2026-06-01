import { Routes } from '@angular/router';
import { UsuarioComponent } from './components/usuario/usuario.component';
import { UsuarioFormComponent } from './components/usuario-form/usuario-form.component';

export const routes: Routes = [
    {
        path: '',
        pathMatch: 'full',
        redirectTo: '/usuarios'
    },
    {
        path: 'usuarios',
        component: UsuarioComponent,
    },
    {
        path: 'usuarios/create', 
        component: UsuarioFormComponent,
    },
    {
        path: 'usuarios/edit/:id',
        component: UsuarioFormComponent
    }

];
