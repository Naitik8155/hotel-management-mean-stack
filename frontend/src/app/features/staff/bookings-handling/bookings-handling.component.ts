import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { HttpClient } from '@angular/common/http';

interface Booking {
  _id: string;
  bookingNumber: string;
  user: {
    _id: string;
    name: string;
    email: string;
    phone: string;
  };
  room: {
    _id: string;
    roomNumber: string;
    roomType: string;
    pricePerNight: number;
  };
  checkInDate: string;
  checkOutDate: string;
  bookingStatus: string;
  totalAmount: number;
  numberOfGuests: number;
  paymentStatus: string;
  specialRequests?: string;
}

interface Room {
  _id: string;
  roomNumber: string;
  roomType: string;
  pricePerNight: number;
  isAvailable: boolean;
}

@Component({
  selector: 'app-bookings-handling',
  templateUrl: './bookings-handling.component.html',
  styleUrls: ['./bookings-handling.component.css']
})
export class BookingsHandlingComponent implements OnInit {
  bookings: Booking[] = [];
  filteredBookings: Booking[] = [];
  rooms: Room[] = [];
  loading = true;

  // Filters
  statusFilter = '';
  searchQuery = '';

  // Modals
  showAssignRoomModal = false;
  showAddServiceModal = false;
  showUpdateStatusModal = false;

  // Forms
  assignRoomForm!: FormGroup;
  addServiceForm!: FormGroup;
  updateStatusForm!: FormGroup;

  // Selected booking
  selectedBooking: Booking | null = null;

  constructor(
    private http: HttpClient,
    private fb: FormBuilder
  ) { }

  ngOnInit(): void {
    this.initForms();
    this.loadBookings();
    this.loadRooms();
  }

  initForms() {
    this.assignRoomForm = this.fb.group({
      roomId: ['', Validators.required]
    });

    this.addServiceForm = this.fb.group({
      serviceName: ['', Validators.required],
      servicePrice: ['', [Validators.required, Validators.min(0)]],
      description: ['']
    });

    this.updateStatusForm = this.fb.group({
      status: ['', Validators.required],
      notes: ['']
    });
  }

  loadBookings() {
    this.loading = true;
    const apiUrl = 'https://hotel-management-backend-n59d.onrender.com/api/staff';
    this.http.get<any>(`${apiUrl}/bookings`).subscribe({
      next: (response) => {
        this.bookings = response.data || [];
        this.filteredBookings = [...this.bookings];
        this.loading = false;
        console.log('Bookings loaded:', this.bookings);
      },
      error: (error) => {
        console.error('Error loading bookings:', error);
        this.loading = false;
      }
    });
  }

  loadRooms() {
    const apiUrl = 'https://hotel-management-backend-n59d.onrender.com/api/staff';
    this.http.get<any>(`${apiUrl}/rooms`).subscribe({
      next: (response) => {
        this.rooms = response.data || [];
        console.log('Rooms loaded:', this.rooms);
      },
      error: (error) => {
        console.error('Error loading rooms:', error);
      }
    });
  }

  applyFilters() {
    this.filteredBookings = this.bookings.filter(booking => {
      const matchesStatus = !this.statusFilter || booking.bookingStatus === this.statusFilter;
      const matchesSearch = !this.searchQuery ||
        booking.user?.name?.toLowerCase().includes(this.searchQuery.toLowerCase()) ||
        booking.bookingNumber?.toLowerCase().includes(this.searchQuery.toLowerCase()) ||
        booking.room?.roomNumber?.toLowerCase().includes(this.searchQuery.toLowerCase());

      return matchesStatus && matchesSearch;
    });
  }

  onStatusFilterChange() {
    this.applyFilters();
  }

  onSearchChange() {
    this.applyFilters();
  }

  openAssignRoomModal(booking: Booking) {
    this.selectedBooking = booking;
    this.showAssignRoomModal = true;
    this.assignRoomForm.reset();
  }

  closeAssignRoomModal() {
    this.showAssignRoomModal = false;
    this.selectedBooking = null;
  }

  assignRoom() {
    if (this.assignRoomForm.invalid || !this.selectedBooking) return;

    const { roomId } = this.assignRoomForm.value;
    const apiUrl = 'https://hotel-management-backend-n59d.onrender.com/api/staff';

    this.http.put(`${apiUrl}/bookings/${this.selectedBooking._id}/assign-room`, { roomId }).subscribe({
      next: (response) => {
        console.log('Room assigned successfully');
        alert('Room assigned successfully!');
        this.closeAssignRoomModal();
        this.loadBookings();
      },
      error: (error) => {
        console.error('Error assigning room:', error);
        alert(error.error?.message || 'Failed to assign room');
      }
    });
  }

  openAddServiceModal(booking: Booking) {
    this.selectedBooking = booking;
    this.showAddServiceModal = true;
    this.addServiceForm.reset();
  }

  closeAddServiceModal() {
    this.showAddServiceModal = false;
    this.selectedBooking = null;
  }

  addService() {
    if (this.addServiceForm.invalid || !this.selectedBooking) return;

    const serviceData = this.addServiceForm.value;
    const apiUrl = 'https://hotel-management-backend-n59d.onrender.com/api'; // Add service might still be in old place or needs update

    // Check if add-service is in staff controller or bookingRoutes
    this.http.post(`${apiUrl}/bookings/${this.selectedBooking._id}/add-service`, serviceData).subscribe({
      next: (response) => {
        console.log('Service added successfully');
        alert('Service added successfully!');
        this.closeAddServiceModal();
        this.loadBookings();
      },
      error: (error) => {
        console.error('Error adding service:', error);
        alert(error.error?.message || 'Failed to add service');
      }
    });
  }

  openUpdateStatusModal(booking: Booking) {
    this.selectedBooking = booking;
    this.showUpdateStatusModal = true;
    this.updateStatusForm.patchValue({
      status: booking.bookingStatus
    });
  }

  closeUpdateStatusModal() {
    this.showUpdateStatusModal = false;
    this.selectedBooking = null;
  }

  updateStatus() {
    if (this.updateStatusForm.invalid || !this.selectedBooking) return;

    const { status, notes } = this.updateStatusForm.value;
    const apiUrl = 'https://hotel-management-backend-n59d.onrender.com/api/staff';

    this.http.put(`${apiUrl}/bookings/${this.selectedBooking._id}/status`, { status, notes }).subscribe({
      next: (response) => {
        console.log('Status updated successfully');
        alert('Status updated successfully!');
        this.closeUpdateStatusModal();
        this.loadBookings();
      },
      error: (error) => {
        console.error('Error updating status:', error);
        alert(error.error?.message || 'Failed to update status');
      }
    });
  }

  getStatusBadgeClass(status: string): string {
    const statusMap: { [key: string]: string } = {
      'confirmed': 'badge-success',
      'pending': 'badge-warning',
      'cancelled': 'badge-danger',
      'completed': 'badge-info',
      'checked-in': 'badge-primary',
      'checked-out': 'badge-dark'
    };
    return statusMap[status?.toLowerCase()] || 'badge-secondary';
  }

  formatDate(date: string): string {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  }

  getAvailableRooms(): Room[] {
    return this.rooms.filter(room => room.isAvailable);
  }
}
