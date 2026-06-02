import { Component, Input } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { Usuario } from '../../models/usuario';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'navbar',
  standalone: true,
  imports: [RouterModule],
  templateUrl: './navbar.component.html'
})
export class NavbarComponent {
  @Input() usuarios: Usuario[] = [];

  constructor(
    public authService: AuthService,
    private router: Router
  ) {}

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}
