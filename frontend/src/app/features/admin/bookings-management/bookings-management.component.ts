import { Component, OnInit } from '@angular/core';
import { BookingService } from '@core/services/booking.service';
import { RoomService } from '@core/services/room.service';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { InvoiceService } from '@core/services/invoice.service';

@Component({
  selector: 'app-bookings-management',
  templateUrl: './bookings-management.component.html',
  styleUrls: ['./bookings-management.component.css']
})
export class BookingsManagementComponent implements OnInit {
  // Data Properties
  bookings: any[] = [];
  filteredBookings: any[] = [];
  rooms: any[] = [];

  // Form Properties
  statusForm!: FormGroup;
  roomAssignForm!: FormGroup;

  // Modal Properties
  showDetailsModal = false;
  showStatusModal = false;
  showRoomAssignModal = false;
  showRefundModal = false;
  selectedBooking: any = null;

  // Filter Properties
  searchTerm = '';
  selectedStatus = '';
  selectedPaymentStatus = '';
  dateRangeStart = '';
  dateRangeEnd = '';

  // UI Properties
  isLoading = false;
  isSaving = false;
  successMessage = '';
  errorMessage = '';

  // Status Options
  bookingStatuses = ['pending', 'confirmed', 'checked-in', 'checked-out', 'cancelled'];
  paymentStatuses = ['pending', 'completed', 'failed', 'refunded'];

  constructor(
    private bookingService: BookingService,
    private roomService: RoomService,
    private invoiceService: InvoiceService,
    private fb: FormBuilder
  ) { }

  ngOnInit(): void {
    this.initializeForms();
    this.loadBookings();
    this.loadRooms();
  }

  // Form Initialization
  initializeForms(): void {
    this.statusForm = this.fb.group({
      status: ['', Validators.required],
      notes: ['']
    });

    this.roomAssignForm = this.fb.group({
      roomId: ['', Validators.required]
    });
  }

  // Data Loading
  loadBookings(): void {
    this.isLoading = true;
    this.bookingService.getAllBookings().subscribe(
      (response) => {
        this.bookings = (response.data || []).sort((a: any, b: any) => {
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        });
        this.filterBookings();
        this.isLoading = false;
      },
      (error) => {
        this.showError('Error loading bookings');
        this.isLoading = false;
      }
    );
  }

  loadRooms(): void {
    this.roomService.getRooms().subscribe(
      (response) => {
        this.rooms = response.data || [];
      },
      (error) => {
        console.error('Error loading rooms:', error);
      }
    );
  }

  // Filtering
  filterBookings(): void {
    this.filteredBookings = this.bookings.filter(booking => {
      const matchesSearch =
        booking.bookingNumber.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        booking.guestName.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        booking.guestEmail.toLowerCase().includes(this.searchTerm.toLowerCase());

      const matchesStatus = !this.selectedStatus || booking.status === this.selectedStatus;
      const matchesPayment = !this.selectedPaymentStatus || booking.paymentStatus === this.selectedPaymentStatus;

      let matchesDate = true;
      if (this.dateRangeStart || this.dateRangeEnd) {
        const checkIn = new Date(booking.checkInDate);
        if (this.dateRangeStart && checkIn < new Date(this.dateRangeStart)) matchesDate = false;
        if (this.dateRangeEnd && checkIn > new Date(this.dateRangeEnd)) matchesDate = false;
      }

      return matchesSearch && matchesStatus && matchesPayment && matchesDate;
    });
  }

  resetFilters(): void {
    this.searchTerm = '';
    this.selectedStatus = '';
    this.selectedPaymentStatus = '';
    this.dateRangeStart = '';
    this.dateRangeEnd = '';
    this.filterBookings();
  }

  // Statistics
  getTotalRevenue(): number {
    return this.filteredBookings.reduce((sum, b) => {
      if (b.paymentStatus === 'completed') {
        return sum + (b.totalAmount || 0);
      }
      return sum;
    }, 0);
  }

  getPendingBookings(): number {
    return this.filteredBookings.filter(b => b.status === 'pending').length;
  }

  getConfirmedBookings(): number {
    return this.filteredBookings.filter(b => b.status === 'confirmed').length;
  }

  getCheckedInCount(): number {
    return this.filteredBookings.filter(b => b.status === 'checked-in').length;
  }

  // Booking Actions
  viewDetails(booking: any): void {
    this.selectedBooking = booking;
    this.showDetailsModal = true;
  }

  closeDetailsModal(): void {
    this.showDetailsModal = false;
    this.selectedBooking = null;
  }

  openStatusModal(booking: any): void {
    this.selectedBooking = booking;
    this.statusForm.patchValue({ status: booking.status });
    this.showStatusModal = true;
  }

  closeStatusModal(): void {
    this.showStatusModal = false;
    this.statusForm.reset();
  }

  updateStatus(): void {
    if (this.statusForm.invalid || !this.selectedBooking) {
      this.showError('Please select a status');
      return;
    }

    this.isSaving = true;
    const data = {
      bookingStatus: this.statusForm.value.status,
      notes: this.statusForm.value.notes
    };

    this.bookingService.updateBookingStatus(this.selectedBooking._id, data).subscribe(
      () => {
        this.showSuccess(`Booking status updated to ${data.bookingStatus}`);
        this.closeStatusModal();
        this.loadBookings();
        this.isSaving = false;
      },
      (error: any) => {
        this.showError(error?.error?.message || 'Error updating booking status');
        this.isSaving = false;
      }
    );
  }

