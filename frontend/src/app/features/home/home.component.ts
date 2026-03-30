import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { ContentService } from '@core/services/content.service';
import { RoomService } from '@core/services/room.service';
import { Router } from '@angular/router';
import { ToastService } from '@core/services/toast.service';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css']
})
export class HomeComponent implements OnInit {
  @ViewChild('searchForm') searchForm!: ElementRef;

  banners: any[] = [];
  featuredRooms: any[] = [];
  testimonials: any[] = [];
  hotelDetails: any = {};

  // Search form
  searchCriteria = {
    checkInDate: '',
    checkOutDate: '',
    guests: 1,
    roomType: ''
  };

  isLoadingBanners = false;
  isLoadingRooms = false;
  isLoadingTestimonials = false;
  currentBannerIndex = 0;
  today: string = '';

  amenities = [
    { icon: 'wifi', name: 'Free WiFi', description: 'High-speed internet in all rooms' },
    { icon: 'spa', name: 'Spa & Wellness', description: 'Full-service spa and fitness center' },
    { icon: 'utensils', name: 'Multi-cuisine Restaurant', description: '24-hour dining service' },
    { icon: 'parking', name: 'Free Parking', description: 'Complimentary parking for guests' },
    { icon: 'shield', name: '24/7 Security', description: 'Round-the-clock security team' },
    { icon: 'concierge-bell', name: 'Concierge Service', description: 'Expert travel planning assistance' }
  ];

  constructor(
    private contentService: ContentService,
    private roomService: RoomService,
    private router: Router,
    private toastService: ToastService
  ) { }

  // Resolve image URL to absolute backend url if needed
  resolveImageUrl(img: any): string {
    if (!img) return '';
    let raw = typeof img === 'string' ? img : (img.url || img.imageUrl);
    if (!raw) return '';

    // If it's already a full URL (http/https), return as-is
    if (raw.startsWith('http')) return raw;

    // Repair malformed URLs
    raw = raw.replace(/\\/g, '/');

    // If it's already an absolute path starting with /uploads
    if (raw.startsWith('/uploads')) {
      return `http://localhost:5000${raw}`;
    }

    // Default fallback to rooms (for backward compatibility if needed)
    return `http://localhost:5000/uploads/rooms/${raw}`;
  }


  ngOnInit(): void {
    const now = new Date();
    this.today = now.toISOString().split('T')[0];
    this.loadBanners();
    this.loadFeaturedRooms();
    this.loadTestimonials();
    this.loadHotelDetails();
    this.autoScrollBanners();
  }

  loadBanners(): void {
    this.isLoadingBanners = true;
    this.contentService.getBanners().subscribe(
      (response) => {
        this.banners = response.data && response.data.length > 0 ? response.data : this.getDefaultBanners();
        this.isLoadingBanners = false;
      },
      (error) => {
        console.error('Error loading banners:', error);
        this.banners = this.getDefaultBanners();
        this.isLoadingBanners = false;
      }
    );
  }

  getDefaultBanners() {
    return [
      {
        imageUrl: 'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?ixlib=rb-1.2.1&auto=format&fit=crop&w=1950&q=80',
        title: 'Experience Luxury',
        description: 'Immerse Yourself in World-Class Comfort and Elegance',
        ctaText: 'Explore Rooms',
        ctaLink: '/rooms'
      },
      {
        imageUrl: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?ixlib=rb-1.2.1&auto=format&fit=crop&w=1950&q=80',
        title: 'Boutique Elegance',
        description: 'Discover the Perfect Blend of Modern Style and Personal Service',
        ctaText: 'View Suites',
        ctaLink: '/rooms'
      }
    ];
  }

  loadFeaturedRooms(): void {
    // Intentional: load *all* rooms and show them in the "Featured Rooms" area per request.
    this.isLoadingRooms = true;
    this.roomService.getRooms().subscribe(
      (response) => {
        this.featuredRooms = response?.data || [];
        this.isLoadingRooms = false;
      },
      (error) => {
        console.error('Error loading rooms for Featured section:', error);
        this.featuredRooms = [];
        this.isLoadingRooms = false;
      }
    );
  }

