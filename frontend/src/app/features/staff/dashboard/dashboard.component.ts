import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';

interface DashboardStats {
  todayCheckIns: number;
  todayCheckOuts: number;
  availableRooms: number;
  occupiedRooms: number;
  totalGuests: number;
}

interface Booking {
  _id: string;
  user: {
    name: string;
    email: string;
    phone: string;
  };
  room: {
    roomNumber: string;
    roomType: string;
  };
  checkInDate: string;
  checkOutDate: string;
  bookingStatus: string;
  totalAmount: number;
}

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent implements OnInit {
  stats: DashboardStats = {
    todayCheckIns: 0,
    todayCheckOuts: 0,
    availableRooms: 0,
    occupiedRooms: 0,
    totalGuests: 0
  };

  todayCheckIns: Booking[] = [];
  todayCheckOuts: Booking[] = [];
  recentBookings: Booking[] = [];
  loading = true;
  currentTime: Date = new Date();

  constructor(private http: HttpClient) { }

  ngOnInit(): void {
    this.loadDashboardData();

    // Update time every minute
    setInterval(() => {
      this.currentTime = new Date();
    }, 60000);
  }

  loadDashboardData() {
    this.loading = true;
    const apiUrl = 'https://hotel-management-backend-n59d.onrender.com/api/staff';

    // Load statistics
    this.http.get<any>(`${apiUrl}/stats`).subscribe({
      next: (response) => {
        this.stats = response.data || response;
        console.log('Stats loaded:', this.stats);
      },
      error: (error) => {
        console.error('Error loading stats:', error);
      }
    });

    // Load today's check-ins
    this.http.get<any>(`${apiUrl}/today-checkins`).subscribe({
      next: (response) => {
        this.todayCheckIns = response.data || [];
        console.log('Today check-ins:', this.todayCheckIns);
      },
      error: (error) => {
        console.error('Error loading check-ins:', error);
        this.todayCheckIns = [];
      }
    });

    // Load today's check-outs
    this.http.get<any>(`${apiUrl}/today-checkouts`).subscribe({
      next: (response) => {
        this.todayCheckOuts = response.data || [];
        console.log('Today check-outs:', this.todayCheckOuts);
      },
      error: (error) => {
        console.error('Error loading check-outs:', error);
        this.todayCheckOuts = [];
      }
    });

    // Load recent bookings
    this.http.get<any>(`${apiUrl}/recent`).subscribe({
      next: (response) => {
        this.recentBookings = response.data || [];
        console.log('Recent bookings:', this.recentBookings);
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading recent bookings:', error);
        this.recentBookings = [];
        this.loading = false;
      }
    });
  }

  getStatusBadgeClass(status: string): string {
    const statusMap: { [key: string]: string } = {
      'confirmed': 'badge-success',
      'pending': 'badge-warning',
      'cancelled': 'badge-danger',
      'completed': 'badge-info',
      'checked-in': 'badge-primary'
    };
    return statusMap[status.toLowerCase()] || 'badge-secondary';
  }

  formatDate(date: string): string {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  }

  formatTime(date: string): string {
    return new Date(date).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
  }
}
