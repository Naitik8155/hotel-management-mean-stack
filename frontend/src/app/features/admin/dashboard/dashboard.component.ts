import { Component, OnInit } from '@angular/core';
import { AdminService } from '@core/services/admin.service';
import { BookingService } from '@core/services/booking.service';
import { AnalyticsService } from '@core/services/analytics.service';
import { Router } from '@angular/router';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent implements OnInit {
  stats: any = {
    totalBookings: 0,
    totalRevenue: 0,
    occupancyRate: 0,
    totalUsers: 0,
    confirmedBookings: 0,
    completedBookings: 0,
    cancelledBookings: 0,
    totalRooms: 0,
    occupiedRooms: 0,
    avgBookingValue: 0,
    failedPayments: 0,
    pendingBookings: 0
  };

  analyticsData: any = {
    charts: {
      revenueByMonth: [],
      bookingStatusDistribution: [],
      roomTypePopularity: []
    }
  };

  allBookings: any[] = [];
  recentBookings: any[] = [];
  loading = false;
  isLoadingBookings = false;

  // Chart configurations
  revenueChartConfig: any = null;
  bookingStatusChartConfig: any = null;
  roomTypeChartConfig: any = null;

  constructor(
    private adminService: AdminService,
    private bookingService: BookingService,
    private analyticsService: AnalyticsService,
    private router: Router
  ) {}

  ngOnInit(): void {
    console.log('Dashboard component initialized');
    this.loadDashboardData();
  }

  loadDashboardData(): void {
    this.loading = true;
    console.log('Loading dashboard data...');

    // Load analytics data
    this.analyticsService.getDashboardAnalytics().subscribe(
      (response) => {
        console.log('Analytics data loaded:', response);
        this.stats = response.data?.overview || this.stats;
        this.analyticsData = {
          charts: response.data?.charts || this.analyticsData.charts
        };
        this.generateCharts();
        this.loading = false;
      },
      (error) => {
        console.error('Error loading analytics:', error);
        this.loading = false;
      }
    );

    // Load all bookings for export and extract recent ones
    this.bookingService.getAllBookings().subscribe(
      (response: any) => {
        this.allBookings = response.data || [];
        this.recentBookings = this.allBookings.slice(0, 5);
      },
      (error) => {
        console.error('Error loading bookings:', error);
      }
    );
  }

  generateCharts(): void {
    // Revenue Chart
    if (this.analyticsData.charts.revenueByMonth && this.analyticsData.charts.revenueByMonth.length > 0) {
      const revenueMonths = this.analyticsData.charts.revenueByMonth.map((item: any) => 
        `${item._id.year}-${String(item._id.month).padStart(2, '0')}`
      );
      const revenueValues = this.analyticsData.charts.revenueByMonth.map((item: any) => item.revenue);

      this.revenueChartConfig = {
        labels: revenueMonths,
        datasets: [{
          label: 'Monthly Revenue',
          data: revenueValues,
          borderColor: '#6366f1',
          backgroundColor: 'rgba(99, 102, 241, 0.1)',
          tension: 0.4,
          fill: true,
          borderWidth: 3,
          pointRadius: 4,
          pointBackgroundColor: '#6366f1',
          pointBorderColor: '#fff',
          pointHoverRadius: 6
        }]
      };
    }

    // Booking Status Chart
    if (this.analyticsData.charts.bookingStatusDistribution && this.analyticsData.charts.bookingStatusDistribution.length > 0) {
      const statusLabels = this.analyticsData.charts.bookingStatusDistribution.map((item: any) => 
        item._id?.charAt(0).toUpperCase() + item._id?.slice(1) || 'Unknown'
      );
      const statusValues = this.analyticsData.charts.bookingStatusDistribution.map((item: any) => item.count);

      const colors = ['#10b981', '#6366f1', '#f59e0b', '#ef4444', '#0ea5e9'];

      this.bookingStatusChartConfig = {
        labels: statusLabels,
        datasets: [{
          label: 'Booking Status',
          data: statusValues,
          backgroundColor: colors.slice(0, statusLabels.length),
          borderColor: '#fff',
          borderWidth: 2
        }]
      };
    }

    // Room Type Chart
    if (this.analyticsData.charts.roomTypePopularity && this.analyticsData.charts.roomTypePopularity.length > 0) {
      const roomLabels = this.analyticsData.charts.roomTypePopularity.map((item: any) => item._id || 'Unknown');
      const roomCounts = this.analyticsData.charts.roomTypePopularity.map((item: any) => item.count);
      const roomRevenues = this.analyticsData.charts.roomTypePopularity.map((item: any) => item.revenue);

      this.roomTypeChartConfig = {
        labels: roomLabels,
        datasets: [
          {
            label: 'Bookings',
            data: roomCounts,
            backgroundColor: '#6366f1',
            borderRadius: 8
          },
          {
            label: 'Revenue (₹)',
            data: roomRevenues,
            backgroundColor: '#10b981',
            borderRadius: 8,
            yAxisID: 'y1'
          }
        ]
      };
    }
  }

  exportAllDataToPDF(): void {
    try {
      this.loading = true;
      const doc = new jsPDF();
      const timestamp = new Date().toLocaleString();
      const fileName = `Hotel_Management_Report_${new Date().getTime()}.pdf`;

      // Header
      doc.setFontSize(22);
      doc.setTextColor(79, 70, 229); // Accent color
      doc.text('Luxe Hotel - Management Report', 14, 22);
      
      doc.setFontSize(10);
      doc.setTextColor(100);
      doc.text(`Generated on: ${timestamp}`, 14, 30);
      doc.text('Confidential Administrative Document', 14, 35);

      // Section 1: Dashboard Overview
      doc.setFontSize(16);
      doc.setTextColor(0);
      doc.text('1. Performance Overview', 14, 50);

      const overviewData = [
        ['Metric', 'Value'],
        ['Total Bookings', (this.stats.totalBookings || 0).toString()],
        ['Total Revenue', `₹${(this.stats.totalRevenue || 0).toLocaleString()}`],
        ['Occupancy Rate', `${this.stats.occupancyRate || 0}%`],
        ['Total Users/Guests', (this.stats.totalUsers || 0).toString()],
        ['Total Rooms', (this.stats.totalRooms || 0).toString()],
        ['Occupied Rooms', (this.stats.occupiedRooms || 0).toString()],
        ['Average Booking Value', `₹${Math.round(this.stats.avgBookingValue || 0).toLocaleString()}`],
        ['Pending Bookings', (this.stats.pendingBookings || 0).toString()],
        ['Cancelled Bookings', (this.stats.cancelledBookings || 0).toString()]
      ];

      autoTable(doc, {
        startY: 55,
        head: [overviewData[0]],
        body: overviewData.slice(1),
        theme: 'striped',
        headStyles: { fillColor: [79, 70, 229] }
      });

      // Section 2: Recent Bookings
      doc.addPage();
      doc.setFontSize(16);
      doc.text('2. All Bookings Detail', 14, 22);

      const bookingRows = this.allBookings.map(b => [
        b.bookingNumber || 'N/A',
        `${b.guestDetails?.firstName} ${b.guestDetails?.lastName}`,
        b.roomId?.roomType || 'Unknown',
        this.formatDate(b.checkInDate),
        this.formatDate(b.checkOutDate),
        b.bookingStatus,
        `₹${b.totalAmount}`
      ]);

      autoTable(doc, {
        startY: 30,
        head: [['Booking #', 'Guest', 'Room Type', 'Check-In', 'Check-Out', 'Status', 'Amount']],
        body: bookingRows,
        theme: 'grid',
        headStyles: { fillColor: [79, 70, 229] },
        styles: { fontSize: 8 }
      });

      // Section 3: Room Type Analytics
      if (this.analyticsData.charts.roomTypePopularity?.length > 0) {
        doc.addPage();
        doc.setFontSize(16);
        doc.text('3. Room Category Analytics', 14, 22);

        const roomData = this.analyticsData.charts.roomTypePopularity.map((item: any) => [
          item._id || 'Unknown',
          item.count,
          `₹${(item.revenue || 0).toLocaleString()}`
        ]);

        autoTable(doc, {
          startY: 30,
          head: [['Room Category', 'Total Bookings', 'Generated Revenue']],
          body: roomData,
          theme: 'striped',
          headStyles: { fillColor: [16, 185, 129] }
        });
      }

      // Footer
      const totalPages = (doc as any).internal.getNumberOfPages();
      for (let i = 1; i <= totalPages; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setTextColor(150);
        doc.text(`Page ${i} of ${totalPages}`, 180, 285);
      }

      doc.save(fileName);
      this.loading = false;
    } catch (error) {
      console.error('Error generating PDF:', error);
      this.loading = false;
      alert('Failed to generate PDF. Please check console for details.');
    }
  }

  getBookingStatusBadgeClass(status: string): string {
    switch (status?.toLowerCase()) {
      case 'confirmed':
        return 'badge bg-success';
      case 'pending':
        return 'badge bg-warning';
      case 'checked-in':
        return 'badge bg-info';
      case 'checked-out':
        return 'badge bg-primary';
      case 'cancelled':
        return 'badge bg-danger';
      default:
        return 'badge bg-secondary';
    }
  }

  navigateToBooking(bookingId: string): void {
    this.router.navigate(['/admin/bookings', bookingId]);
  }

  getStatusClass(status: string): string {
    return 'badge-success';
  }

  navigateTo(page: string): void {
    this.router.navigate([`/admin/${page}`]);
  }

  formatDate(date: string | Date | undefined): string {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  }

  refreshData(): void {
    this.loadDashboardData();
  }
}

