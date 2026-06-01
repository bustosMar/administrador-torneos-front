import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { UsuarioAppComponent } from './components/usuario-app.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, UsuarioAppComponent],
  templateUrl: './app.component.html'
})
export class AppComponent {
  title = 'usuario-app';
}
