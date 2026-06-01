import { EventEmitter, Injectable } from '@angular/core';
import { Usuario } from '../models/usuario';

@Injectable({
  providedIn: 'root'
})
export class SharingDataService {

  private _newusuarioEventEmitter: EventEmitter<Usuario> = new EventEmitter();

  private _idusuarioEventEmitter = new EventEmitter();

  private _findusuarioByIdEventEmitter = new EventEmitter();

  private _selectusuarioEventEmitter = new EventEmitter();

  constructor() { }

  get selectusuarioEventEmitter() {
    return this._selectusuarioEventEmitter;
  }
  
  get findusuarioByIdEventEmitter() {
    return this._findusuarioByIdEventEmitter
  }

  get newusuarioEventEmitter(): EventEmitter<Usuario> {
    return this._newusuarioEventEmitter;
  }

  get idusuarioEventEmitter(): EventEmitter<number>{
    return this._idusuarioEventEmitter;
  }

}
