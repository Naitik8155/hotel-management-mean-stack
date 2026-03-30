import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { BookingService } from '@core/services/booking.service';
import { InvoiceService } from '@core/services/invoice.service';

@Component({
  selector: 'app-booking-success',
  templateUrl: './booking-success.component.html',
  styleUrls: ['./booking-success.component.css']
})
export class BookingSuccessComponent implements OnInit {
  booking: any = null;
  isLoading = true;
  errorMessage = '';
  isDownloadingInvoice = false;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private bookingService: BookingService,
    private invoiceService: InvoiceService
  ) {}

  ngOnInit(): void {
    this.route.queryParams.subscribe(params => {
      if (params['bookingId']) {
        this.loadBooking(params['bookingId']);
      } else {
        this.errorMessage = 'Booking ID not found';
        this.isLoading = false;
      }
    });
  }

  loadBooking(bookingId: string): void {
    this.bookingService.getBooking(bookingId).subscribe(
      (response) => {
        this.booking = response.data;
        this.isLoading = false;
      },
      (error) => {
        this.errorMessage = error.error?.message || 'Error loading booking details';
        this.isLoading = false;
      }
    );
  }

  downloadInvoice(): void {
    if (!this.booking || !this.booking._id) {
      alert('Booking information not available');
      return;
    }

    this.isDownloadingInvoice = true;
    
    // Generate invoice first
    this.invoiceService.generateInvoice(this.booking._id).subscribe(
      (response) => {
        if (response.success && response.data) {
          // Download the generated invoice
          this.invoiceService.downloadInvoice(response.data.filename);
          this.isDownloadingInvoice = false;
        } else {
          alert('Failed to generate invoice');
          this.isDownloadingInvoice = false;
        }
      },
      (error) => {
        console.error('Invoice generation error:', error);
        alert(error.error?.message || 'Failed to generate invoice. Please try again later.');
        this.isDownloadingInvoice = false;
      }
    );
  }

  navigateToHome(): void {
    this.router.navigate(['/home']);
  }

  formatDate(date: string | Date): string {
    return new Date(date).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  }
}
