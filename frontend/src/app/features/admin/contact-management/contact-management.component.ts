import { Component, OnInit } from '@angular/core';
import { ContactService } from '../../../core/services/contact.service';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';

@Component({
  selector: 'app-contact-management',
  templateUrl: './contact-management.component.html',
  styleUrls: ['./contact-management.component.css']
})
export class ContactManagementComponent implements OnInit {
  contacts: any[] = [];
  selectedContact: any = null;
  responseForm!: FormGroup;
  loading = false;
  showResponseForm = false;

  constructor(
    private contactService: ContactService,
    private fb: FormBuilder
  ) {}

  ngOnInit(): void {
    this.loadContacts();
    this.initializeResponseForm();
  }

  initializeResponseForm(): void {
    this.responseForm = this.fb.group({
      responseMessage: ['', [Validators.required, Validators.minLength(10)]]
    });
  }

  loadContacts(): void {
    this.loading = true;
    this.contactService.getAllContacts().subscribe({
      next: (data) => {
        this.contacts = data;
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading contacts:', error);
        this.loading = false;
      }
    });
  }

  selectContact(contact: any): void {
    this.selectedContact = contact;
    this.showResponseForm = false;
    this.responseForm.reset();
  }

  updateStatus(contactId: string, newStatus: string): void {
    this.contactService.updateContactStatus(contactId, newStatus).subscribe({
      next: (response) => {
        const contact = this.contacts.find(c => c._id === contactId);
        if (contact) {
          contact.status = newStatus;
        }
        if (this.selectedContact && this.selectedContact._id === contactId) {
          this.selectedContact.status = newStatus;
        }
      },
      error: (error) => {
        console.error('Error updating status:', error);
      }
    });
  }

  showResponse(): void {
    this.showResponseForm = true;
  }

  sendResponse(): void {
    if (this.responseForm.invalid || !this.selectedContact) {
      return;
    }

    this.contactService.sendContactResponse(
      this.selectedContact._id,
      this.responseForm.value.responseMessage
    ).subscribe({
      next: (response) => {
        this.selectedContact = response.data;
        this.showResponseForm = false;
        this.responseForm.reset();
        alert('Response sent successfully!');
      },
      error: (error) => {
        console.error('Error sending response:', error);
        alert('Failed to send response');
      }
    });
  }

  cancelResponse(): void {
    this.showResponseForm = false;
    this.responseForm.reset();
  }

  getStatusClass(status: string): string {
    switch(status) {
      case 'new': return 'badge-new';
      case 'in-progress': return 'badge-progress';
      case 'resolved': return 'badge-resolved';
      default: return '';
    }
  }
}
