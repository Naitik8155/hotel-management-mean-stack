import { Component, OnInit } from '@angular/core';
import { RoomService } from '@core/services/room.service';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ToastService } from '@core/services/toast.service';

@Component({
  selector: 'app-rooms-management',
  templateUrl: './rooms-management.component.html',
  styleUrls: ['./rooms-management.component.css']
})
export class RoomsManagementComponent implements OnInit {
  // Data Properties
  rooms: any[] = [];
  filteredRooms: any[] = [];

  // Form Properties
  roomForm!: FormGroup;
  isEditMode = false;
  editingRoomId: string | null = null;
  showForm = false;
  isSaving = false;

  // Modal Properties
  showDeleteConfirm = false;
  isDeleting = false;
  roomToDelete: any = null;
  showAmenitiesView = false;
  selectedRoomForView: any = null;

  // Filter Properties
  searchTerm = '';
  selectedType = '';
  availabilityFilter = '';
  // Selected rows for bulk actions (room _id values)
  selectedRooms: string[] = [];

  // UI Properties
  isLoading = false;
  successMessage = '';
  errorMessage = '';

  // Available Options
  availableAmenities = ['WiFi', 'AC', 'TV', 'Mini Bar', 'Gym', 'Swimming Pool', 'Spa', 'Restaurant'];

  // Image Upload
  selectedFiles: File[] = [];
  imagePreviewUrls: string[] = [];

  constructor(
    private roomService: RoomService,
    private fb: FormBuilder,
    private toastService: ToastService
  ) { }

  ngOnInit(): void {
    this.initializeForm();
    this.loadRooms();
  }

  // Form Initialization
  initializeForm(): void {
    this.roomForm = this.fb.group({
      roomNumber: ['', [Validators.required, Validators.minLength(2)]],
      roomType: ['', Validators.required],
      pricePerNight: ['', [Validators.required, Validators.min(100)]],
      maxGuests: ['', [Validators.required, Validators.min(1)]],
      floor: ['', Validators.required],
      amenities: [[]],
      description: [''],
      isAvailable: [true],
      // New: whether this room should appear in the Home → Featured Rooms section
      isFeatured: [false]
    });
  }

  // Room Loading & Filtering
  loadRooms(): void {
    this.isLoading = true;
    this.roomService.getRooms().subscribe(
      (response) => {
        this.rooms = response.data || [];
        this.filterRooms();
        this.isLoading = false;
      },
      (error) => {
        this.showError('Error loading rooms: ' + (error.message || 'Unknown error'));
        this.isLoading = false;
      }
    );
  }

  filterRooms(): void {
    this.filteredRooms = this.rooms.filter(room => {
      const matchesSearch = room.roomNumber.toLowerCase().includes(this.searchTerm.toLowerCase());
      const matchesType = !this.selectedType || room.roomType === this.selectedType;
      const matchesAvailability = this.availabilityFilter === '' ||
        (room.isAvailable.toString() === this.availabilityFilter);
      return matchesSearch && matchesType && matchesAvailability;
    });
  }

  resetFilters(): void {
    this.searchTerm = '';
    this.selectedType = '';
    this.availabilityFilter = '';
    this.filterRooms();
  }

  // Statistics Methods
  getAvailableCount(): number {
    return this.filteredRooms.filter(r => r.isAvailable).length;
  }

  getOccupiedCount(): number {
    return this.filteredRooms.filter(r => !r.isAvailable).length;
  }

  getAveragePrice(): number {
    if (this.filteredRooms.length === 0) return 0;
    const total = this.filteredRooms.reduce((sum, room) => sum + room.pricePerNight, 0);
    return Math.round(total / this.filteredRooms.length);
  }

  // Form Management
  openAddForm(): void {
    this.isEditMode = false;
    this.roomForm.reset({ isAvailable: true, amenities: [] });
    this.showForm = true;
  }