  // Quick Actions
  confirmBooking(booking: any): void {
    if (!booking._id) return;
    this.isSaving = true;
    this.bookingService.updateBookingStatus(booking._id, { bookingStatus: 'confirmed' }).subscribe(
      () => {
        this.showSuccess('Booking confirmed successfully');
        this.loadBookings();
        this.isSaving = false;
      },
      (error) => {
        this.showError('Failed to confirm booking');
        this.isSaving = false;
      }
    );
  }

  checkInBooking(booking: any): void {
    if (!booking._id) return;
    this.isSaving = true;
    this.bookingService.updateBookingStatus(booking._id, { bookingStatus: 'checked-in' }).subscribe(
      () => {
        this.showSuccess('Guest checked in successfully');
        this.loadBookings();
        this.isSaving = false;
      },
      (error) => {
        this.showError('Failed to check in guest');
        this.isSaving = false;
      }
    );
  }

  checkOutBooking(booking: any): void {
    if (!booking._id) return;
    this.isSaving = true;
    this.bookingService.updateBookingStatus(booking._id, { bookingStatus: 'checked-out' }).subscribe(
      () => {
        this.showSuccess('Guest checked out successfully');
        this.loadBookings();
        this.isSaving = false;
      },
      (error) => {
        this.showError('Failed to check out guest');
        this.isSaving = false;
      }
    );
  }

  openRoomAssignModal(booking: any): void {
    this.selectedBooking = booking;
    this.roomAssignForm.reset();
    this.showRoomAssignModal = true;
  }

  closeRoomAssignModal(): void {
    this.showRoomAssignModal = false;
    this.roomAssignForm.reset();
  }

  assignRoom(): void {
    if (this.roomAssignForm.invalid || !this.selectedBooking) {
      this.showError('Please select a room');
      return;
    }

    this.isSaving = true;
    const data = {
      roomId: this.roomAssignForm.get('roomId')?.value,
      status: 'confirmed'
    };

    this.bookingService.updateBookingStatus(this.selectedBooking._id, data).subscribe(
      () => {
        this.showSuccess('Room assigned successfully');
        this.closeRoomAssignModal();
        this.loadBookings();
        this.isSaving = false;
      },
      (error: any) => {
        this.showError('Error assigning room');
        this.isSaving = false;
      }
    );
  }

  openRefundModal(booking: any): void {
    if (booking.paymentStatus !== 'completed') {
      this.showError('Only completed payments can be refunded');
      return;
    }
    this.selectedBooking = booking;
    this.showRefundModal = true;
  }

  closeRefundModal(): void {
    this.showRefundModal = false;
    this.selectedBooking = null;
  }

  processRefund(): void {
    if (!this.selectedBooking) return;

    this.isSaving = true;
    const data = { 
      paymentStatus: 'refunded',
      bookingStatus: 'cancelled', // Usually a refund implies cancellation
      notes: 'Refund processed by Admin'
    };

    this.bookingService.updateBookingStatus(this.selectedBooking._id, data).subscribe(
      () => {
        this.showSuccess('Refund processed and booking cancelled');
        this.closeRefundModal();
        this.showDetailsModal = false; // Close details too if open
        this.loadBookings();
        this.isSaving = false;
      },
      (error: any) => {
        this.showError(error?.error?.message || 'Error processing refund');
        this.isSaving = false;
      }
    );
  }

  markAsPaid(booking: any): void {
    if (!booking._id) return;
    this.isSaving = true;
    this.bookingService.updateBookingStatus(booking._id, { paymentStatus: 'completed' }).subscribe(
      () => {
        this.showSuccess('Payment marked as completed');
        this.loadBookings();
        this.isSaving = false;
      },
      (error) => {
        this.showError('Failed to update payment status');
        this.isSaving = false;
      }
    );
  }

  downloadInvoice(booking: any): void {
    if (!booking || !booking._id) {
      this.showError('Booking data not available');
      return;
    }

    this.isSaving = true; // Use isSaving to show a loading state if desired
    this.invoiceService.generateInvoice(booking._id).subscribe(
      (response: any) => {
        const filename = response?.data?.filename;
        if (filename) {
          this.invoiceService.downloadInvoice(filename);
          this.showSuccess('Invoice generated and download started');
        } else {
          this.showError('Failed to generate invoice file');
        }
        this.isSaving = false;
      },
      (error: any) => {
        console.error('Invoice generation error:', error);
        this.showError(error?.error?.message || 'Invoice generation failed');
        this.isSaving = false;
      }
    );
  }

  // Helper Methods
  getRoomName(booking: any): string {
    if (!booking) return 'N/A';

    // Case 1: roomId is a populated object
    if (booking.roomId && typeof booking.roomId === 'object') {
      return booking.roomId.roomNumber || 'N/A';
    }

    // Case 2: roomId is an ID, find in rooms array
    if (booking.roomId && typeof booking.roomId === 'string') {
      const room = this.rooms.find(r => r._id === booking.roomId);
      if (room) return room.roomNumber;
    }

    // Case 3: Flat property
    return booking.roomNumber || 'Awaiting Allocation';
  }

  formatDate(date: string): string {
    return new Date(date).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: '2-digit'
    });
  }

  calculateNights(checkIn: string, checkOut: string): number {
    const start = new Date(checkIn);
    const end = new Date(checkOut);
    return Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
  }

  // Notification Methods
  showSuccess(message: string): void {
    this.successMessage = message;
    setTimeout(() => {
      this.successMessage = '';
    }, 4000);
  }

  showError(message: string): void {
    this.errorMessage = message;
    setTimeout(() => {
      this.errorMessage = '';
    }, 4000);
  }
}
