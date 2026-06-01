import { Component, OnInit } from '@angular/core';
import { Usuario } from '../models/usuario';
import { Usuarioservice } from '../services/usuario.service';
import Swal from 'sweetalert2';
import { Router, RouterOutlet } from '@angular/router';
import { NavbarComponent } from './navbar/navbar.component';
import { SharingDataService } from '../services/sharing-data.service';

@Component({
  selector: 'usuario-app',
  standalone: true,
  imports: [RouterOutlet, NavbarComponent],
  templateUrl: './usuario-app.component.html',
  styleUrls: ['./usuario-app.component.css']
})
export class UsuarioAppComponent implements OnInit {

  usuarios: Usuario[] = [];

  constructor(
    private router: Router,
    private service: Usuarioservice,
    private sharingData: SharingDataService) {
  }

  ngOnInit(): void {
    this.service.findAll().subscribe(usuarios => this.usuarios = usuarios);
    this.addusuario();
    this.removeusuario();
    this.findusuarioById();
  }

  findusuarioById() {
    this.sharingData.findusuarioByIdEventEmitter.subscribe(id => {

      const usuario = this.usuarios.find(usuario => usuario.id == id);

      this.sharingData.selectusuarioEventEmitter.emit(usuario);
    })
  }

  addusuario() {
    this.sharingData.newusuarioEventEmitter.subscribe(usuario => {
      if (usuario.id > 0) {
        this.service.update(usuario).subscribe(usuarioUpdated => {
          this.usuarios = this.usuarios.map(u => (u.id == usuarioUpdated.id) ? { ...usuarioUpdated } : u);
          this.router.navigate(['/usuarios'], {state: {usuarios: this.usuarios}});
        })

      } else {
        this.service.create(usuario).subscribe(usuarioNew => {
          console.log(usuario)
          this.usuarios = [... this.usuarios, { ...usuarioNew }];

          this.router.navigate(['/usuarios'], {state: {usuarios: this.usuarios}});
        })
      }
      Swal.fire({
        title: "Guardado!",
        text: "Usuario guardado con exito!",
        icon: "success"
      });
    })
  }

  removeusuario(): void {
    this.sharingData.idusuarioEventEmitter.subscribe(id => {
      Swal.fire({
        title: "Seguro que quiere eliminar?",
        text: "Cuidado el usuario sera eliminado del sistema!",
        icon: "warning",
        showCancelButton: true,
        confirmButtonColor: "#3085d6",
        cancelButtonColor: "#d33",
        confirmButtonText: "Si"
      }).then((result) => {
        if (result.isConfirmed) {

          this.service.remove(id).subscribe(() => {
            this.usuarios = this.usuarios.filter(usuario => usuario.id != id);
            this.router.navigate(['/usuarios/create'], { skipLocationChange: true }).then(() => {
              this.router.navigate(['/usuarios'], { state: { usuarios: this.usuarios } });
            });
          })


          Swal.fire({
            title: "Eliminado!",
            text: "Usuario eliminado con exito.",
            icon: "success"
          });
        }
      });
    });
  }

}
