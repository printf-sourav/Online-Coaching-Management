# Online Coaching Platform

A comprehensive online coaching platform that connects students with teachers, featuring class management, assignments, payments, and real-time communication.

## Features

- **User Authentication & Authorization**: Secure login and registration for students, teachers, and admins
- **Enrollment Management**: Students can enroll in courses and manage their enrollments
- **Class Management**: Schedule and manage live classes with attendance tracking
- **Assignment System**: Teachers can create assignments, students can submit work, and teachers can grade submissions
- **Payment Integration**: Secure payments using Razorpay for course fees
- **Admin Dashboard**: Comprehensive analytics and management tools for administrators
- **Teacher Dashboard**: Tools for managing classes, students, and assignments
- **Student Dashboard**: Access to enrolled courses, assignments, and progress tracking
- **Notifications**: Real-time notifications for important updates
- **Demo Sessions**: Free demo classes for prospective students
- **Scheduling**: Weekly schedule management for classes
- **File Uploads**: Cloudinary integration for secure file storage
- **Real-time Communication**: Socket.io for live updates and notifications

## Tech Stack

### Backend
- **Node.js** with Express.js
- **MongoDB** with Mongoose ODM
- **Socket.io** for real-time features
- **JWT** for authentication
- **Razorpay** for payment processing
- **Cloudinary** for file uploads
- **Nodemailer** for email notifications
- **PDFKit** for invoice generation

### Frontend
- **React** with Vite
- **React Router** for navigation
- **Bootstrap** for UI components
- **Chart.js** for data visualization
- **React Hot Toast** for notifications
- **AOS** for animations

## Installation

### Prerequisites
- Node.js (v16 or higher)
- MongoDB
- Git

### Backend Setup
1. Navigate to the backend directory:
   ```bash
   cd backend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env` file in the `src` directory with the following variables:
   ```
   PORT=5000
   MONGODB_URI=your_mongodb_connection_string
   JWT_SECRET=your_jwt_secret
   CLIENT_URL=http://localhost:5173
   RAZORPAY_KEY_ID=your_razorpay_key_id
   RAZORPAY_KEY_SECRET=your_razorpay_key_secret
   CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
   CLOUDINARY_API_KEY=your_cloudinary_api_key
   CLOUDINARY_API_SECRET=your_cloudinary_api_secret
   EMAIL_USER=your_email
   EMAIL_PASS=your_email_password
   ```

4. Start the development server:
   ```bash
   npm run dev
   ```

### Frontend Setup
1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm run dev
   ```

The application will be available at `http://localhost:5173`

## Usage

### Admin Setup
To create an admin user, run the seed script:
```bash
cd backend
npm run seed:admin
```

### Building for Production
1. Build the frontend:
   ```bash
   cd frontend
   npm run build
   ```

2. Start the backend in production mode:
   ```bash
   cd backend
   npm start
   ```

### Deployment
The frontend is configured for deployment to GitHub Pages. To deploy:
```bash
cd frontend
npm run deploy
```

## API Documentation

The API provides endpoints for:
- Authentication (`/api/auth`)
- User management (`/api/admin`, `/api/students`, `/api/teacher`)
- Course management (`/api/classes`, `/api/enrollments`)
- Assignments (`/api/assignments`, `/api/submissions`)
- Payments (`/api/payments`)
- Analytics (`/api/admin/analytics`)
- Notifications (`/api/notifications`)
- Scheduling (`/api/schedule`)

For detailed API documentation, refer to the route files in `backend/src/routes/`

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request