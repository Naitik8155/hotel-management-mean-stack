import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class RoomService {
  private API_URL = 'https://hotel-management-backend-n59d.onrender.com/api/rooms';

  constructor(private http: HttpClient) {}

  getRooms(filters?: any): Observable<any> {
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

  getRoom(id: string): Observable<any> {
    return this.http.get<any>(`${this.API_URL}/${id}`);
  }

  createRoom(roomData: any): Observable<any> {
    return this.http.post<any>(this.API_URL, roomData);
  }

  updateRoom(id: string, roomData: any): Observable<any> {
    return this.http.put<any>(`${this.API_URL}/${id}`, roomData);
  }

  deleteRoom(id: string): Observable<any> {
    return this.http.delete<any>(`${this.API_URL}/${id}`);
  }

  deleteRoomImage(roomId: string, imageIndex: number): Observable<any> {
    return this.http.delete<any>(`${this.API_URL}/${roomId}/images/${imageIndex}`);
  }
}
