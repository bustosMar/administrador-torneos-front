import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { NavbarComponent } from '../navbar/navbar.component';

@Component({
  selector: 'app-shell',
  standalone: true,
  imports: [NavbarComponent, RouterOutlet],
  template: `
    <navbar></navbar>
    <div class="container my-4">
      <router-outlet></router-outlet>
    </div>
  `
})
export class ShellComponent {}
