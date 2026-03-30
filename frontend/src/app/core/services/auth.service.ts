import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, throwError } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { Router } from '@angular/router';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private API_URL = 'https://hotel-management-backend-n59d.onrender.com/api/auth';
  private currentUserSubject = new BehaviorSubject<any>(this.getUserFromLocalStorage());
  public currentUser$ = this.currentUserSubject.asObservable();
  private tokenSubject = new BehaviorSubject<string | null>(localStorage.getItem('token'));
  public token$ = this.tokenSubject.asObservable();
  private refreshTokenTimeout?: any;
  private readonly TOKEN_REFRESH_INTERVAL = 14 * 60 * 1000;

  constructor(private http: HttpClient, private router: Router) {
    if (this.isAuthenticated()) {
      this.startTokenRefresh();
    }
  }

  register(userData: any): Observable<any> {
    return this.http.post(`${this.API_URL}/register`, userData).pipe(
      map((response: any) => {
        if (response.token) {
          this.setAuthData(response.token, response.user);
        }
        return response;
      })
    );
  }

  login(email: string, password: string): Observable<any> {
    return this.http.post(`${this.API_URL}/login`, { email, password }).pipe(
      map((response: any) => {
        if (response.token && response.user) {
          console.log('Login successful - storing user:', response.user);
          this.setAuthData(response.token, response.user);
          this.startTokenRefresh();
        }
        return response;
      })
    );
  }

  logout(): void {
    this.stopTokenRefresh();
    this.clearAuthData();
    const currentUrl = this.router.url;
    if (currentUrl.includes('/admin')) {
      this.router.navigate(['/admin/login']);
    } else if (currentUrl.includes('/staff')) {
      this.router.navigate(['/staff/login']);
    } else {
      this.router.navigate(['/auth/login']);
    }
  }

  logoutFromAllDevices(): Observable<any> {
    return this.http.post(`${this.API_URL}/logout-all`, {}).pipe(
      map((response) => {
        this.logout();
        return response;
      })
    );
  }

  refreshToken(): Observable<any> {
    const token = this.getToken();
    if (!token) {
      return throwError(() => new Error('No token available'));
    }

    return this.http.post(`${this.API_URL}/refresh-token`, { token }).pipe(
      map((response: any) => {
        if (response.token) {
          localStorage.setItem('token', response.token);
          this.tokenSubject.next(response.token);
          console.log('✓ Token refreshed successfully');
        }
        return response;
      }),
      catchError((error) => {
        console.error('Token refresh failed:', error);
        this.logout();
        return throwError(() => error);
      })
    );
  }

  getLoginHistory(): Observable<any> {
    return this.http.get(`${this.API_URL}/login-history`);
  }

  getSessionInfo(): any {
    const loginTime = localStorage.getItem('loginTime');
    const user = this.getCurrentUser();
    if (!loginTime || !user) {
      return null;
    }
    return {
      loginTime: new Date(loginTime),
      user: user,
      sessionDuration: Date.now() - new Date(loginTime).getTime()
    };
  }

  private startTokenRefresh(): void {
    this.stopTokenRefresh();
    this.refreshTokenTimeout = setInterval(() => {
      if (this.isAuthenticated()) {
        this.refreshToken().subscribe({
          next: () => console.log('Auto token refresh successful'),
          error: (err) => console.error('Auto token refresh failed:', err)
        });
      } else {
        this.stopTokenRefresh();
      }
    }, this.TOKEN_REFRESH_INTERVAL);
    console.log('✓ Token refresh started');
  }

  private stopTokenRefresh(): void {
    if (this.refreshTokenTimeout) {
      clearInterval(this.refreshTokenTimeout);
      this.refreshTokenTimeout = null;
      console.log('✓ Token refresh stopped');
    }
  }

  private setAuthData(token: string, user: any): void {
    localStorage.setItem('token', token);
    localStorage.setItem('currentUser', JSON.stringify(user));
    localStorage.setItem('user', JSON.stringify(user));
    localStorage.setItem('loginTime', new Date().toISOString());
    this.tokenSubject.next(token);
    this.currentUserSubject.next(user);
  }

  private clearAuthData(): void {
    localStorage.removeItem('token');
    localStorage.removeItem('currentUser');
    localStorage.removeItem('user');
    localStorage.removeItem('loginTime');
    this.tokenSubject.next(null);
    this.currentUserSubject.next(null);
  }

  isAuthenticated(): boolean {
    return !!localStorage.getItem('token');
  }

  getCurrentUser(): any {
    let user = this.currentUserSubject.value;
    if (!user) {
      user = this.getUserFromLocalStorage();
    }
    if (user) {
      return { ...user, role: user.role || 'user' };
    }
    return null;
  }

  getToken(): string | null {
    return localStorage.getItem('token');
  }

  getUserProfile(): Observable<any> {
    return this.http.get(`${this.API_URL}/profile`);
  }

  updateUserProfile(profileData: any): Observable<any> {
    return this.http.put(`${this.API_URL}/profile`, profileData).pipe(
      map((response: any) => {
        if (response.data) {
          localStorage.setItem('currentUser', JSON.stringify(response.data));
          this.currentUserSubject.next(response.data);
        }
        return response;
      })
    );
  }

  changePassword(passwordData: any): Observable<any> {
    return this.http.put(`${this.API_URL}/change-password`, passwordData);
  }

  deleteUserProfile(): Observable<any> {
    return this.http.delete(`${this.API_URL}/profile`);
  }

  uploadProfilePicture(file: File): Observable<any> {
    const formData = new FormData();
    formData.append('profilePicture', file);
    return this.http.post(`${this.API_URL}/profile/picture`, formData);
  }

  updateCurrentUser(user: any): void {
    this.currentUserSubject.next(user);
    localStorage.setItem('currentUser', JSON.stringify(user));
  }

  resetPassword(token: string, password: string): Observable<any> {
    return this.http.post(`${this.API_URL}/reset-password/${token}`, { password });
  }

  private getUserFromLocalStorage(): any {
    const user = localStorage.getItem('currentUser');
    return user ? JSON.parse(user) : null;
  }
}
