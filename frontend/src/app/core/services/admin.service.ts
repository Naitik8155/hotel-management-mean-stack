import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AdminService {
  private API_URL = 'https://hotel-management-backend-n59d.onrender.com/api/admin';

  constructor(private http: HttpClient) { }

  getDashboardStats(): Observable<any> {
    return this.http.get<any>(`${this.API_URL}/stats/dashboard`);
  }

  getAllUsers(filters?: any): Observable<any> {
    let params = new HttpParams();
    if (filters) {
      Object.keys(filters).forEach(key => {
        if (filters[key] !== null && filters[key] !== undefined) {
          params = params.set(key, filters[key]);
        }
      });
    }
    return this.http.get<any>(`${this.API_URL}/users`, { params });
  }

  updateUserStatus(userId: string, isActive: boolean): Observable<any> {
    return this.http.put<any>(`${this.API_URL}/users/${userId}/status`, { isActive });
  }

  updateUserRole(userId: string, role: string): Observable<any> {
    return this.http.put<any>(`${this.API_URL}/users/${userId}/role`, { role });
  }

  deleteUser(userId: string): Observable<any> {
    return this.http.delete<any>(`${this.API_URL}/users/${userId}`);
  }

  // Staff Management Methods
  getAllStaff(filters?: any): Observable<any> {
    let params = new HttpParams();
    if (filters) {
      Object.keys(filters).forEach(key => {
        if (filters[key] !== null && filters[key] !== undefined) {
          params = params.set(key, filters[key]);
        }
      });
    }
    return this.http.get<any>(`${this.API_URL}/staff`, { params });
  }

  createStaff(staffData: any): Observable<any> {
    return this.http.post<any>(`${this.API_URL}/staff`, staffData);
  }

  updateStaff(staffId: string, staffData: any): Observable<any> {
    return this.http.put<any>(`${this.API_URL}/staff/${staffId}`, staffData);
  }

  deleteStaff(staffId: string): Observable<any> {
    return this.http.delete<any>(`${this.API_URL}/staff/${staffId}`);
  }

  // Payment Management Methods
  getAllPayments(filters?: any): Observable<any> {
    let params = new HttpParams();
    if (filters) {
      Object.keys(filters).forEach(key => {
        if (filters[key] !== null && filters[key] !== undefined) {
          params = params.set(key, filters[key]);
        }
      });
    }
    return this.http.get<any>('https://hotel-management-backend-n59d.onrender.com/api/payments', { params });
  }

  processRefund(paymentId: string, refundData?: any): Observable<any> {
    return this.http.post<any>(`https://hotel-management-backend-n59d.onrender.com/api/payments/${paymentId}/refund`, refundData || {});
  }

  getHotelDetails(): Observable<any> {
    return this.http.get<any>(`${this.API_URL}/hotel/details`);
  }

  updateHotelDetails(hotelData: any): Observable<any> {
    return this.http.put<any>(`${this.API_URL}/hotel/details`, hotelData);
  }

  getRevenueReport(filters?: any): Observable<any> {
    let params = new HttpParams();
    if (filters) {
      Object.keys(filters).forEach(key => {
        if (filters[key] !== null && filters[key] !== undefined) {
          params = params.set(key, filters[key]);
        }
      });
    }
    return this.http.get<any>(`${this.API_URL}/reports/revenue`, { params });
  }

  getOccupancyReport(filters?: any): Observable<any> {
    let params = new HttpParams();
    if (filters) {
      Object.keys(filters).forEach(key => {
        if (filters[key] !== null && filters[key] !== undefined) {
          params = params.set(key, filters[key]);
        }
      });
    }
    return this.http.get<any>(`${this.API_URL}/reports/occupancy`, { params });
  }
}