  editRoom(room: any): void {
    this.isEditMode = true;
    this.editingRoomId = room._id;
    this.roomForm.patchValue(room);
    this.showForm = true;
  }

  closeForm(): void {
    this.showForm = false;
    this.editingRoomId = null;
    this.roomForm.reset({ isAvailable: true, amenities: [] });
    this.selectedFiles = [];
    this.imagePreviewUrls = [];
  }

  onFileSelect(event: any): void {
    const files = event.target.files;
    if (files && files.length > 0) {
      this.selectedFiles = Array.from(files);

      // Generate preview URLs
      this.imagePreviewUrls = [];
      for (let file of this.selectedFiles) {
        const reader = new FileReader();
        reader.onload = (e: any) => {
          this.imagePreviewUrls.push(e.target.result);
        };
        reader.readAsDataURL(file);
      }
    }
  }

  removeImage(index: number): void {
    this.selectedFiles.splice(index, 1);
    this.imagePreviewUrls.splice(index, 1);
  }

  saveRoom(): void {
    if (this.roomForm.invalid) {
      this.showError('Please fill all required fields');
      return;
    }

    this.isSaving = true;

    // Create FormData for file upload
    const formData = new FormData();
    const roomData = this.roomForm.value;

    // Append room data
    Object.keys(roomData).forEach(key => {
      if (key === 'amenities') {
        formData.append(key, JSON.stringify(roomData[key]));
      } else {
        formData.append(key, roomData[key]);
      }
    });

    // Append images
    if (this.selectedFiles.length > 0) {
      for (let file of this.selectedFiles) {
        formData.append('images', file);
      }
    }

    if (this.isEditMode && !this.editingRoomId) {
      this.showError('Room ID not found. Please reload and try again.');
      this.isSaving = false;
      return;
    }

    const request = this.isEditMode
      ? this.roomService.updateRoom(this.editingRoomId!, formData)
      : this.roomService.createRoom(formData);

    request.subscribe(
      () => {
        this.showSuccess(this.isEditMode ? 'Room updated successfully' : 'Room created successfully');
        this.closeForm();
        this.loadRooms();
        this.isSaving = false;
      },
      (error) => {
        const serverMsg = (error && error.error && error.error.message) ? error.error.message : error.message;
        this.showError('Error saving room: ' + (serverMsg || 'Unknown error'));
        this.isSaving = false;
      }
    );
  }

  // Delete Management
  deleteRoom(room: any): void {
    this.roomToDelete = room;
    this.showDeleteConfirm = true;
  }

  closeDeleteConfirm(): void {
    this.showDeleteConfirm = false;
    this.roomToDelete = null;
  }

  confirmDelete(): void {
    if (!this.roomToDelete) return;

    this.isDeleting = true;
    this.roomService.deleteRoom(this.roomToDelete._id).subscribe(
      () => {
        this.showSuccess('Room deleted successfully');
        this.closeDeleteConfirm();
        this.loadRooms();
        this.isDeleting = false;
      },
      (error) => {
        this.showError('Error deleting room: ' + (error.message || 'Unknown error'));
        this.isDeleting = false;
      }
    );
  }

  // Availability Toggle
  toggleAvailability(room: any): void {
    const newStatus = !room.isAvailable;
    this.roomService.updateRoom(room._id, { isAvailable: newStatus }).subscribe(
      () => {
        room.isAvailable = newStatus;
        this.showSuccess('Room availability updated');
      },
      (error) => this.showError('Error updating room availability')
    );
  }

  // Featured Toggle (shows room on Home)
  toggleFeatured(room: any): void {
    const newStatus = !room.isFeatured;
    this.roomService.updateRoom(room._id, { isFeatured: newStatus }).subscribe(
      () => {
        room.isFeatured = newStatus;
        this.showSuccess(newStatus ? 'Room marked as Featured' : 'Room unmarked as Featured');
      },
      (error) => this.showError('Error updating featured status')
    );
  }

