import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { BookingService } from '@core/services/booking.service';
import { AuthService } from '@core/services/auth.service';
import { InvoiceService } from '@core/services/invoice.service';
import { ToastService } from '@core/services/toast.service';

@Component({
  selector: 'app-user-dashboard',
  templateUrl: './user-dashboard.component.html',
  styleUrls: ['./user-dashboard.component.css']
})
export class UserDashboardComponent implements OnInit {
  upcomingBookings: any[] = [];
  pastBookings: any[] = [];
  currentUser: any = null;
  isLoading = false;

  constructor(
    private bookingService: BookingService,
    private authService: AuthService,
    private invoiceService: InvoiceService,
    private router: Router,
    private toastService: ToastService
  ) { }

  ngOnInit(): void {
    this.getCurrentUser();
    this.loadBookings();
  }

  getCurrentUser(): void {
    this.authService.currentUser$.subscribe((user) => {
      this.currentUser = user;
    });
  }

  loadBookings(): void {
    this.isLoading = true;
    this.bookingService.getUserBookings().subscribe(
      (response) => {
        const allBookings = response.data || [];
        const now = new Date();

        this.upcomingBookings = allBookings.filter((booking: any) => {
          return new Date(booking.checkInDate) >= now;
        }).sort((a: any, b: any) => {
          return new Date(a.checkInDate).getTime() - new Date(b.checkInDate).getTime();
        });

        this.pastBookings = allBookings.filter((booking: any) => {
          return new Date(booking.checkInDate) < now;
        }).sort((a: any, b: any) => {
          return new Date(b.checkInDate).getTime() - new Date(a.checkInDate).getTime();
        });

        this.isLoading = false;
      },
      (error) => {
        console.error('Error loading bookings:', error);
        this.isLoading = false;
      }
    );
  }

  cancelBooking(bookingId: string): void {
    if (confirm('Are you sure you want to cancel this booking?')) {
      const reason = 'User requested cancellation';
      this.bookingService.cancelBooking(bookingId, reason).subscribe(
        () => {
          this.toastService.success('Booking cancelled successfully', 'Cancellation');
          this.loadBookings();
        },
        (error: any) => {
          this.toastService.error('Error cancelling booking: ' + (error?.message || 'Unknown error'), 'Cancellation Failed');
        }
      );
    }
  }

  // holds bookingId that's currently being generated/downloaded
  downloadingInvoiceId: string | null = null;

  downloadInvoice(bookingId: string): void {
    if (!bookingId) {
      this.toastService.error('Booking information not available', 'Invoice Error');
      return;
    }

    if (this.downloadingInvoiceId) return;
    this.downloadingInvoiceId = bookingId;

    this.invoiceService.generateInvoice(bookingId).subscribe(
      (response: any) => {
        const filename = response?.data?.filename;
        if (filename) {
          this.toastService.success('Invoice generated successfully. Downloading...', 'Invoice');
          this.invoiceService.downloadInvoice(filename);
        } else {
          this.toastService.error('Failed to generate invoice', 'Invoice Error');
        }
        this.downloadingInvoiceId = null;
      },
      (error: any) => {
        console.error('Invoice generation error:', error);
        this.toastService.error(error?.error?.message || 'Failed to generate invoice. Please try again later.', 'Invoice Error');
        this.downloadingInvoiceId = null;
      }
    );
  }

  getStatusClass(status: string): string {
    const statusMap: { [key: string]: string } = {
      'Pending': 'badge-warning',
      'Confirmed': 'badge-success',
      'Checked-in': 'badge-info',
      'Checked-out': 'badge-secondary',
      'Cancelled': 'badge-danger'
    };
    return statusMap[status] || 'badge-secondary';
  }

  getPaymentStatusClass(status: string): string {
    const s = String(status || '').toLowerCase();
    if (s === 'paid' || s === 'completed') return 'bg-success text-white';
    if (s === 'pending') return 'bg-warning text-dark';
    return 'bg-secondary text-white';
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/auth/login']);
  }

  formatDate(date: string | Date): string {
    return new Date(date).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  }
}
