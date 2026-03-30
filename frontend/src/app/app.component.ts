import { Component, OnInit, OnDestroy, HostListener } from '@angular/core';

import { Router } from '@angular/router';
import { AuthService } from '@core/services/auth.service';
import { RoomService } from '@core/services/room.service';
import { Subject, Subscription, of } from 'rxjs';
import { debounceTime, distinctUntilChanged, switchMap, catchError } from 'rxjs/operators';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit {
  title = 'Hotel Management System';
  isAuthenticated = false;
  isAdmin = false;
  isStaff = false;
  currentUser: any = null;
  // Search state
  searchQuery = '';
  searchResults: any[] = [];
  showSearch = false;
  isScrolled = false;
  isSearching = false;
  scrollProgress = 0;


  private searchSubject = new Subject<string>();
  private searchSub: Subscription | null = null;

  constructor(
    private authService: AuthService,
    public router: Router,
    private roomService: RoomService
  ) { }

  ngOnInit(): void {
    this.authService.currentUser$.subscribe(user => {
      this.currentUser = user;
      this.isAdmin = user?.role === 'admin';
      this.isStaff = user?.role === 'staff' || user?.role === 'admin';
    });

    this.authService.token$.subscribe(token => {
      this.isAuthenticated = !!token;
    });

    this.searchSub = this.searchSubject.pipe(
      debounceTime(280),
      distinctUntilChanged(),
      switchMap(q => {
        const term = (q || '').trim();
        if (!term) {
          this.isSearching = false;
          return of([]);
        }
        this.isSearching = true;
        return this.roomService.getRooms({ q: term, limit: 6 }).pipe(
          catchError(() => {
            this.isSearching = false;
            return of([]);
          })
        );
      })

    ).subscribe(results => {
      this.isSearching = false;
      // roomService may return array or object with data

      if (Array.isArray(results)) this.searchResults = results;
      else this.searchResults = results?.data || results?.rooms || [];
    });
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/home']);
  }

  onSearchInput(): void {
    this.searchSubject.next(this.searchQuery || '');
  }

  onSearchFocus(): void {
    this.showSearch = true;
    if (this.searchQuery) this.searchSubject.next(this.searchQuery);
  }

  onSearchBlur(): void {
    setTimeout(() => this.showSearch = false, 180);
  }

  onSearchEnter(): void {
    if (this.searchResults && this.searchResults.length > 0) {
      this.selectSuggestion(this.searchResults[0]);
    } else if (this.searchQuery.trim()) {
      this.router.navigate(['/rooms'], { queryParams: { q: this.searchQuery.trim() } });
      this.showSearch = false;
    }
  }

  selectSuggestion(item: any): void {
    if (!item) return;
    if (item._id) {
      this.router.navigate(['/rooms', item._id]);
    } else if (item.id) {
      this.router.navigate(['/rooms', item.id]);
    } else {
      this.router.navigate(['/rooms'], { queryParams: { q: this.searchQuery } });
    }
    this.showSearch = false;
    this.searchQuery = '';
    this.searchResults = [];
  }

  resolveImageUrl(img: any): string {
    if (!img) return '';
    let raw = typeof img === 'string' ? img : (img.url || img);
    if (!raw) return '';

    // Repair malformed URLs
    raw = String(raw).replace(/uploadsrooms/gi, 'uploads/rooms');
    raw = raw.replace(/\\/g, '/');

    if (raw.startsWith('http')) return raw;

    const path = raw.startsWith('/uploads') ? raw : `/uploads/rooms/${raw}`;
    return `http://localhost:5000${path}`;
  }

  @HostListener('window:scroll', [])
  onWindowScroll() {
    this.isScrolled = window.scrollY > 50;

    // Calculate scroll progress
    const winScroll = document.body.scrollTop || document.documentElement.scrollTop;
    const height = document.documentElement.scrollHeight - document.documentElement.clientHeight;
    this.scrollProgress = (winScroll / height) * 100;
  }

  ngOnDestroy(): void {

    this.searchSub?.unsubscribe();
  }
}
