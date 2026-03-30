import { Component, OnInit } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';

@Component({
  selector: 'app-admin',
  templateUrl: './admin.component.html',
  styleUrls: ['./admin.component.css']
})
export class AdminComponent implements OnInit {
  isSidebarOpen = false;
  isSidebarCollapsed = false;
  currentDate = new Date();

  constructor(private router: Router) {
    console.log('✓ Admin wrapper component loaded');
  }

  ngOnInit(): void {
    // Listen to route changes and ensure we stay on valid routes
    this.router.events
      .pipe(filter(event => event instanceof NavigationEnd))
      .subscribe((event: any) => {
        const url = event.urlAfterRedirects;
        console.log('Current URL:', url);

        // If we're on /admin or /admin/, redirect to dashboard
        if (url === '/admin' || url === '/admin/') {
          console.log('Redirecting from root admin path to dashboard');
          this.router.navigate(['/admin/dashboard']);
        }
      });

    // Update date
    setInterval(() => {
      this.currentDate = new Date();
    }, 60000);
  }

  toggleSidebar() {
    if (window.innerWidth <= 992) {
      this.isSidebarOpen = !this.isSidebarOpen;
    } else {
      this.isSidebarCollapsed = !this.isSidebarCollapsed;
    }
  }

  closeSidebarOnMobile() {
    if (window.innerWidth <= 992) {
      this.isSidebarOpen = false;
    }
  }


}
