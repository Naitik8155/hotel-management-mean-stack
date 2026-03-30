# Contact Us Feature Documentation

## Overview
The Contact Us feature allows hotel guests and visitors to send inquiries directly through the website. Administrators can manage, track, and respond to these contact messages.

## Frontend Components

### 1. Contact Page Component
**Location:** `frontend/src/app/features/contact/`

#### Files:
- `contact.component.ts` - Main component logic
- `contact.component.html` - Page layout and form
- `contact.component.css` - Styling
- `contact.module.ts` - Module configuration
- `contact-routing.module.ts` - Route configuration

#### Features:
- Contact form with validation
  - Full name (required, min 2 characters)
  - Email address (required, valid email format)
  - Phone number (required, 10+ digits)
  - Subject (required, min 5 characters)
  - Message (required, min 10 characters)
- Contact information section with:
  - Address
  - Phone number
  - Email addresses
  - Business hours
- Success/error message notifications
- Form submission with loading state
- Reset form functionality
- Responsive design for all devices
- Map placeholder (ready for Google Maps integration)

### 2. Contact Management Component (Admin)
**Location:** `frontend/src/app/features/admin/contact-management/`

#### Files:
- `contact-management.component.ts` - Admin management logic
- `contact-management.component.html` - Admin interface
- `contact-management.component.css` - Admin styling

#### Features:
- View all contact messages in a list
- Filter by status (New, In Progress, Resolved)
- Search and sort by date
- View detailed contact information
- Update message status
- Send responses to customers
- Track response dates
- Message count display

## Backend Components

### 1. Contact Model
**Location:** `backend/src/models/Contact.js`

#### Schema:
```javascript
{
  name: String (required),
  email: String (required, valid email),
  phone: String (required),
  subject: String (required),
  message: String (required),
  status: String (enum: 'new', 'in-progress', 'resolved'),
  adminResponse: String (optional),
  respondedAt: Date,
  createdAt: Date,
  updatedAt: Date
}
```

### 2. Contact Routes
**Location:** `backend/src/routes/contactRoutes.js`

#### Endpoints:

**Public Endpoints:**
- `POST /api/contact/send` - Submit a contact message
  - Body: `{ name, email, phone, subject, message }`
  - Returns: Contact ID and confirmation

- `GET /api/contact/info` - Get hotel contact information
  - Returns: Contact details and hours

**Admin Endpoints:**
- `GET /api/contact/` - Get all contact messages
  - Returns: Array of all contacts sorted by date

- `GET /api/contact/:id` - Get single message by ID
  - Returns: Contact details

- `PUT /api/contact/:id/status` - Update message status
  - Body: `{ status: 'new' | 'in-progress' | 'resolved' }`
  - Returns: Updated contact

- `POST /api/contact/:id/response` - Send response to customer
  - Body: `{ responseMessage: String }`
  - Returns: Updated contact with response

### 3. Contact Controller
**Location:** `backend/src/controllers/contactController.js`

Handles all business logic for:
- Validating contact submissions
- Saving messages to database
- Sending email notifications
- Updating message status
- Sending admin responses
- Retrieving contact information

## Services

### Contact Service (Frontend)
**Location:** `frontend/src/app/core/services/contact.service.ts`

Methods:
- `sendContactMessage(data)` - Submit contact form
- `getContactInfo()` - Fetch contact information
- `getAllContacts()` - Get all messages (admin)
- `getContactById(id)` - Get single message (admin)
- `updateContactStatus(id, status)` - Update status (admin)
- `sendContactResponse(id, message)` - Send response (admin)

### Email Service (Backend)
**Location:** `backend/src/utils/emailService.js`

Methods:
- `sendContactNotification(contactData)` - Send notification emails
  - Admin email: Notifies admin of new message
  - Customer email: Confirmation to customer
  
- `sendContactResponse(responseData)` - Send admin response
  - Customer email: Response from admin

## Routing

