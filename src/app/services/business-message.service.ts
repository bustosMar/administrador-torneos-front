import { Injectable } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import Swal from 'sweetalert2';

interface ControlledErrorMessage {
  match: string;
  title: string;
  text: string;
  icon: 'error' | 'warning' | 'info';
}

@Injectable({
  providedIn: 'root'
})
export class BusinessMessageService {
  private readonly messages: ControlledErrorMessage[] = [
    {
      match: 'La huella capturada no corresponde a ningún jugador de este partido',
      title: 'Huella no reconocida',
      text: 'La huella no corresponde a un jugador de este partido.',
      icon: 'error'
    },
    {
      match: 'La huella corresponde a un jugador del otro equipo del partido',
      title: 'Equipo incorrecto',
      text: 'La huella pertenece a un jugador del otro equipo.',
      icon: 'warning'
    },
    {
      match: 'El jugador está suspendido para la fecha de este partido',
      title: 'Jugador suspendido',
      text: 'No se puede registrar la presencia de un jugador suspendido en esta fecha.',
      icon: 'warning'
    },
    {
      match: 'El equipo seleccionado no pertenece al partido indicado',
      title: 'Equipo inválido',
      text: 'El equipo seleccionado no pertenece a este partido.',
      icon: 'error'
    },
    {
      match: 'Uno de los jugadores no está ligado a los equipos de este partido',
      title: 'Jugador no válido',
      text: 'Uno de los jugadores seleccionados no pertenece a los equipos del partido.',
      icon: 'error'
    },
    {
      match: 'No hay jugadores pendientes para guardar',
      title: 'Sin jugadores pendientes',
      text: 'No hay jugadores pendientes para guardar.',
      icon: 'info'
    },
    {
      match: 'No existe el partido con id',
      title: 'Partido no encontrado',
      text: 'No se encontró el partido solicitado.',
      icon: 'error'
    },
    {
      match: 'No se encontró el jugador a registrar',
      title: 'Jugador no encontrado',
      text: 'No se encontró el jugador que se intenta registrar.',
      icon: 'error'
    },
    {
      match: 'La huella de verificación recibida no es válida',
      title: 'Huella inválida',
      text: 'La muestra de huella recibida no es válida.',
      icon: 'error'
    },
    {
      match: 'Debe indicar el equipo para registrar la presencia',
      title: 'Equipo requerido',
      text: 'Selecciona el equipo antes de registrar la presencia.',
      icon: 'warning'
    },
    {
      match: 'No se recibió una huella válida para registrar la presencia',
      title: 'Huella requerida',
      text: 'No se recibió una huella válida para registrar la presencia.',
      icon: 'warning'
    },
    {
      match: 'Usuario, contraseña o clave incorrectos',
      title: 'Acceso rechazado',
      text: 'El usuario, la contraseña o la clave son incorrectos.',
      icon: 'error'
    },
    {
      match: 'Usuario o contraseña incorrectos',
      title: 'Acceso rechazado',
      text: 'El usuario o la contraseña son incorrectos.',
      icon: 'error'
    },
    {
      match: 'El tipo de sanción es obligatorio',
      title: 'Sanción inválida',
      text: 'Debes indicar un tipo de sanción válido.',
      icon: 'warning'
    },
    {
      match: 'Tipo de sanción inválido',
      title: 'Sanción inválida',
      text: 'Solo se permite una sanción roja o amarilla.',
      icon: 'warning'
    },
    {
      match: 'no tiene fecha de nacimiento registrada',
      title: 'Datos incompletos',
      text: 'El jugador no tiene fecha de nacimiento registrada.',
      icon: 'warning'
    },
    {
      match: 'no está activa en este torneo',
      title: 'Categoría no disponible',
      text: 'La categoría no está activa en este torneo.',
      icon: 'warning'
    },
    {
      match: 'Jugador no puede jugar en la categoría',
      title: 'Categoría no válida',
      text: 'El jugador no cumple los requisitos de edad de la categoría.',
      icon: 'warning'
    }
  ];

  showForError(error: HttpErrorResponse): void {
    const rawMessage = this.extractMessage(error.error);

    if (!rawMessage) {
      return;
    }

    const configuredMessage = this.messages.find(item => rawMessage.includes(item.match));

    if (!configuredMessage) {
      return;
    }

    void Swal.fire({
      title: configuredMessage.title,
      text: configuredMessage.text,
      icon: configuredMessage.icon,
      confirmButtonText: 'Aceptar'
    });
  }

  private extractMessage(response: unknown): string | null {
    if (!response || typeof response !== 'object') {
      return null;
    }

    const body = response as {
      mensaje?: unknown;
      message?: unknown;
      mensajeSuspension?: unknown;
    };
    const message = body.mensaje ?? body.message ?? body.mensajeSuspension;

    return typeof message === 'string' ? message : null;
  }
}