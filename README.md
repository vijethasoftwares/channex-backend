# Rofabs API Blueprint

## Base URL
- Base URL: https://api.rofabs.com/v1

## Authentication
- All endpoints require authentication using API keys or JWT tokens.

## Errors
- Rofabs API follows standard HTTP status codes for errors.

# Authentication

## User Registration
- `POST /auth/register`
  - Description: Register a new user (Owner, Manager, or Main User).
  - Request Body: User details
  - Response: 201 Created

## User Login
- `POST /auth/login`
  - Description: Authenticate a user and generate an access token.
  - Request Body: Login credentials
  - Response: 200 OK (with access token)

# Owners

## Get Owner Dashboard
- `GET /owners/dashboard`
  - Description: Get an overview of the property analytics and financial reports for an owner.
  - Response: 200 OK

## Manage Properties
- `GET /owners/properties`
  - Description: Get a list of properties owned by the authenticated owner.
  - Response: 200 OK

- `POST /owners/properties`
  - Description: Add a new property to the owner's portfolio.
  - Request Body: Property details
  - Response: 201 Created

- `PUT /owners/properties/{propertyId}`
  - Description: Update details of a specific property.
  - Request Body: Updated property details
  - Response: 200 OK

- `DELETE /owners/properties/{propertyId}`
  - Description: Delete a property from the owner's portfolio.
  - Response: 204 No Content

## Payment Processing
- `POST /owners/properties/{propertyId}/payments`
  - Description: Process payments for property-related transactions.
  - Request Body: Payment details
  - Response: 200 OK

# Managers

## Manage Bookings
- `GET /managers/bookings`
  - Description: Get a list of bookings for the manager's assigned property.
  - Response: 200 OK

- `POST /managers/bookings/{bookingId}/process`
  - Description: Process a booking (check-in, check-out, etc.).
  - Request Body: Action details
  - Response: 200 OK

## Reports
- `GET /managers/reports`
  - Description: Generate property-related reports (occupancy rates, revenue, etc.).
  - Response: 200 OK

# Main Users

## Search Properties
- `GET /properties`
  - Description: Search for available properties.
  - Response: 200 OK

## Book a Room
- `POST /bookings`
  - Description: Make a room reservation.
  - Request Body: Booking details
  - Response: 201 Created

## User Profile
- `GET /users/profile`
  - Description: Get the profile information of the authenticated Main User.
  - Response: 200 OK

## Payment Processing
- `POST /bookings/{bookingId}/payments`
  - Description: Process payments for room reservations.
  - Request Body: Payment details
  - Response: 200 OK

# Admin

## User Management
- `GET /admin/users`
  - Description: Get a list of all users and their roles.
  - Response: 200 OK

- `PUT /admin/users/{userId}`
  - Description: Update the role or permissions of a specific user.
  - Request Body: Updated user details
  - Response: 200 OK

# Additional Features

## Reviews and Ratings
- `POST /properties/{propertyId}/reviews`
  - Description: Submit a review and rating for a property.
  - Request Body: Review details
  - Response: 201 Created

## Promotions and Discounts
- `POST /owners/properties/{propertyId}/promotions`
  - Description: Create a promotional offer or discount for a property.
  - Request Body: Promotion details
  - Response: 201 Created
