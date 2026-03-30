import { Injectable } from '@angular/core';
import { CanActivate, ActivatedRouteSnapshot, RouterStateSnapshot, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

@Injectable({
  providedIn: 'root'
})
export class StaffGuard implements CanActivate {
  constructor(private authService: AuthService, private router: Router) {}

  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): boolean {
    // Check if user is authenticated
    if (!this.authService.isAuthenticated()) {
      console.warn('✗ Not authenticated, redirecting to staff login');
      this.router.navigate(['/staff/login'], { queryParams: { returnUrl: state.url } });
      return false;
    }

    // Get user from localStorage
    const userFromStorage = this.getUserFromLocalStorage();
    const userRole = userFromStorage?.role;

    console.log('Staff Guard Check:', {
      authenticated: true,
      userRole: userRole,
      userObject: userFromStorage
    });

    // Check if user has staff or admin role (admin can access staff pages)
    if (userRole === 'staff' || userRole === 'admin') {
      console.log('✓ Staff access granted');
      return true;
    }

    // Not staff or admin - deny access
    console.warn('✗ Access denied - not staff or admin', {
      userRole: userRole
    });
    
    // Redirect to home
    this.router.navigate(['/']);
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
