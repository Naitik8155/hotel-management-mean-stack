import { Injectable } from '@angular/core';
import { CanActivate, ActivatedRouteSnapshot, RouterStateSnapshot, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

@Injectable({
  providedIn: 'root'
})
export class AdminGuard implements CanActivate {
  constructor(private authService: AuthService, private router: Router) {}

  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): boolean {
    // Check if user is authenticated
    if (!this.authService.isAuthenticated()) {
      console.warn('✗ Not authenticated, redirecting to admin login');
      this.router.navigate(['/admin/login'], { queryParams: { returnUrl: state.url } });
      return false;
    }

    // Get user from localStorage
    const userFromStorage = this.getUserFromLocalStorage();
    const userRole = userFromStorage?.role;

    console.log('Admin Guard Check:', {
      authenticated: true,
      userRole: userRole,
      userObject: userFromStorage
    });

    // Check if user has admin role
    if (userRole === 'admin') {
      console.log('✓ Admin access granted');
      return true;
    }

    // Not an admin - deny access
    console.warn('✗ Access denied - not an admin', {
      userRole: userRole
    });
    
    // Redirect based on role
    if (userRole === 'staff') {
      this.router.navigate(['/staff/dashboard']);
    } else {
      this.router.navigate(['/']);
    }
    
    return false;
  }

  private getUserFromLocalStorage() {
    try {
      const userData = localStorage.getItem('user');
      return userData ? JSON.parse(userData) : null;
    } catch (e) {
      console.error('Error parsing user data from localStorage', e);
      return null;
    }
  }
}
