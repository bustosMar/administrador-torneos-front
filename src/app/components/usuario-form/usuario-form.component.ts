import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { FormsModule, NgForm } from '@angular/forms';
import { Usuario } from '../../models/usuario';
import { SharingDataService } from '../../services/sharing-data.service';
import { ActivatedRoute, Router } from '@angular/router';
import { Usuarioservice } from '../../services/usuario.service';

@Component({
  selector: 'usuario-form',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './usuario-form.component.html'
})
export class UsuarioFormComponent implements OnInit {

  usuario: Usuario;

  constructor(
    private route: ActivatedRoute,
    private sharingData: SharingDataService,
    private service: Usuarioservice) {
    this.usuario = new Usuario();
  }

  ngOnInit(): void {

    this.sharingData.selectusuarioEventEmitter.subscribe(usuario => this.usuario = usuario);

    this.route.paramMap.subscribe(params => {
      const id: number = +(params.get('id') || '0');

      if (id > 0) {
        this.sharingData.findusuarioByIdEventEmitter.emit(id);
        // this.service.findById(id).subscribe(usuario => this.usuario = usuario);
      }
    });
  }

  onSubmit(usuarioForm: NgForm): void {
    if (usuarioForm.valid) {
      this.sharingData.newusuarioEventEmitter.emit(this.usuario);
      console.log(this.usuario);
    }
    usuarioForm.reset();
    usuarioForm.resetForm();
  }

  onClear(usuarioForm: NgForm): void {
    this.usuario = new Usuario();
    usuarioForm.reset();
    usuarioForm.resetForm();
  }

}
