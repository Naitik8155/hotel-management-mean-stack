import { Component, OnInit } from '@angular/core';
import { AdminService } from '@core/services/admin.service';
import { InvoiceService } from '@core/services/invoice.service';

@Component({
  selector: 'app-payment-management',
  templateUrl: './payment-management.component.html',
  styleUrls: ['./payment-management.component.css']
})
export class PaymentManagementComponent implements OnInit {
  payments: any[] = [];
  filteredPayments: any[] = [];

  showDetailsModal = false;
  showRefundModal = false;
  selectedPayment: any = null;

  searchTerm = '';
  selectedStatus = '';
  selectedMethod = '';
  dateFrom = '';
  dateTo = '';
  refundReasonText = '';

  isLoading = false;
  successMessage = '';
  errorMessage = '';

  statuses = ['pending', 'completed', 'failed', 'refunded'];
  methods = ['razorpay', 'card', 'upi', 'netbanking', 'cash'];

  constructor(private adminService: AdminService, private invoiceService: InvoiceService) { }

  ngOnInit(): void {
    this.loadPayments();
  }

  loadPayments(): void {
    this.isLoading = true;
    this.adminService.getAllPayments().subscribe(
      (response) => {
        this.payments = response.data || [];
        this.filterPayments();
        this.isLoading = false;
      },
      (error) => {
        this.showError('Error loading payments');
        this.isLoading = false;
      }
    );
  }

  filterPayments(): void {
    this.filteredPayments = this.payments.filter(payment => {
      const matchesSearch =
        payment.transactionId?.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        payment.bookingId?.bookingNumber?.includes(this.searchTerm);

      const matchesStatus = !this.selectedStatus || payment.status === this.selectedStatus;
      const matchesMethod = !this.selectedMethod || payment.paymentMethod === this.selectedMethod;

      let matchesDate = true;
      if (this.dateFrom && payment.createdAt) {
        matchesDate = matchesDate && new Date(payment.createdAt) >= new Date(this.dateFrom);
      }
      if (this.dateTo && payment.createdAt) {
        matchesDate = matchesDate && new Date(payment.createdAt) <= new Date(this.dateTo);
      }

      return matchesSearch && matchesStatus && matchesMethod && matchesDate;
    });
  }

  resetFilters(): void {
    this.searchTerm = '';
    this.selectedStatus = '';
    this.selectedMethod = '';
    this.dateFrom = '';
    this.dateTo = '';
    this.filterPayments();
  }

  viewDetails(payment: any): void {
    this.selectedPayment = payment;
    this.showDetailsModal = true;
  }

  closeDetailsModal(): void {
    this.showDetailsModal = false;
    this.selectedPayment = null;
  }

  openRefundModal(payment: any): void {
    this.selectedPayment = payment;
    this.refundReasonText = '';
    this.showRefundModal = true;
  }

  closeRefundModal(): void {
    this.showRefundModal = false;
    this.selectedPayment = null;
    this.refundReasonText = '';
  }

  processRefund(): void {
    if (!this.selectedPayment) return;

    this.isLoading = true; // Use global loading or a specific refund loading state
    const refundData = {
      refundAmount: this.selectedPayment.amount,
      refundReason: this.refundReasonText || 'Refund requested by administrator'
    };

    this.adminService.processRefund(this.selectedPayment._id, refundData).subscribe({
      next: () => {
        this.showSuccess('Capital Reversal Finalized Successfully');
        this.closeRefundModal();
        this.loadPayments();
        this.isLoading = false;
      },
      error: (err: any) => {
        const errorMsg = err.error?.message || 'Reversal Protocol Failed: Unable to verify transaction with gateway.';
        this.showError(errorMsg);
        this.isLoading = false;
      }
    });
  }

  downloadInvoice(payment: any): void {
    if (!payment.bookingId || !payment.bookingId._id) {
      this.showError('Booking information not available');
      return;
    }

    // Generate (or reuse) invoice on server and then download the returned file
    this.invoiceService.generateInvoice(payment.bookingId._id).subscribe({
      next: (res) => {
        const filename = res.data?.filename;
        if (filename) {
          this.invoiceService.downloadInvoice(filename);
          this.showSuccess('Invoice download started');
        } else {
          this.showError('Invoice generation failed');
        }
      },
      error: () => this.showError('Failed to generate invoice')
    });
  }

  getTotalRevenue(): number {
    return this.filteredPayments
      .filter(p => p.status === 'completed')
      .reduce((sum, p) => sum + (p.amount || 0), 0);
  }

  getPendingAmount(): number {
    return this.filteredPayments
      .filter(p => p.status === 'pending')
      .reduce((sum, p) => sum + (p.amount || 0), 0);
  }

  getFailedPayments(): number {
    return this.filteredPayments.filter(p => p.status === 'failed').length;
  }

  getRefundedAmount(): number {
    return this.filteredPayments
      .filter(p => p.status === 'refunded')
      .reduce((sum, p) => sum + (p.amount || 0), 0);
  }

  getStatusBadgeClass(status: string): string {
    switch (status) {
      case 'completed': return 'badge-success';
      case 'pending': return 'badge-warning';
      case 'failed': return 'badge-danger';
      case 'refunded': return 'badge-secondary';
      default: return 'badge-light';
    }
  }

  getMethodIcon(method: string): string {
    const icons: any = {
      'razorpay': 'fas fa-credit-card',
      'card': 'fas fa-credit-card',
      'upi': 'fas fa-mobile-alt',
      'netbanking': 'fas fa-university',
      'cash': 'fas fa-money-bill-wave'
    };
    return icons[method] || 'fas fa-wallet';
  }

  formatDate(date: string): string {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  showSuccess(message: string): void {
    this.successMessage = message;
    setTimeout(() => this.successMessage = '', 4000);
  }

  showError(message: string): void {
    this.errorMessage = message;
    setTimeout(() => this.errorMessage = '', 4000);
  }
}
