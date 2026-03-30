import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class InvoiceService {
  private API_URL = 'https://hotel-management-backend-n59d.onrender.com/api/invoices';

  constructor(private http: HttpClient) { }

  generateInvoice(bookingId: string): Observable<any> {
    return this.http.post(`${this.API_URL}`, { bookingId });
  }

  downloadInvoice(filename: string): void {
    window.open(`${this.API_URL}/download/${filename}`, '_blank');
  }

  getUserInvoices(): Observable<any> {
    return this.http.get(`${this.API_URL}/user`);
  }

  getInvoice(invoiceId: string): Observable<any> {
    return this.http.get(`${this.API_URL}/${invoiceId}`);
  }
}
