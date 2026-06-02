import { Component } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import Swal from 'sweetalert2';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'login-page',
  standalone: true,
  imports: [ReactiveFormsModule, RouterModule],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent {

  loginForm = this.formBuilder.group({
    nombreUsuario: ['', Validators.required],
    password: ['', Validators.required]
  });

  constructor(
    private formBuilder: FormBuilder,
    private authService: AuthService,
    private router: Router
  ) {}

  onSubmit(): void {
    if (this.loginForm.invalid) {
      Swal.fire('Error', 'Debe completar usuario y contraseña.', 'warning');
      return;
    }

    this.authService.login(this.loginForm.value as { nombreUsuario: string; password: string }).subscribe({
      next: () => {
        Swal.fire('Bienvenido', 'Ingreso correcto, redirigiendo...', 'success');
        this.router.navigate(['/dashboard']);
      },
      error: () => {
        Swal.fire('Error', 'Usuario o contraseña incorrectos.', 'error');
      }
    });
  }
}
