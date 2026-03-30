import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { ToastService } from '@core/services/toast.service';

declare var Razorpay: any;

@Component({
  selector: 'app-booking-payment',
  templateUrl: './booking-payment.component.html',
  styleUrls: ['./booking-payment.component.css']
})
export class BookingPaymentComponent implements OnInit {
  bookingId: string = '';
  booking: any = null;
  loading = false;
  processing = false;
  errorMessage = '';

  private API_URL = 'https://hotel-management-backend-n59d.onrender.com/api';

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private http: HttpClient,
    private toastService: ToastService
  ) { }

  ngOnInit(): void {
    this.bookingId = this.route.snapshot.paramMap.get('bookingId') || '';
    this.loadBooking();
  }

  loadBooking(): void {
    this.loading = true;
    this.http.get(`${this.API_URL}/bookings/${this.bookingId}`).subscribe({
      next: (response: any) => {
        this.booking = response.data;
        this.loading = false;
      },
      error: (error) => {
        this.errorMessage = 'Failed to load booking details';
        this.toastService.error(this.errorMessage, 'Payment Error');
        this.loading = false;
      }
    });
  }

  initiatePayment(): void {
    this.processing = true;
    this.errorMessage = '';

    // Create order on backend
    this.http.post(`${this.API_URL}/payments/create-order`, {
      bookingId: this.bookingId
    }).subscribe({
      next: (response: any) => {
        if (response.success) {
          this.toastService.info('Redirecting to secure payment...', 'Secure Payment');
          this.openRazorpay(response.data);
        } else {
          this.errorMessage = response.message || 'Failed to create payment order';
          this.toastService.error(this.errorMessage, 'Order Error');
          this.processing = false;
        }
      },
      error: (error) => {
        console.error('Payment initiation error:', error);
        this.errorMessage = error.error?.message || 'Failed to initiate payment';
        this.toastService.error(this.errorMessage, 'Initiation Failed');
        this.processing = false;
      }
    });
  }

  openRazorpay(orderData: any): void {
    const options = {
      key: orderData.key, // Get key from backend response
      amount: orderData.amount * 100, // Amount in paise
      currency: orderData.currency,
      name: 'Hotel Management System',
      description: `Booking #${this.booking?.bookingNumber || this.booking?._id || orderData.booking?.bookingId || ''}`,
      order_id: orderData.orderId,
      handler: (response: any) => {
        this.verifyPayment(response, orderData.paymentId);
      },
      prefill: {
        name: `${this.booking?.guestDetails?.firstName || ''} ${this.booking?.guestDetails?.lastName || ''}`.trim() ||
          orderData.booking?.guestDetails?.firstName || '',
        email: this.booking?.guestDetails?.email || orderData.booking?.guestDetails?.email || '',
        contact: this.booking?.guestDetails?.phone || orderData.booking?.guestDetails?.phone || ''
      },
      theme: {
        color: '#4a90e2'
      },
      modal: {
        ondismiss: () => {
          this.processing = false;
          this.toastService.warning('Payment was cancelled by user', 'Payment Status');
        }
      }
    };

    const razorpay = new Razorpay(options);
    razorpay.open();
  }

  verifyPayment(paymentResponse: any, paymentId: string): void {
    this.http.post(`${this.API_URL}/payments/verify`, {
      paymentId: paymentId,
      razorpayOrderId: paymentResponse.razorpay_order_id,
      razorpayPaymentId: paymentResponse.razorpay_payment_id,
      razorpaySignature: paymentResponse.razorpay_signature
    }).subscribe({
      next: (response: any) => {
        if (response.success) {
          this.toastService.success('Payment verified successfully!', 'Payment Success');
          this.router.navigate(['/bookings/success'], {
            queryParams: { bookingId: this.bookingId }
          });
        } else {
          this.errorMessage = response.message || 'Payment verification failed';
          this.toastService.error(this.errorMessage, 'Verification Error');
          this.processing = false;
        }
      },
      error: (error) => {
        console.error('Payment verification error:', error);
        this.errorMessage = error.error?.message || 'Payment verification failed';
        this.toastService.error(this.errorMessage, 'Network Error');
        this.processing = false;
      }
    });
  }

  payLater(): void {
    this.processing = true;
    // Update booking to pay-at-hotel
    this.http.post(`${this.API_URL}/bookings/${this.bookingId}/pay-at-hotel`, {}).subscribe({
      next: (response: any) => {
        if (response.success) {
          this.toastService.success('Booking confirmed. Please pay at the front desk.', 'Success');
          this.router.navigate(['/bookings/success'], {
            queryParams: { bookingId: this.bookingId }
          });
        } else {
          this.errorMessage = response.message || 'Payment verification failed';
          this.toastService.error(this.errorMessage, 'Verification Error');
          this.processing = false;
        }
      },
      error: (error) => {
        console.error('Pay later error:', error);
        this.errorMessage = error.error?.message || 'Failed to update booking';
        this.toastService.error(this.errorMessage, 'Update Error');
        this.processing = false;
      }
    });
  }

  goBack(): void {
    this.router.navigate(['/bookings']);
  }
}
