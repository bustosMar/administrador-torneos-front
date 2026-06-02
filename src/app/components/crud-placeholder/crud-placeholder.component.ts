import { Component } from '@angular/core';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'crud-placeholder',
  standalone: true,
  template: `
    <div class="card shadow-sm">
      <div class="card-body">
        <h3 class="card-title">CRUD de {{ entityName }}</h3>
        <p class="card-text">
          Aquí irá la implementación del CRUD para {{ entityName }}. Basado en el diseño del CRUD de usuarios.
        </p>
      </div>
    </div>
  `
})
export class CrudPlaceholderComponent {
  entityName = this.route.snapshot.data['entity'] ?? 'Entidad';

  constructor(private route: ActivatedRoute) {}
}