### Frontend Routes
- `/contact` - Public contact page
- `/admin/contact-management` - Admin contact management (protected)

### Backend Routes
- `/api/contact` - Contact API endpoint

## Integration Checklist

### Frontend:
- [x] Contact component created
- [x] ContactService created
- [x] Routes configured
- [x] Admin management component created
- [x] Responsive styling

### Backend:
- [x] Contact model created
- [x] Contact controller created
- [x] Contact routes configured
- [x] Email service integration
- [x] Server route registration

## Usage

### For Customers:
1. Navigate to `/contact` page
2. Fill in the contact form with required information
3. Click "Send Message"
4. Receive confirmation message and email

### For Administrators:
1. Navigate to admin dashboard
2. Go to "Contact Management" section
3. View list of all contact messages
4. Click on a message to view details
5. Change status as needed
6. Send response (which sends email to customer)

## Email Features

### Contact Notification Email
- Sent to admin when new message received
- Contains all contact details and message content

### Customer Confirmation Email
- Sent to customer when message is submitted
- Thanks them and provides contact options
- Sets expectation for response time (24 hours)

### Response Email
- Sent to customer when admin responds
- Includes admin's response message
- Includes contact information for follow-up

## Environment Variables Needed

```
SMTP_USER=your_gmail@gmail.com
SMTP_PASS=your_app_password
EMAIL_FROM=noreply@hotelmanagement.com
ADMIN_EMAIL=admin@hotelmanagement.com
```

## Customization

### Update Contact Information:
Edit the contact info object in:
- `backend/src/controllers/contactController.js` - `getContactInfo()`
- `frontend/src/app/features/contact/contact.component.html` - Info section

### Update Email Templates:
Edit templates in:
- `backend/src/utils/emailService.js` - Email HTML templates

### Change Validation Rules:
Edit validators in:
- `frontend/src/app/features/contact/contact.component.ts` - Form validation
- `backend/src/controllers/contactController.js` - Server-side validation

## Security Considerations

Current implementation:
- Email validation on both client and server
- Input sanitization
- Rate limiting not implemented (recommended to add)
- Admin endpoints not protected (add auth middleware)

**Recommended improvements:**
1. Add authentication for admin endpoints
2. Implement rate limiting on `/send` endpoint
3. Add CSRF token validation
4. Implement spam detection
5. Add captcha verification

## Future Enhancements

1. **Google Maps Integration** - Replace map placeholder
2. **Live Chat** - Add real-time chat widget
3. **Ticket System** - Create support ticket IDs
4. **File Attachments** - Allow customers to upload files
5. **Multi-language Support** - Translate form and emails
6. **Chatbot Integration** - Add AI-powered initial response
7. **SMS Notifications** - Send SMS alerts to admin
8. **Analytics** - Track contact metrics and respond times
9. **Categories** - Allow categorizing inquiries (booking, complaint, etc.)
10. **Priority Levels** - Set message priority level

## Testing

### Manual Testing Checklist:
- [ ] Fill form with valid data - should submit successfully
- [ ] Submit form with empty fields - should show validation errors
- [ ] Submit form with invalid email - should show error
- [ ] Admin can view all messages
- [ ] Admin can update message status
- [ ] Admin can send response
- [ ] Customer receives confirmation email
- [ ] Customer receives response email
- [ ] Form resets after successful submission
- [ ] Responsive design works on mobile/tablet/desktop

## Troubleshooting

### Emails not sending:
1. Check SMTP credentials in .env file
2. Verify Gmail app password is correct
3. Allow less secure apps in Gmail settings
4. Check email service logs

### Form validation not working:
1. Ensure ReactiveFormsModule is imported
2. Check form control names match template
3. Verify validators are properly configured

### Admin can't see messages:
1. Check database connection
2. Verify Contact model is registered
3. Check browser console for errors

## Support

For issues or questions about the Contact Us feature, refer to the documentation or check the implementation guide at `docs/IMPLEMENTATION_GUIDE.md`.
