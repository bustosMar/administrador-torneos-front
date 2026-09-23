import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, CanActivate, Router, UrlTree } from '@angular/router';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root'
})
export class RoleGuard implements CanActivate {

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  canActivate(route: ActivatedRouteSnapshot): boolean | UrlTree {
    const allowedRoles: string[] | undefined = route.data?.['roles'];

    if (!allowedRoles || !allowedRoles.length) {
      return true;
    }

    const userRoles = this.authService.getRoles();
    const tieneAcceso = allowedRoles.some(role => this.authService.hasRole(role));

    if (tieneAcceso) {
      return true;
    }

    return this.router.parseUrl('/dashboard');
  }
}
