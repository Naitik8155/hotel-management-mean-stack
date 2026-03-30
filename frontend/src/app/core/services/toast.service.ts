import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

export interface Toast {
    id: number;
    message: string;
    type: 'success' | 'error' | 'info' | 'warning';
    title?: string;
    duration?: number;
}

@Injectable({
    providedIn: 'root'
})
export class ToastService {
    private toasts: Toast[] = [];
    private toastSubject = new BehaviorSubject<Toast[]>([]);
    public toasts$ = this.toastSubject.asObservable();

    constructor() { }

    show(message: string, type: 'success' | 'error' | 'info' | 'warning' = 'info', title?: string, duration: number = 5000): void {
        const id = Date.now();
        const toast: Toast = { id, message, type, title, duration };
        this.toasts.push(toast);
        this.toastSubject.next([...this.toasts]);

        if (duration > 0) {
            setTimeout(() => this.remove(id), duration);
        }
    }

    success(message: string, title?: string, duration?: number): void {
        this.show(message, 'success', title || 'Success', duration);
    }

    error(message: string, title?: string, duration?: number): void {
        this.show(message, 'error', title || 'Error', duration);
    }

    info(message: string, title?: string, duration?: number): void {
        this.show(message, 'info', title || 'Info', duration);
    }

    warning(message: string, title?: string, duration?: number): void {
        this.show(message, 'warning', title || 'Warning', duration);
    }

    remove(id: number): void {
        this.toasts = this.toasts.filter(t => t.id !== id);
        this.toastSubject.next([...this.toasts]);
    }
}
