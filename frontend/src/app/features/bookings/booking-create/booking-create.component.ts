import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { AuthService } from '@core/services/auth.service';
import { ToastService } from '@core/services/toast.service';

@Component({
  selector: 'app-booking-create',
  templateUrl: './booking-create.component.html',
  styleUrls: ['./booking-create.component.css']
})
export class BookingCreateComponent implements OnInit {
  roomId: string = '';
  room: any = null;
  bookingForm!: FormGroup;
  loading = false;
  submitting = false;
  errorMessage = '';

  minCheckIn: string = '';
  minCheckOut: string = '';

  totalNights = 0;
  subtotal = 0;
  taxAmount = 0;
  serviceCharge = 0;
  totalAmount = 0;

  TAX_RATE = 0.12; // 12% GST
  SERVICE_CHARGE_RATE = 0.05; // 5% service charge

  currentUser: any = null;

  private API_URL = 'https://hotel-management-backend-n59d.onrender.com/api';

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private fb: FormBuilder,
    private http: HttpClient,
    private authService: AuthService,
    private toastService: ToastService
  ) { }

  ngOnInit(): void {
    this.currentUser = this.authService.getCurrentUser();

    if (!this.currentUser) {
      this.router.navigate(['/auth/login'], { queryParams: { returnUrl: this.router.url } });
      return;
    }

    this.roomId = this.route.snapshot.paramMap.get('roomId') || '';
    this.setMinDates();
    this.initializeForm();
    this.loadRoom();
  }

  setMinDates(): void {
    const today = new Date();
    this.minCheckIn = today.toISOString().split('T')[0];

    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    this.minCheckOut = tomorrow.toISOString().split('T')[0];
  }

  initializeForm(): void {
    this.bookingForm = this.fb.group({
      checkInDate: ['', Validators.required],
      checkOutDate: ['', Validators.required],
      numberOfGuests: [1, [Validators.required, Validators.min(1)]],
      guestName: [this.currentUser?.name || '', Validators.required],
      guestEmail: [this.currentUser?.email || '', [Validators.required, Validators.email]],
      guestPhone: [this.currentUser?.phone || '', Validators.required],
      specialRequests: ['']
    });

    this.bookingForm.valueChanges.subscribe(() => {
      this.calculateTotal();
    });
  }

  loadRoom(): void {
    this.loading = true;
    this.http.get(`${this.API_URL}/rooms/${this.roomId}`).subscribe({
      next: (response: any) => {
        this.room = response.data;
        this.loading = false;
        this.calculateTotal();
      },
      error: (error) => {
        this.errorMessage = 'Failed to load room details';
        this.toastService.error(this.errorMessage, 'Booking System');
        this.loading = false;
      }
    });
  }

  calculateTotal(): void {
    const checkIn = this.bookingForm.get('checkInDate')?.value;
    const checkOut = this.bookingForm.get('checkOutDate')?.value;

    if (!checkIn || !checkOut || !this.room) {
      return;
    }

    const checkInDate = new Date(checkIn);
    const checkOutDate = new Date(checkOut);
    this.totalNights = Math.ceil((checkOutDate.getTime() - checkInDate.getTime()) / (1000 * 60 * 60 * 24));

    if (this.totalNights <= 0) {
      this.totalNights = 0;
      this.subtotal = 0;
      this.taxAmount = 0;
      this.serviceCharge = 0;
      this.totalAmount = 0;
      return;
    }

    this.subtotal = this.room.pricePerNight * this.totalNights;
    this.taxAmount = this.subtotal * this.TAX_RATE;
    this.serviceCharge = this.subtotal * this.SERVICE_CHARGE_RATE;
    this.totalAmount = this.subtotal + this.taxAmount + this.serviceCharge;
  }

  onCheckInChange(): void {
    const checkIn = this.bookingForm.get('checkInDate')?.value;
    if (checkIn) {
      const nextDay = new Date(checkIn);
      nextDay.setDate(nextDay.getDate() + 1);
      this.minCheckOut = nextDay.toISOString().split('T')[0];

      const currentCheckOut = this.bookingForm.get('checkOutDate')?.value;
      if (currentCheckOut && new Date(currentCheckOut) <= new Date(checkIn)) {
        this.bookingForm.patchValue({ checkOutDate: this.minCheckOut });
      }
    }
    this.calculateTotal();
  }

  createBooking(): void {
    if (this.bookingForm.invalid) {
      Object.keys(this.bookingForm.controls).forEach(key => {
        this.bookingForm.get(key)?.markAsTouched();
      });
      return;
    }

    if (this.totalNights <= 0) {
      this.errorMessage = 'Check-out date must be after check-in date';
      this.toastService.warning(this.errorMessage, 'Invalid Dates');
      return;
    }

    const numberOfGuests = this.bookingForm.get('numberOfGuests')?.value;
    if (numberOfGuests > this.room.maxGuests) {
      this.errorMessage = `Maximum ${this.room.maxGuests} guests allowed for this room`;
      this.toastService.warning(this.errorMessage, 'Capacity Exceeded');
      return;
    }

    this.submitting = true;
    this.errorMessage = '';

    const bookingData = {
      room: this.roomId,
      checkInDate: this.bookingForm.get('checkInDate')?.value,
      checkOutDate: this.bookingForm.get('checkOutDate')?.value,
      numberOfGuests: numberOfGuests,
      guestDetails: {
        name: this.bookingForm.get('guestName')?.value,
        email: this.bookingForm.get('guestEmail')?.value,
        phone: this.bookingForm.get('guestPhone')?.value
      },
      specialRequests: this.bookingForm.get('specialRequests')?.value,
      totalPrice: this.totalAmount,
      paymentStatus: 'pending'
    };

    this.http.post(`${this.API_URL}/bookings`, bookingData).subscribe({
      next: (response: any) => {
        this.toastService.success('Booking recorded. Proceeding to payment...', 'Success');
        this.router.navigate(['/bookings/payment', response.data._id]);
      },
      error: (error) => {
        this.errorMessage = error.error?.message || 'Failed to create booking';
        this.toastService.error(this.errorMessage, 'Booking Error');
        this.submitting = false;
      }
    });
  }

  resolveImageUrl(img: any): string {
    if (!img) return '';
    let raw = typeof img === 'string' ? img : (img.url || img);
    if (!raw) return '';

    // Repair malformed URLs
    raw = String(raw).replace(/uploadsrooms/gi, 'uploads/rooms');
    raw = raw.replace(/\\/g, '/');

    if (raw.startsWith('http')) return raw;

    const path = raw.startsWith('/uploads') ? raw : `/uploads/rooms/${raw}`;
    return `http://localhost:5000${path}`;
  }

  goBack(): void {
    this.router.navigate(['/rooms', this.roomId]);
  }
}
