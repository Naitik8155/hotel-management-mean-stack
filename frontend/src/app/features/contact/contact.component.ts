import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ContactService } from '../../core/services/contact.service';
import { ToastService } from '../../core/services/toast.service';

@Component({
  selector: 'app-contact',
  templateUrl: './contact.component.html',
  styleUrls: ['./contact.component.css']
})
export class ContactComponent implements OnInit {
  @ViewChild('mapContainer') mapContainer!: ElementRef;

  contactForm!: FormGroup;
  submitted = false;
  submitting = false;
  successMessage = '';
  errorMessage = '';
  activeTab: 'form' | 'info' | 'faq' = 'form';
  mapInitialized = false;

  departments = [
    { id: 'reservations', name: 'Reservations' },
    { id: 'billing', name: 'Billing & Payments' },
    { id: 'maintenance', name: 'Maintenance' },
    { id: 'complaint', name: 'Complaint' },
    { id: 'feedback', name: 'Feedback' },
    { id: 'event', name: 'Event Booking' },
    { id: 'other', name: 'Other' }
  ];

  priority = [
    { id: 'low', name: 'Low', label: 'Can wait' },
    { id: 'medium', name: 'Medium', label: 'Within 48 hours' },
    { id: 'high', name: 'High', label: 'Within 24 hours' },
    { id: 'urgent', name: 'Urgent', label: 'ASAP' }
  ];

  faqs = [
    {
      question: 'How long does it take to get a response?',
      answer: 'We typically respond to all inquiries within 24 business hours. Urgent matters are handled within 4 hours.'
    },
    {
      question: 'Can I change my booking after submission?',
      answer: 'Yes, you can modify or cancel your booking through your dashboard or by contacting our reservations team.'
    },
    {
      question: 'What payment methods do you accept?',
      answer: 'We accept all major credit cards, debit cards, bank transfers, and digital payment methods.'
    },
    {
      question: 'Is there a cancellation fee?',
      answer: 'Cancellation policies depend on your room type and booking terms. Check your booking confirmation for details.'
    },
    {
      question: 'Do you offer group bookings?',
      answer: 'Yes! We offer special rates for group bookings. Contact our event team at events@hotelmanagement.com'
    },
    {
      question: 'How can I provide feedback about my stay?',
      answer: 'We\'d love to hear from you! Use our contact form and select "Feedback" as the department.'
    }
  ];

  expandedFaq: number | null = null;

  contactInfo = {
    address: '123 Hotel Street, City, State 12345, Country',
    phone: '+1 (555) 123-4567',
    email: 'info@hotelmanagement.com',
    supportEmail: 'support@hotelmanagement.com',
    eventsEmail: 'events@hotelmanagement.com',
    hours: {
      weekday: '9:00 AM - 6:00 PM',
      saturday: '10:00 AM - 4:00 PM',
      sunday: 'Closed'
    }
  };

  socialLinks = [
    { icon: '📘', name: 'Facebook', url: 'https://facebook.com/hotelmanagement' },
    { icon: '📷', name: 'Instagram', url: 'https://instagram.com/hotelmanagement' },
    { icon: '🐦', name: 'Twitter', url: 'https://twitter.com/hotelmanagement' },
    { icon: '💼', name: 'LinkedIn', url: 'https://linkedin.com/company/hotelmanagement' }
  ];

  quickContacts = [
    { icon: '🛏️', title: 'Reservations', phone: '+1 (555) 123-4567 ext. 1' },
    { icon: '💳', title: 'Billing', phone: '+1 (555) 123-4567 ext. 2' },
    { icon: '🔧', title: 'Maintenance', phone: '+1 (555) 123-4567 ext. 3' },
    { icon: '🎉', title: 'Events', phone: '+1 (555) 123-4567 ext. 4' }
  ];

  constructor(
    private fb: FormBuilder,
    private contactService: ContactService,
    private toastService: ToastService
  ) { }

  ngOnInit(): void {
    this.initializeForm();
    this.initializeMap();
  }