  // --- Bulk selection / bulk-feature helpers ---
  toggleSelectRoom(room: any): void {
    const idx = this.selectedRooms.indexOf(room._id);
    if (idx === -1) this.selectedRooms.push(room._id);
    else this.selectedRooms.splice(idx, 1);
  }

  isSelected(room: any): boolean {
    return this.selectedRooms.indexOf(room._id) !== -1;
  }

  toggleSelectAll(event: any): void {
    if (event.target.checked) {
      this.selectedRooms = this.filteredRooms.map(r => r._id);
    } else {
      this.selectedRooms = [];
    }
  }

  markSelectedFeatured(markAs: boolean): void {
    if (!this.selectedRooms.length) {
      this.showError('No rooms selected');
      return;
    }
    this.isSaving = true;
    const ops = this.selectedRooms.map(id => this.roomService.updateRoom(id, { isFeatured: markAs }).toPromise());
    Promise.allSettled(ops).then(results => {
      const ok = results.filter(r => r.status === 'fulfilled').length;
      this.showSuccess(`${ok} room(s) ${markAs ? 'marked' : 'unmarked'} as Featured`);
      this.selectedRooms = [];
      this.loadRooms();
      this.isSaving = false;
    }).catch(() => {
      this.showError('Failed to update selected rooms');
      this.isSaving = false;
    });
  }

  // Amenities Management
  toggleAmenity(amenity: string): void {
    const current = this.roomForm.get('amenities')?.value || [];
    if (current.includes(amenity)) {
      this.roomForm.patchValue({
        amenities: current.filter((a: string) => a !== amenity)
      });
    } else {
      this.roomForm.patchValue({
        amenities: [...current, amenity]
      });
    }
  }

  isAmenitySelected(amenity: string): boolean {
    const current = this.roomForm.get('amenities')?.value || [];
    return current.includes(amenity);
  }

  showAmenities(room: any): void {
    this.selectedRoomForView = room;
    this.showAmenitiesView = true;
  }

  closeAmenitiesView(): void {
    this.showAmenitiesView = false;
    this.selectedRoomForView = null;
  }

  // UI Helper Methods
  getRoomIcon(roomType: string): string {
    switch (roomType) {
      case 'single':
        return 'fas fa-bed';
      case 'double':
        return 'fas fa-beds';
      case 'suite':
        return 'fas fa-crown';
      case 'deluxe':
        return 'fas fa-star';
      default:
        return 'fas fa-door-open';
    }
  }

  /**
   * Return a thumbnail URL for the room. If the room has uploaded images
   * we use the first one, otherwise fall back to a generic placeholder.
   */
  getRoomThumbnail(room: any): string {
    if (room.images && room.images.length) {
      const first = room.images[0];
      if (typeof first === 'string') {
        return first;
      }
      if (first.url) {
        return first.url;
      }
    }
    // fallback to an external placeholder so we don't need an asset in repo
    return 'https://via.placeholder.com/300x200?text=No+Image';
  }

  getRoomTypeBadge(roomType: string): string {
    switch (roomType) {
      case 'single':
        return 'primary';
      case 'double':
        return 'success';
      case 'suite':
        return 'warning';
      case 'deluxe':
        return 'danger';
      default:
        return 'secondary';
    }
  }

  getAmenityIcon(amenity: string): string {
    const iconMap: any = {
      'WiFi': 'fas fa-wifi',
      'AC': 'fas fa-fan',
      'TV': 'fas fa-tv',
      'Mini Bar': 'fas fa-wine-glass',
      'Gym': 'fas fa-dumbbell',
      'Swimming Pool': 'fas fa-water',
      'Spa': 'fas fa-spa',
      'Restaurant': 'fas fa-utensils'
    };
    return iconMap[amenity] || 'fas fa-check';
  }

  // Notification Methods
  showSuccess(message: string): void {
    this.toastService.success(message, 'Success');
  }

  showError(message: string): void {
    this.toastService.error(message, 'Error');
  }
}
