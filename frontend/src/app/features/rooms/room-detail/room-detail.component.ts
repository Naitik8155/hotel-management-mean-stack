import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { RoomService } from '@core/services/room.service';
import { BookingService } from '@core/services/booking.service';
import { AuthService } from '@core/services/auth.service';
import { ToastService } from '@core/services/toast.service';

@Component({
  selector: 'app-room-detail',
  templateUrl: './room-detail.component.html',
  styleUrls: ['./room-detail.component.css']
})
export class RoomDetailComponent implements OnInit {
  room: any;
  loading = false;
  errorMessage = '';
  currentImageIndex = 0;
  isAuthenticated = false;
  showBookingForm = false;

  // Booking form
  checkInDate = '';
  checkOutDate = '';
  numberOfGuests = 1;
  guestDetails = {
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    address: ''
  };
  specialRequests = '';

  constructor(
    private roomService: RoomService,
    private bookingService: BookingService,
    private authService: AuthService,
    private route: ActivatedRoute,
    private router: Router,
    private toastService: ToastService
  ) { }

  // If the route contains ?openBooking=true we'll open the booking form after the room loads
  private openBookingRequested = false;

  ngOnInit(): void {
    this.isAuthenticated = this.authService.isAuthenticated();

    // Watch for query param that requests automatic booking view
    this.route.queryParams.subscribe(params => {
      this.openBookingRequested = params['openBooking'] === 'true' || params['openBooking'] === true || params['openBooking'] === '1';
    });

    const roomId = this.route.snapshot.paramMap.get('id');
    if (roomId) {
      this.loadRoom(roomId);
    }
  }

  loadRoom(id: string): void {
    this.loading = true;
    this.roomService.getRoom(id).subscribe({
      next: (response) => {
        this.room = response.data;
        this.loading = false;

        // honor ?openBooking=true after the room has loaded
        if (this.openBookingRequested) {
          // small timeout to ensure template rendered before scrolling
          setTimeout(() => this.scrollToBookingForm(), 120);
        }
      },
      error: (error) => {
        const msg = error.error?.message || 'Failed to load room';
        this.errorMessage = msg;
        this.toastService.error(msg, 'Room Error');
        this.loading = false;
      }
    });
  }

  nextImage(): void {
    if (this.room?.images?.length) {
      this.currentImageIndex = (this.currentImageIndex + 1) % this.room.images.length;
    }
  }

  prevImage(): void {
    if (this.room?.images?.length) {
      this.currentImageIndex = (this.currentImageIndex - 1 + this.room.images.length) % this.room.images.length;
    }
  }

  /** Select specific image (thumb click) */
  selectImage(index: number): void {
    if (!this.room?.images?.length) return;
    this.currentImageIndex = Math.max(0, Math.min(index, this.room.images.length - 1));
  }

  /** Resolve image object/string to absolute URL (same logic used elsewhere) */
  resolveImageUrl(img: any): string {
    if (!img) return '';
    const raw = typeof img === 'string' ? img : img.url || img;
    if (!raw) return '';
    const fixed = String(raw).replace(/uploadsrooms/gi, 'uploads/rooms').replace(/\\/g, '/');
    if (fixed.startsWith('http')) return fixed;
    const path = fixed.startsWith('/uploads') ? fixed : `/uploads/rooms/${fixed}`;
    return `http://localhost:5000${path}`;
  }

  /** Amenity icon helper (safe) */
  getAmenityIcon(amenity: unknown): string {
    const map: Record<string, string> = {
      wifi: 'fa-wifi',
      tv: 'fa-tv',
      ac: 'fa-snowflake',
      restaurant: 'fa-utensils',
      parking: 'fa-parking',
      pool: 'fa-swimming-pool'
    };
    const key = String(amenity || '').toLowerCase().replace(/[^a-z0-9]/g, '');
    return map[key] || 'fa-circle';
  }

  getStarArray(rating: number): number[] {
    return Array(Math.round(rating)).fill(1);
  }

  /** Computed - use room.rating or fallback to null */
  get averageRating(): number | null {
    const r = this.room?.rating;
    if (!r) return null;
    return Math.round((Number(r) + Number.EPSILON) * 10) / 10;
  }

  get reviewsCount(): number {
    return this.room?.reviews?.length || 0;
  }

  /** Small sample review when real reviews missing */
  get sampleReview() {
    if (this.room?.reviews?.length) return this.room.reviews[0];
    return { guestName: 'S. Gupta', rating: 5, comment: 'Lovely stay — spotless and excellent service.' };
  }

  /** Short professional description (fallback) */
  get professionalDescription(): string {
    if (this.room?.description) return this.room.description;
    return `${this.room?.roomType || 'Room'} with premium amenities, complimentary breakfast and reliable high-speed WiFi — ideal for business and leisure travelers.`;
  }

  /** Return an array [1..n] for number-of-guests selects — safe for strictTemplates */
  guestsRange(maxGuests: unknown, cap = 10): number[] {
    const n = Math.max(1, Math.floor(Number(maxGuests) || 1));
    const length = Math.min(n, cap);
    return Array.from({ length }, (_, i) => i + 1);
  }

  bookRoom(): void {
    if (!this.isAuthenticated) {
      this.router.navigate(['/auth/login'], { queryParams: { returnUrl: this.router.url } });
      return;
    }
    // Navigate to booking creation page
    this.router.navigate(['/bookings/create', this.room._id]);
  }

  scrollToBookingForm(): void {
    const el = document.querySelector('[name="miniCheckIn"]') || document.querySelector('#checkIn');
    if (el) (el as HTMLElement).scrollIntoView({ behavior: 'smooth', block: 'center' });
    this.showBookingForm = true;
  }

  scrollToReviews(): void {
    const el = document.querySelector('.review-preview');
    if (el) (el as HTMLElement).scrollIntoView({ behavior: 'smooth', block: 'center' });
  }

  submitBooking(): void {
    if (!this.checkInDate || !this.checkOutDate) {
      this.toastService.warning('Please select check-in and check-out dates', 'Incomplete Form');
      return;
    }

    const bookingData = {
      roomId: this.room._id,
      checkInDate: this.checkInDate,
      checkOutDate: this.checkOutDate,
      numberOfGuests: this.numberOfGuests,
      guestDetails: this.guestDetails,
      specialRequests: this.specialRequests
    };

    this.bookingService.createBooking(bookingData).subscribe({
      next: (response) => {
        this.toastService.success('Your reservation has been created!', 'Booking Successful');
        this.router.navigate(['/bookings']);
      },
      error: (error) => {
        this.toastService.error(error.error?.message || 'Booking failed', 'Reservation Error');
      }
    });
  }
}
