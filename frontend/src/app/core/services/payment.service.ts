import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class PaymentService {
  private API_URL = 'https://hotel-management-backend-n59d.onrender.com/api/payments';

  constructor(private http: HttpClient) {}

  createPaymentOrder(bookingId: string): Observable<any> {
    return this.http.post<any>(`${this.API_URL}/create`, { bookingId });
  }

  verifyPayment(paymentData: any): Observable<any> {
    return this.http.post<any>(`${this.API_URL}/verify`, paymentData);
  }

  getPayment(id: string): Observable<any> {
    return this.http.get<any>(`${this.API_URL}/${id}`);
  }

  getAllPayments(filters?: any): Observable<any> {
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

  processRefund(paymentId: string, refundData: any): Observable<any> {
    return this.http.post<any>(`${this.API_URL}/${paymentId}/refund`, refundData);
  }
}