  initializeForm(): void {
    this.contactForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(2)]],
      email: ['', [Validators.required, Validators.email]],
      phone: ['', [Validators.required, Validators.pattern(/^[0-9\-\+\(\)\s]{10,}$/)]],
      subject: ['', [Validators.required, Validators.minLength(5)]],
      department: ['other', Validators.required],
      priority: ['medium', Validators.required],
      message: ['', [Validators.required, Validators.minLength(10)]],
      subscribe: [false]
    });
  }

  initializeMap(): void {
    setTimeout(() => {
      if (this.mapContainer && !this.mapInitialized) {
        const gmap = (window as any).google;
        if (gmap && gmap.maps) {
          try {
            const mapElement = this.mapContainer.nativeElement;
            const hotelLocation = { lat: 40.7128, lng: -74.0060 };

            const mapOptions: any = {
              center: hotelLocation,
              zoom: 16,
              disableDefaultUI: false,
              zoomControl: true,
              mapTypeControl: true,
              streetViewControl: true,
              fullscreenControl: true,
              styles: [
                {
                  featureType: 'all',
                  elementType: 'geometry',
                  stylers: [
                    { lightness: 95 },
                    { saturation: -100 }
                  ]
                },
                {
                  featureType: 'water',
                  elementType: 'geometry.fill',
                  stylers: [
                    { color: '#d6e9ff' },
                    { saturation: 10 }
                  ]
                },
                {
                  featureType: 'poi',
                  elementType: 'labels',
                  stylers: [
                    { visibility: 'off' }
                  ]
                }
              ]
            };

            const map = new gmap.maps.Map(mapElement, mapOptions);

            // Add marker for hotel location
            new gmap.maps.Marker({
              position: hotelLocation,
              map: map,
              title: '🏨 Hotel Management - Our Location',
              icon: 'http://maps.google.com/mapfiles/ms/icons/red-dot.png',
              animation: gmap.maps.Animation.DROP
            });

            // Add info window
            const infoWindow = new gmap.maps.InfoWindow({
              content: `
                <div style="padding: 12px; font-family: Arial, sans-serif;">
                  <h3 style="margin: 0 0 8px 0; color: #667eea; font-size: 16px;">🏨 Hotel Management</h3>
                  <p style="margin: 0 0 5px 0; color: #333; font-size: 13px;">123 Hotel Street, City, State</p>
                  <p style="margin: 0; color: #667eea; font-weight: bold; font-size: 13px;">📞 +1 (555) 123-4567</p>
                </div>
              `,
              maxWidth: 250
            });

            const marker = new gmap.maps.Marker({
              position: hotelLocation,
              map: map,
              title: 'Click for info'
            });

            marker.addListener('click', () => {
              infoWindow.open(map, marker);
            });

            this.mapInitialized = true;
          } catch (error) {
            console.error('Error initializing map:', error);
          }
        }
      }
    }, 300);
  }

  get f() {
    return this.contactForm.controls;
  }

  onSubmit(): void {
    this.submitted = true;
    this.successMessage = '';
    this.errorMessage = '';

    if (this.contactForm.invalid) {
      return;
    }

    this.submitting = true;
    this.contactService.sendContactMessage(this.contactForm.value).subscribe({
      next: (response) => {
        this.toastService.success('Your message has been sent successfully. We will get back to you soon.', 'Message Sent');
        this.contactForm.reset({
          department: 'other',
          priority: 'medium',
          subscribe: false
        });
        this.submitted = false;
        this.submitting = false;
      },
      error: (error) => {
        this.toastService.error(error.error?.message || 'Failed to send message. Please try again later.', 'Submission Failed');
        this.submitting = false;
      }
    });
  }

  resetForm(): void {
    this.contactForm.reset({
      department: 'other',
      priority: 'medium',
      subscribe: false
    });
    this.submitted = false;
    this.successMessage = '';
    this.errorMessage = '';
  }

  setActiveTab(tab: 'form' | 'info' | 'faq'): void {
    this.activeTab = tab;
  }

  toggleFaq(index: number): void {
    this.expandedFaq = this.expandedFaq === index ? null : index;
  }

  callDepartment(phone: string): void {
    window.location.href = `tel:${phone.replace(/\D/g, '')}`;
  }

  openSocial(url: string): void {
    window.open(url, '_blank');
  }

  getDepartmentName(id: string): string {
    return this.departments.find(d => d.id === id)?.name || '';
  }

  getPriorityLabel(id: string): string {
    return this.priority.find(p => p.id === id)?.label || '';
  }
}

