# Maa Tara Sweets (Ranchi) - Digital Restaurant Platform

![TypeScript](https://img.shields.io/badge/typescript-%23007ACC.svg?style=for-the-badge&logo=typescript&logoColor=white)
![React](https://img.shields.io/badge/react-%2320232a.svg?style=for-the-badge&logo=react&logoColor=%2361DAFB)
![TailwindCSS](https://img.shields.io/badge/tailwindcss-%2338B2AC.svg?style=for-the-badge&logo=tailwind-css&logoColor=white)
![Fastify](https://img.shields.io/badge/fastify-%23000000.svg?style=for-the-badge&logo=fastify&logoColor=white)
![Bun](https://img.shields.io/badge/Bun-%23000000.svg?style=for-the-badge&logo=bun&logoColor=white)
![Prisma](https://img.shields.io/badge/Prisma-3982CE?style=for-the-badge&logo=Prisma&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/postgres-%23316192.svg?style=for-the-badge&logo=postgresql&logoColor=white)
![Supabase](https://img.shields.io/badge/Supabase-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white)
![Redis](https://img.shields.io/badge/redis-%23DD0031.svg?style=for-the-badge&logo=redis&logoColor=white)

A modern, full-stack digital menu, ordering, and restaurant management platform built specifically for **Maa Tara Sweets**, a premier sweet shop and restaurant located in **Ranchi**.

## Overview

This project provides an end-to-end digital experience for both customers and restaurant staff. Customers can effortlessly browse the menu, scan QR codes to place table-specific orders, and participate in loyalty programs. Meanwhile, the restaurant administration benefits from a powerful backend to manage orders, catalog items, staff roles, and business settings.

**Designed For:** Restaurant owners, sweet shop managers, and cafe operators seeking a streamlined, contact-less ordering system combined with an integrated administrative dashboard.

## Core Features

### For Customers
* **QR Code Table Ordering**: Scan a QR code to automatically assign a table and place orders directly from a smartphone.
* **Digital Menu Explorer**: Browse categories, view high-quality images, and manage a real-time cart.
* **Customer Authentication**: Passwordless login using Passkeys (WebAuthn), OTP via WhatsApp/Email, or Google OAuth.
* **Loyalty Program**: Track visits and unlock milestone rewards seamlessly.
* **Ratings & Reviews**: Submit reviews on past orders and view aggregated Google Places ratings.

### For Administrators
* **Kitchen & Order Flow Management**: Track orders through lifecycle stages (Pending → Preparing → Served) with automatic bill generation.
* **Catalog & Inventory Control**: Manage product listings, categories, and dynamically upload optimized WebP images.
* **Role-Based Access Control**: Secure internal endpoints for `SUPERADMIN` and `ADMIN` roles.
* **Settings Management**: Configure store hours, taxes, delivery charges, and temporary shutdowns on the fly.
* **Dual-Database Architecture**: Total isolation between operational App Data (customers, orders) and Admin Data (staff users, audit logs, settings).

## Tech Stack

This project leverages a cutting-edge, high-performance stack:

### Frontend
* **Framework**: React 19 + Vite
* **Routing**: TanStack Router
* **State Management**: Redux Toolkit & TanStack Query (React Query)
* **Styling**: TailwindCSS v4 + Radix UI (shadcn/ui-inspired components)
* **Forms & Validation**: React Hook Form + Zod
* **Authentication**: SimpleWebAuthn (Passkeys)
* **TOTP**: Speakeasy (for 2FA)
* **OAuth**: Google OAuth (in development)
* **Whatsapp Login**: Meta (in development)
* **Email Login**: Nodemailer/Brevo/Resend (in development)

### Backend
* **Runtime**: Bun
* **Framework**: Fastify
* **Database**: PostgreSQL with Prisma ORM (Dual DB architecture)
* **Authentication**: JWT, WebAuthn (@simplewebauthn/server), Speakeasy (TOTP)
* **Storage**: Supabase Storage (with `sharp` for image compression)
* **Caching & Rate Limiting**: Redis (Upstash)
* **Emails & Notifications**: Nodemailer / Brevo

## Collaborators
* [**nishur31**](https://github.com/nishur31)
