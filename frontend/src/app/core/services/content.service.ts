import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_CONFIG } from '../config/api.config';

@Injectable({
  providedIn: 'root'
})
export class ContentService {
  private apiUrl = `${API_CONFIG.baseUrl}/content`;

  constructor(private http: HttpClient) { }

  // Get all banners for homepage (active only)
  getBanners(): Observable<any> {
    return this.http.get(`${this.apiUrl}/banners`);
  }

  // Get all banners including inactive (admin)
  getAllBanners(): Observable<any> {
    return this.http.get(`${this.apiUrl}/admin/banners`);
  }

  // Get single banner
  getBanner(id: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/banners/${id}`);
  }

  // Create banner (admin)
  createBanner(bannerData: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/banners`, bannerData);
  }

  // Update banner (admin)
  updateBanner(id: string, bannerData: any): Observable<any> {
    return this.http.put(`${this.apiUrl}/banners/${id}`, bannerData);
  }

  // Delete banner (admin)
  deleteBanner(id: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/banners/${id}`);
  }

  // Get published testimonials
  getTestimonials(): Observable<any> {
    return this.http.get(`${this.apiUrl}/testimonials`);
  }

  // Create testimonial (user)
  createTestimonial(testimonialData: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/testimonials`, testimonialData);
  }

  // Get hotel details
  getHotelDetails(): Observable<any> {
    return this.http.get(`${this.apiUrl}/hotel`);
  }

  // Get featured rooms
  getFeaturedRooms(): Observable<any> {
    return this.http.get(`${this.apiUrl}/featured-rooms`);
  }
}
