import { Component, Input } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { Usuario } from '../../models/usuario';
import { AuthService } from '../../services/auth.service';
import { CommonModule } from '@angular/common';
import { Dropdown } from 'bootstrap';

@Component({
  selector: 'navbar',
  standalone: true,
  imports: [RouterModule, CommonModule],
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.css']
})
export class NavbarComponent {
  @Input() usuarios: Usuario[] = [];
  mostrarSubmenuJornadas = false;

  constructor(
    public authService: AuthService,
    private router: Router
  ) {}

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }


   toggleSubmenuJornadas(event: MouseEvent): void {
      event.preventDefault();
      event.stopPropagation();
    
      this.mostrarSubmenuJornadas = !this.mostrarSubmenuJornadas;
    }
    
    cerrarMenus(): void {
      this.mostrarSubmenuJornadas = false;
    
      const competencia = document.getElementById('competenciaDropdown') as HTMLElement;
    
      if (competencia) {
        competencia.click();
      }
    }
}
