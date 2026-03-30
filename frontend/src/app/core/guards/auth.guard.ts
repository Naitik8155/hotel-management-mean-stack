import { Injectable } from '@angular/core';
import { CanActivate, ActivatedRouteSnapshot, RouterStateSnapshot, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

@Injectable({
  providedIn: 'root'
})
export class AuthGuard implements CanActivate {
  constructor(private authService: AuthService, private router: Router) {}

  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): boolean {
    // Check token first
    if (!this.authService.isAuthenticated()) {
      console.warn('✗ Not authenticated, redirecting to login');
      this.router.navigate(['/auth/login'], { queryParams: { returnUrl: state.url } });
      return false;
    }

    // Check for required roles (can be 'role' or 'roles' in data)
    const requiredRoles = route.data['roles'] || route.data['role'];

    // If no role required, allow access
    if (!requiredRoles) {
      console.log('✓ No role required, access granted');
      return true;
    }

    // Get user from localStorage as fallback
    const userFromStorage = this.getUserFromLocalStorage();
    const userRole = userFromStorage?.role;

    // Ensure requiredRoles is an array
    const rolesArray = Array.isArray(requiredRoles) ? requiredRoles : [requiredRoles];

    console.log('Auth Guard Check:', {
      authenticated: true,
      userRole: userRole,
      requiredRoles: rolesArray,
      userObject: userFromStorage
    });

    // Check if role matches
    if (userRole && rolesArray.includes(userRole)) {
      console.log('✓ User role matches required role, access granted');
      return true;
    }

    // Role mismatch - deny access
    console.warn('✗ Access denied - role mismatch', {
      userRole: userRole,
      requiredRoles: rolesArray
    });
    
    // Redirect based on user role
    if (userRole === 'admin') {
      this.router.navigate(['/admin/dashboard']);
    } else if (userRole === 'staff') {
      this.router.navigate(['/staff/dashboard']);
    } else {
      this.router.navigate(['/']);
    }
    return false;
  }

  private getUserFromLocalStorage(): any {
    const user = localStorage.getItem('currentUser');
    return user ? JSON.parse(user) : null;
  }
}