  loadTestimonials(): void {
    this.isLoadingTestimonials = true;
    this.contentService.getTestimonials().subscribe(
      (response) => {
        this.testimonials = response.data && response.data.length > 0 ? response.data : this.getDefaultTestimonials();
        this.isLoadingTestimonials = false;
      },
      (error) => {
        console.error('Error loading testimonials:', error);
        this.testimonials = this.getDefaultTestimonials();
        this.isLoadingTestimonials = false;
      }
    );
  }

  getDefaultTestimonials() {
    return [
      {
        guestName: 'Sarah Jenkins',
        comment: 'An absolutely stunning experience. The attention to detail and the quality of service were beyond my expectations. Truly a luxury retreat.',
        rating: 5
      },
      {
        guestName: 'Michael Chen',
        comment: 'The suite was magnificent, with breathtaking views and impeccable cleanliness. The restaurant staff made every meal a delight.',
        rating: 5
      },
      {
        guestName: 'Emma Rodriguez',
        comment: 'Perfect for our anniversary. The spa was incredible and the staff went above and beyond to make our stay special.',
        rating: 4
      }
    ];
  }

  loadHotelDetails(): void {
    this.contentService.getHotelDetails().subscribe(
      (response) => {
        this.hotelDetails = response.data;
      },
      (error) => {
        console.error('Error loading hotel details:', error);
      }
    );
  }

  autoScrollBanners(): void {
    setInterval(() => {
      if (this.banners.length > 0) {
        this.currentBannerIndex = (this.currentBannerIndex + 1) % this.banners.length;
      }
    }, 5000);
  }

  previousBanner(): void {
    this.currentBannerIndex = (this.currentBannerIndex - 1 + this.banners.length) % this.banners.length;
  }

  nextBanner(): void {
    this.currentBannerIndex = (this.currentBannerIndex + 1) % this.banners.length;
  }

  setBannerIndex(index: number): void {
    this.currentBannerIndex = index;
  }

  search(): void {
    if (!this.searchCriteria.checkInDate || !this.searchCriteria.checkOutDate) {
      this.toastService.warning('Please select both check-in and check-out dates', 'Incomplete Search');
      return;
    }

    const queryParams: any = {};
    if (this.searchCriteria.roomType) {
      queryParams.roomType = this.searchCriteria.roomType;
    }
    queryParams.checkIn = this.searchCriteria.checkInDate;
    queryParams.checkOut = this.searchCriteria.checkOutDate;
    queryParams.guests = this.searchCriteria.guests;

    this.router.navigate(['/rooms'], { queryParams });
  }

  navigateToBanner(banner: any): void {
    this.router.navigate([banner.ctaLink]);
  }

  /** Navigate to room detail (no auto-open) */
  viewRoomDetails(roomId: string): void {
    this.router.navigate(['/rooms', roomId]);
  }


  goToRooms(): void {
    this.router.navigate(['/rooms']);
  }

  getStarArray(rating: number): number[] {
    return Array(Math.round(rating)).fill(1);
  }

  /** Amenity icon helper (safe for strictTemplates) */
  getAmenityIcon(amenity: unknown): string {
    const map: Record<string, string> = {
      wifi: 'fa-wifi',
      tv: 'fa-tv',
      ac: 'fa-snowflake',
      restaurant: 'fa-utensils',
      parking: 'fa-parking',
      pool: 'fa-swimming-pool'
    };
    const key = String(amenity || '').toLowerCase().replace(/[^a-z0-9]/g, '');
    return map[key] || 'fa-circle';
  }

  setMinCheckOut(): void {
    // Ensure checkout date is at least 1 day after checkin
    if (this.searchCriteria.checkInDate) {
      const checkInDate = new Date(this.searchCriteria.checkInDate);
      checkInDate.setDate(checkInDate.getDate() + 1);
      const minDate = checkInDate.toISOString().split('T')[0];
      const checkOutInput = document.querySelector('input[name="checkOut"]') as HTMLInputElement;
      if (checkOutInput) {
        checkOutInput.min = minDate;
      }
    }
  }
}
