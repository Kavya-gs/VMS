# Visitor Management System (VMS) - Development Summary

## Overview

This document summarizes the development work completed on the VMS application. The project is a professional **Visitor Management System** built with **React, Vite, Tailwind CSS, Node.js, Express, and MongoDB**, featuring a responsive UI and full-stack API integration.

# Technologies Used

## Core Framework

* **React 19.2.0** - UI library
* **React Router DOM 7.13.1** - Client-side routing
* **Vite 7.3.1** - Build tool and dev server

## UI & Styling

* **Material UI 7.3.8** (@mui/material, @mui/icons-material)
* **Tailwind CSS 3.4.17** - Utility-first CSS framework
* **PostCSS 8.4.49** - CSS processor
* **Autoprefixer 10.4.20** - CSS vendor prefixes
* **Emotion** (@emotion/react, @emotion/styled) - CSS-in-JS

## Backend

* **Node.js**
* **Express.js**
* **MongoDB Atlas**
* **Mongoose**
* **Axios** 

# Implemented functionality/feature till now

## 1. Header Component (`src/app/components/Header/index.jsx`)

**Features:**

* Sticky navigation bar with gradient styling
* Logo section with VMS branding (📋 emoji icon)
* Desktop navigation with 4 main sections:

  * Dashboard
  * Visitors
  * Check-in
  * Reports
* User menu dropdown (Profile, Logout)
* Active route highlighting
* Material UI icons for professional appearance
* Smooth transitions and hover effects
* Custom gradient text styling

## 2. Footer Component (`src/app/components/Footer/index.jsx`)

**Features:**

* Dark gray background with white text
* 4-column layout:

  * **Company Info**: Logo, description, social media icons
  * **Quick Links**: Dashboard, Visitors, Reports, Settings
  * **Support**: Help Center, Documentation, Contact, FAQ
  * **Contact Info**: Phone, Email, Location
* Social media buttons (Facebook, Twitter, LinkedIn, Instagram)
* Divider line separating bottom section
* Copyright year (dynamic)
* Footer links (Privacy Policy, Terms of Service, Cookie Policy)

## 3. MainLayout Component (`src/app/layouts/MainLayout.tsx`)

**Features:**

* Flexbox wrapper for consistent page structure
* Contains Header and Footer
* Main content area with flex-grow
* Gradient background styling
* Full height layout

# Backend Implementation

## 4. Server Setup

Created backend using **Node.js and Express**.

**Features:**

* Express server configuration
* API routing structure
* Environment configuration using `.env`

**Files Created**

```
server/
 ├── server.js
 ├── src/
 │   ├── app.js
 │   ├── routes/
 │   ├── controllers/
 │   ├── models/
```

---

## 5. MongoDB Database Integration

**Features:**

* Connected application to **MongoDB Atlas**
* Created database for **Visitor Management System**
* Used **Mongoose ODM** for schema management

**Environment Configuration**

`.env`

```
PORT=5000
MONGO_URI=your_mongodb_connection_string
```

## 6. Visitor Model (`server/src/models/visitor.model.js`)

Created MongoDB schema for storing visitor details.

**Fields**

* Name
* Email
* Purpose of visit
* Person to meet
* Check-in time
* Check-out time
* Created timestamp

---

## 7. Visitor API Development

Created REST APIs to manage visitors.

### API Endpoints

| Method | Endpoint                     | Description        |
| ------ | ---------------------------- | ------------------ |
| POST   | `/api/visitors/checkin`      | Visitor check-in   |
| GET    | `/api/visitors`              | Fetch all visitors |
| PUT    | `/api/visitors/checkout/:id` | Visitor check-out  |

**Features**

* Store visitor details in MongoDB
* Update checkout time
* Sort visitors by latest entry

---

# Frontend Feature Implementation

8. Check-In Page

Form validation using React Hook Form + Yup

Sends request to backend

Stores visitor data with logged-in user

9. Visitor Dashboard (NEW 🚀)
Features

Fetch user-specific visits (/my-visits)

Show current active visit

Display:

Status

Purpose

Host

QR Code Integration

Generates QR code for approved visitors

Used for entry scanning

10. Visitor History Table

Shows all past visits

Status-based color indicators:

🟡 Pending

🟢 Approved

🔴 Rejected / Checked-out

11. Checkout Page (NEW 🚀)
Features

Displays visitors eligible for checkout

Checkout action updates backend

Role-based access (Security/Admin)

Workflow
User clicks Checkout
        ↓
PUT /api/visitors/checkout/:id
        ↓
Status updated in DB
        ↓
UI refreshes automatically

12. Dashboard Auto Refresh 

After checkout, dashboard updates instantly

Uses re-fetch logic to sync UI with backend

13. Role-Based Access Control (NEW 🔐)
Access Rules

Visitor:

Can check-in

Can view own visits

Security:

Can checkout visitors

Admin:

Can approve/reject visitors

Can view stats

14. API Error Handling Improvements

Handled common issues:

401 Unauthorized → Missing/invalid token

403 Forbidden → Role restriction

Network errors handling in frontend

Dashboard Improvements

15. Dashboard Statistics

Total visitors

Active visitors

Checked-out visitors

Data fetched from backend

Current Application Features

The system now supports:

Visitor Check-in

Visitor Approval/Rejection

Visitor Check-out

Visitor Dashboard (user-specific)

QR Code for entry

Role-based authentication

Secure API access

MongoDB storage

Dashboard analytics

