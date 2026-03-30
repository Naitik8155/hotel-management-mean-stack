import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { BookingService } from '@core/services/booking.service';
import { PaymentService } from '@core/services/payment.service';
import { ToastService } from '@core/services/toast.service';

@Component({
  selector: 'app-booking-detail',
  templateUrl: './booking-detail.component.html',
  styleUrls: ['./booking-detail.component.css']
})
export class BookingDetailComponent implements OnInit {
  booking: any;
  loading = false;
  errorMessage = '';
  showCancelModal = false;
  cancelReason = '';
  isCancelling = false;
  successMessage = '';
  today = new Date();

  resolveImageUrl(img: any): string {
    if (!img) return '';
    const raw = typeof img === 'string' ? img : (img.url || img);
    if (!raw) return '';
    const fixed = String(raw).replace(/uploadsrooms/gi, 'uploads/rooms').replace(/\\/g, '/');
    if (fixed.startsWith('http')) return fixed;
    const path = fixed.startsWith('/uploads') ? fixed : `/uploads/rooms/${fixed}`;
    return `http://localhost:5000${path}`;
  }

  canCancel(): boolean {
    if (!this.booking) return false;
    const status = this.booking.bookingStatus?.toLowerCase();
    return status !== 'checked-in' && status !== 'checked-out' && status !== 'cancelled' && status !== 'failed';
  }

  constructor(
    private bookingService: BookingService,
    private paymentService: PaymentService,
    private route: ActivatedRoute,
    private router: Router,
    private toastService: ToastService
  ) { }

  ngOnInit(): void {
    const bookingId = this.route.snapshot.paramMap.get('id');
    if (bookingId) {
      this.loadBooking(bookingId);
    }
  }

  loadBooking(id: string): void {
    this.loading = true;
    this.bookingService.getBooking(id).subscribe({
      next: (response) => {
        this.booking = response.data;
        this.loading = false;
      },
      error: (error) => {
        const msg = error.error?.message || 'Failed to load booking';
        this.errorMessage = msg;
        this.toastService.error(msg, 'Booking Error');
        this.loading = false;
      }
    });
  }

  initiatePayment(): void {
    this.paymentService.createPaymentOrder(this.booking._id).subscribe({
      next: (response) => {
        // Razorpay integration would happen here
        this.toastService.info('Secure Payment Gateway is being initialized...', 'Payment Gateway');
      },
      error: (error) => {
        this.toastService.error(error.error?.message || 'Payment initiation failed', 'Payment Error');
      }
    });
  }

  cancelBooking(): void {
    if (this.isCancelling) return;
    if (!this.cancelReason || this.cancelReason.trim().length === 0) {
      this.showError('Please provide a cancellation reason');
      return;
    }

    this.isCancelling = true;

    this.bookingService.cancelBooking(this.booking._id, this.cancelReason).subscribe({
      next: (response) => {
        this.showSuccess('Booking cancelled successfully');
        // Optimistically update UI without navigating away
        if (this.booking) {
          this.booking.bookingStatus = 'cancelled';
        }
        this.showCancelModal = false;
        this.isCancelling = false;
      },
      error: (error) => {
        this.showError(error.error?.message || 'Cancellation failed');
        this.isCancelling = false;
      }
    });
  }

  showSuccess(message: string): void {
    this.toastService.success(message, 'Success');
  }

  showError(message: string): void {
    this.toastService.error(message, 'Error');
  }

  navigateToBookings(): void {
    this.router.navigate(['/bookings']);
  }
}
