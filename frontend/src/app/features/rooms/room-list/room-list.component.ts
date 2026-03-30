import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { RoomService } from '@core/services/room.service';
import { ToastService } from '@core/services/toast.service';

@Component({
  selector: 'app-room-list',
  templateUrl: './room-list.component.html',
  styleUrls: ['./room-list.component.css']
})
export class RoomListComponent implements OnInit {
  rooms: any[] = [];
  loading = false;
  errorMessage = '';

  // Filters
  roomType = '';
  minPrice = '';
  maxPrice = '';
  isAvailable = 'true';

  roomTypes = ['Standard', 'Deluxe', 'Suite', 'Presidential'];

  /** Amenity → FontAwesome icon map and helpers (keeps template clean) */
  private amenityIconMap: Record<string, string> = {
    wifi: 'fa-wifi',
    tv: 'fa-tv',
    ac: 'fa-snowflake',
    restaurant: 'fa-utensils',
    parking: 'fa-parking',
    pool: 'fa-swimming-pool',
    gym: 'fa-dumbbell',
    spa: 'fa-spa',
    breakfast: 'fa-coffee',
    minibar: 'fa-wine-glass-alt'
  };

  getAmenityIcon(amenity: unknown): string {
    // Template values can be unknown when strictTemplates=true — coerce safely
    const raw = String(amenity || '').trim();
    if (!raw) return 'fa-circle';
    const key = raw.toLowerCase().replace(/[^a-z0-9]/g, '');
    return this.amenityIconMap[key] || 'fa-circle';
  }

  /** Safe short description (prevents rendering "null") */
  shortDescription(desc?: string, len = 110): string {
    if (!desc) return '';
    return desc.length > len ? desc.slice(0, len) + '…' : desc;
  }

  constructor(
    private roomService: RoomService,
    private router: Router,
    private toastService: ToastService
  ) { }

  getStarArray(rating: number): number[] {
    const r = Math.round(rating || 0);
    return Array(r).fill(0);
  }

  bookRoom(room: any): void {
    this.router.navigate(['/bookings/create', room._id]);
  }

  viewRoomDetails(roomId: string): void {
    this.router.navigate(['/rooms', roomId]);
  }

  ngOnInit(): void {
    this.loadRooms();
  }

  resolveImageUrl(img: any): string {
    if (!img) return '';
    let raw = typeof img === 'string' ? img : img.url;
    if (!raw) return '';

    // Repair malformed URLs missing slash between uploads and rooms
    raw = raw.replace(/uploadsrooms/gi, 'uploads/rooms');
    raw = raw.replace(/\\/g, '/');

    if (raw.startsWith('http')) return raw;

    const path = raw.startsWith('/uploads') ? raw : `/uploads/rooms/${raw}`;
    return `http://localhost:5000${path}`;
  }

  loadRooms(): void {
    this.loading = true;
    const filters = {
      roomType: this.roomType || undefined,
      minPrice: this.minPrice || undefined,
      maxPrice: this.maxPrice || undefined,
      isAvailable: this.isAvailable || undefined
    };

    this.roomService.getRooms(filters).subscribe({
      next: (response) => {
        this.rooms = response.data;
        this.loading = false;
      },
      error: (error) => {
        const msg = error.error?.message || 'Failed to load rooms';
        this.errorMessage = msg;
        this.toastService.error(msg, 'Room Search');
        this.loading = false;
      }
    });
  }

  onFilterChange(): void {
    this.loadRooms();
  }

  resetFilters(): void {
    this.roomType = '';
    this.minPrice = '';
    this.maxPrice = '';
    this.isAvailable = 'true';
    this.loadRooms();
  }
}
