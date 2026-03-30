import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class BookingService {
  private API_URL = 'https://hotel-management-backend-n59d.onrender.com/api/bookings';

  constructor(private http: HttpClient) {}

  createBooking(bookingData: any): Observable<any> {
    return this.http.post<any>(this.API_URL, bookingData);
  }

  getUserBookings(): Observable<any> {
    return this.http.get<any>(`${this.API_URL}/user/my-bookings`);
  }

  getBooking(id: string): Observable<any> {
    return this.http.get<any>(`${this.API_URL}/${id}`);
  }

  cancelBooking(id: string, reason: string): Observable<any> {
    return this.http.post<any>(`${this.API_URL}/${id}/cancel`, { cancelReason: reason });
  }

  getAllBookings(filters?: any): Observable<any> {
    let params = new HttpParams();
    if (filters) {
      Object.keys(filters).forEach(key => {
        if (filters[key] !== null && filters[key] !== undefined) {
          params = params.set(key, filters[key]);
        }
      });
    }
    return this.http.get<any>(this.API_URL, { params });
  }

  updateBookingStatus(id: string, statusData: any): Observable<any> {
    return this.http.put<any>(`${this.API_URL}/${id}`, statusData);
  }
}
