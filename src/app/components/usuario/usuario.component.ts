import { Component, EventEmitter, OnInit } from '@angular/core';
import { Usuario } from '../../models/usuario';
import { Router, RouterModule } from '@angular/router';
import { Usuarioservice } from '../../services/usuario.service';
import { SharingDataService } from '../../services/sharing-data.service';

@Component({
  selector: 'usuario',
  standalone: true,
  imports: [RouterModule],
  templateUrl: './usuario.component.html'
})
export class UsuarioComponent implements OnInit {

  title: string = 'Listado de usuarios!';

  usuarios: Usuario[] = [];

  constructor(
    private service: Usuarioservice,
    private sharingData: SharingDataService,
    private router: Router) {
    if (this.router.getCurrentNavigation()?.extras.state) {
      this.usuarios = this.router.getCurrentNavigation()?.extras.state!['usuarios'];
    }
  }

  ngOnInit(): void {
    if (this.usuarios == undefined || this.usuarios == null || this.usuarios.length == 0) {
      console.log('consulta findAll')
      this.service.findAll().subscribe(usuarios => this.usuarios = usuarios);
    }
  }

  onRemoveusuario(id: number): void {
    this.sharingData.idusuarioEventEmitter.emit(id);
  }

  onSelectedusuario(usuario: Usuario): void {
    this.router.navigate(['/usuarios/edit', usuario.id]);
  }
}
