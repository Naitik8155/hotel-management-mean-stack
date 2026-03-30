import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface ContactMessage {
  name: string;
  email: string;
  phone: string;
  subject: string;
  message: string;
}

@Injectable({
  providedIn: 'root'
})
export class ContactService {
  private apiUrl = 'https://hotel-management-backend-n59d.onrender.com/api/contact'; // Updated to use full backend URL

  constructor(private http: HttpClient) { }

  sendContactMessage(data: ContactMessage): Observable<any> {
    return this.http.post(`${this.apiUrl}/send`, data);
  }

  getContactInfo(): Observable<any> {
    return this.http.get(`${this.apiUrl}/info`);
  }

  getAllContacts(): Observable<any[]> {
    return this.http.get<any[]>(this.apiUrl);
  }

  getContactById(id: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/${id}`);
  }

  updateContactStatus(id: string, status: string): Observable<any> {
    return this.http.put(`${this.apiUrl}/${id}/status`, { status });
  }

  sendContactResponse(id: string, responseMessage: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/${id}/response`, { responseMessage });
  }
}
