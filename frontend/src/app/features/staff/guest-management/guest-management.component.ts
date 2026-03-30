import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { ToastService } from '../../../core/services/toast.service';

interface Guest {
  _id: string;
  name: string;
  email: string;
  phone: string;
  idType?: string;
  idNumber?: string;
  address?: string;
  currentBooking?: {
    _id: string;
    bookingNumber: string;
    room: {
      roomNumber: string;
      roomType: string;
    };
    checkInDate: string;
    checkOutDate: string;
    bookingStatus: string;
  };
  bookingHistory: any[];
  totalBookings: number;
  isVerified?: boolean;
}

@Component({
  selector: 'app-guest-management',
  templateUrl: './guest-management.component.html',
  styleUrls: ['./guest-management.component.css']
})
export class GuestManagementComponent implements OnInit {
  guests: Guest[] = [];
  filteredGuests: Guest[] = [];
  loading = true;

  // Filters
  searchQuery = '';
  stayStatusFilter = '';

  // Selected guest for details
  selectedGuest: Guest | null = null;
  showGuestDetailsModal = false;

  constructor(
    private http: HttpClient,
    private toastService: ToastService
  ) { }

  ngOnInit(): void {
    this.loadGuests();
  }

  loadGuests() {
    this.loading = true;
    const apiUrl = 'https://hotel-management-backend-n59d.onrender.com/api/staff';
    this.http.get<any>(`${apiUrl}/guests`).subscribe({
      next: (response) => {
        this.guests = response.data || [];
        this.filteredGuests = [...this.guests];
        this.loading = false;
        console.log('Guests loaded:', this.guests);
      },
      error: (error) => {
        console.error('Error loading guests:', error);
        this.loading = false;
      }
    });
  }

  applyFilters() {
    this.filteredGuests = this.guests.filter(guest => {
      const matchesSearch = !this.searchQuery ||
        guest.name?.toLowerCase().includes(this.searchQuery.toLowerCase()) ||
        guest.email?.toLowerCase().includes(this.searchQuery.toLowerCase()) ||
        guest.phone?.toLowerCase().includes(this.searchQuery.toLowerCase());

      let matchesStatus: boolean = true;
      if (this.stayStatusFilter === 'active') {
        matchesStatus = !!(guest.currentBooking && guest.currentBooking.bookingStatus === 'checked-in');
      } else if (this.stayStatusFilter === 'upcoming') {
        matchesStatus = !!(guest.currentBooking && guest.currentBooking.bookingStatus === 'confirmed');
      } else if (this.stayStatusFilter === 'past') {
        matchesStatus = !guest.currentBooking || guest.currentBooking.bookingStatus === 'completed';
      }

      return matchesSearch && matchesStatus;
    });
  }

  onSearchChange() {
    this.applyFilters();
  }

  onStatusFilterChange() {
    this.applyFilters();
  }

  openGuestDetails(guest: Guest) {
    this.selectedGuest = guest;
    this.loadGuestDetails(guest._id);
    this.showGuestDetailsModal = true;
  }

  closeGuestDetails() {
    this.showGuestDetailsModal = false;
    this.selectedGuest = null;
  }

  loadGuestDetails(guestId: string) {
    const apiUrl = 'https://hotel-management-backend-n59d.onrender.com/api/staff';
    this.http.get<any>(`${apiUrl}/guests/${guestId}`).subscribe({
      next: (response) => {
        this.selectedGuest = response.data;
        console.log('Guest details loaded:', this.selectedGuest);
      },
      error: (error) => {
        console.error('Error loading guest details:', error);
      }
    });
  }

  verifyGuest(guest: Guest) {
    if (!confirm(`Verify identity for ${guest.name}?`)) return;

    const apiUrl = 'https://hotel-management-backend-n59d.onrender.com/api/staff';
    this.http.put(`${apiUrl}/guests/${guest._id}/verify`, { verified: true }).subscribe({
      next: (response) => {
        this.toastService.success('Guest identity has been verified successfully', 'Verification Success');
        this.loadGuests();
        if (this.selectedGuest?._id === guest._id) {
          this.loadGuestDetails(guest._id);
        }
      },
      error: (error) => {
        console.error('Error verifying guest:', error);
        this.toastService.error(error.error?.message || 'Failed to verify guest', 'Verification Error');
      }
    });
  }

  getStayStatus(guest: Guest): string {
    if (guest.currentBooking) {
      if (guest.currentBooking.bookingStatus === 'checked-in') {
        return 'Currently Staying';
      } else if (guest.currentBooking.bookingStatus === 'confirmed') {
        return 'Upcoming';
      }
    }
    return 'Past Guest';
  }

  getStayStatusClass(guest: Guest): string {
    const status = this.getStayStatus(guest);
    if (status === 'Currently Staying') return 'badge-success';
    if (status === 'Upcoming') return 'badge-warning';
    return 'badge-secondary';
  }

  formatDate(date: string): string {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  }

  getBookingStatusBadgeClass(status: string): string {
    const statusMap: { [key: string]: string } = {
      'confirmed': 'badge-success',
      'pending': 'badge-warning',
      'cancelled': 'badge-danger',
      'completed': 'badge-info',
      'checked-in': 'badge-primary'
    };
    return statusMap[status?.toLowerCase()] || 'badge-secondary';
  }
}
