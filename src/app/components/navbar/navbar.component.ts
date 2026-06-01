import { Component, Input } from '@angular/core';
import { RouterModule } from '@angular/router';
import { Usuario } from '../../models/usuario';

@Component({
  selector: 'navbar',
  standalone: true,
  imports: [RouterModule],
  templateUrl: './navbar.component.html'
})
export class NavbarComponent {
  @Input() usuarios: Usuario[] = [];
}
