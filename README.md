# 🏫 Foundation NGO - Complete Donation Platform

A production-ready full-stack charity foundation platform for accepting online donations via Stripe. This monorepo contains both backend (Spring Boot) and frontend (React + TypeScript) applications.

## 📁 Project Structure

```
ngo/
├── foundation-backend/      # Spring Boot REST API
│   ├── src/                 # Java source code
│   ├── pom.xml              # Maven configuration
│   ├── README.md            # Backend documentation
│   └── ...
│
├── foundation-frontend/     # React + TypeScript + Vite
│   ├── src/                 # Frontend source code
│   ├── package.json         # Node dependencies
│   ├── README.md            # Frontend documentation
│   └── ...
│
└── README.md               # This file
```

## 🚀 Quick Start

### Prerequisites

- **Backend**: Java 17+, Maven 3.6+, PostgreSQL 12+
- **Frontend**: Node.js 18+, npm
- **Stripe Account**: For payment processing

### 1. Backend Setup

```bash
cd foundation-backend

# Set up PostgreSQL database
createdb foundation_db

# Configure environment variables
export STRIPE_SECRET_KEY=sk_test_your_key
export STRIPE_PUBLISHABLE_KEY=pk_test_your_key
export SPRING_DATASOURCE_URL=jdbc:postgresql://localhost:5432/foundation_db
export SPRING_DATASOURCE_USERNAME=postgres
export SPRING_DATASOURCE_PASSWORD=yourpassword

# Build and run
mvn clean install
mvn spring-boot:run
```

Frontend will run on: `http://localhost:5173/`

**Frontend Documentation**: See `foundation-frontend/README.md` for detailed setup and component documentation.

## 🎯 Features

### Backend ✅
- ✅ Campaign Management APIs
- ✅ Stripe Checkout Session creation
- ✅ Stripe Webhook handling
- ✅ PostgreSQL database
- ✅ RESTful API design
- ✅ Input validation
- ✅ Comprehensive logging
- ✅ Unit tests

### Frontend ✅
- ✅ Campaign listing page
- ✅ Campaign details page
- ✅ Donation form with Stripe Checkout
- ✅ Success/Cancel pages
- ✅ Responsive design
- ✅ TypeScript types
- ✅ React Router navigation

## 🏗️ Architecture

```
┌─────────────────┐
│  React Frontend │ (Port 5173)
│  TypeScript +   │
│  Vite           │
└────────┬────────┘
         │ HTTP/REST
         ▼
┌─────────────────┐
│  Spring Boot    │ (Port 8080)
│  Backend API    │
│  Java 17        │
└────────┬────────┘
         │
         ├──────────► PostgreSQL Database
         │
         └──────────► Stripe API (Payments)
```

## 📚 Documentation

### Backend Documentation
See `foundation-backend/README.md` for:
- Complete API reference
- Database schema
- Environment configuration
- Testing guide

### Frontend Documentation
See `foundation-frontend/README.md` for:
- Component structure
- Routing setup
- API integration
- Styling guide

## 🔧 Technology Stack

### Backend
- **Framework**: Spring Boot 3.2.1
- **Language**: Java 17
- **Database**: PostgreSQL
- **Payment**: Stripe Java SDK 24.15.0
- **Build**: Maven
- **Testing**: JUnit 5, Mockito

### Frontend
- **Framework**: React 18
- **Language**: TypeScript
- **Build Tool**: Vite
- **Routing**: React Router v6
- **Styling**: CSS Modules
- **HTTP Client**: Fetch API

## 🌐 API Endpoints

Base URL: `http://localhost:8080/api`

### Public APIs
- `GET /campaigns` - List active campaigns
- `GET /campaigns/{id}` - Get campaign details
- `POST /donations/stripe/create` - Create checkout session
- `POST /donations/stripe/webhook` - Stripe webhook handler

### Admin APIs
- `GET /admin/donations` - List all donations

For detailed API documentation, see `foundation-backend/README.md`.

## 🔐 Environment Variables

### Backend
Create `foundation-backend/.env`:
```bash
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_SUCCESS_URL=http://localhost:3000/donate/success?session_id={CHECKOUT_SESSION_ID}
STRIPE_CANCEL_URL=http://localhost:3000/donate/cancel
```

### Frontend (To Be Configured)
Create `foundation-frontend/.env.local`:
```bash
NEXT_PUBLIC_API_URL=http://localhost:8080/api
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
```

## 📝 Development Workflow

### Running Both Applications

**Terminal 1 - Backend:**
```bash
cd foundation-backend
mvn spring-boot:run
```

**Terminal 2 - Frontend:**
```bash
cd foundation-frontend
npm run dev
```

### Making Changes

1. Create feature branch: `git checkout -b feature/your-feature`
2. Make changes in backend or frontend
3. Test thoroughly
4. Commit with clear messages
5. Create pull request

## 🧪 Testing

### Backend Tests
```bash
cd foundation-backend
mvn test
```

### Frontend Tests (To Be Implemented)
```bash
cd foundation-frontend
npm test
```

## 📦 Deployment

### Backend Deployment
See `foundation-backend/DEPLOYMENT.md` for:
- AWS Elastic Beanstalk
- Heroku
- Docker
- Kubernetes

### Frontend Deployment (Planned)
- Vercel (recommended for Next.js)
- Netlify
- AWS Amplify
- Docker

## 🤝 Contributing

We welcome contributions! Please read:
- `foundation-backend/CONTRIBUTING.md` - Backend contribution guide
- `foundation-frontend/CONTRIBUTING.md` - Frontend guide (to be created)

### Quick Contribution Steps
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## 📄 License

MIT License - See LICENSE file for details

## 👥 Team & Support

For questions or support:
- Check documentation in respective folders
- Open an issue on GitHub
- Contact the development team

## 🗺️ Roadmap

### Phase 1 (Current) ✅
- ✅ Backend API development
- ✅ Stripe integration
- ✅ Database setup
- ✅ Documentation

### Phase 2 (Next)
- [ ] Frontend development
- [ ] UI/UX design
- [ ] Integration with backend
- [ ] End-to-end testing

### Phase 3 (Future)
- [ ] Admin authentication
- [ ] Email notifications
- [ ] Razorpay integration (Indian payments)
- [ ] Analytics dashboard
- [ ] Mobile app

## 🙏 Acknowledgments

Thank you for supporting our mission to build and run schools for underprivileged children. Every donation makes a difference!

---

**Project Status**: Backend Complete ✅ | Frontend In Development 🚧

**Last Updated**: December 8, 2025
