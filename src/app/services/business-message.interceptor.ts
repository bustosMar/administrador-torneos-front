import { Injectable } from '@angular/core';
import {
  HttpEvent,
  HttpHandler,
  HttpErrorResponse,
  HttpInterceptor,
  HttpRequest,
} from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { BusinessMessageService } from './business-message.service';

@Injectable()
export class BusinessMessageInterceptor implements HttpInterceptor {
  constructor(private businessMessageService: BusinessMessageService) {}

  intercept(req: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {
    return next.handle(req).pipe(
      catchError((error: HttpErrorResponse) => {
        this.businessMessageService.showForError(error);
        return throwError(() => error);
      })
    );
  }
}