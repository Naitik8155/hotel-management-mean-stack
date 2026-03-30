import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AnalyticsService {
  private API_URL = 'https://hotel-management-backend-n59d.onrender.com/api/analytics';

  constructor(private http: HttpClient) { }

  getDashboardAnalytics(startDate?: string, endDate?: string): Observable<any> {
    let url = `${this.API_URL}/dashboard`;
    const params: any = {};
    
    if (startDate) params.startDate = startDate;
    if (endDate) params.endDate = endDate;

    return this.http.get(url, { params });
  }

  getBookingAnalytics(period: string = 'month'): Observable<any> {
    return this.http.get(`${this.API_URL}/bookings`, {
      params: { period }
    });
  }

  getPaymentAnalytics(): Observable<any> {
    return this.http.get(`${this.API_URL}/payments`);
  }

  getOccupancyAnalytics(month?: string): Observable<any> {
    const params: any = {};
    if (month) params.month = month;

    return this.http.get(`${this.API_URL}/occupancy`, { params });
  }
}
