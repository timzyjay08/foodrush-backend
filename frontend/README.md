# FoodRush Frontend Hub

Build the frontend for a food delivery marketplace called "FoodRush".

IMPORTANT:

This is a FRONTEND-ONLY project.

The backend already exists and is built with Spring Boot. Do NOT create, replace, or redesign the backend. Do NOT create a Supabase backend. Do NOT use Supabase as the primary database or API.

The frontend will eventually connect to an existing Spring Boot REST API using HTTP requests and JWT authentication.

TECH STACK:

- React

- Vite

- JavaScript

- Tailwind CSS

- React Router

- TanStack Query

- Axios

- Lucide React

- Responsive mobile-first design

PROJECT GOAL:

FoodRush connects customers with restaurants and delivery riders.

The frontend will eventually support four roles:

1. Customer

2. Restaurant staff

3. Delivery rider

4. Administrator

For this first build, focus heavily on the CUSTOMER experience and create the shared design system/layout that the other dashboards can use later.

CUSTOMER PAGES:

- Landing/Home

- Login

- Register

- Restaurant discovery

- Restaurant listing

- Restaurant details

- Menu browsing

- Cart

- Checkout

- Order confirmation

- Order tracking

- Order history

- Profile

- Addresses

- Favorites

RESTAURANT PAGES:

Create the basic dashboard structure but do not overbuild it yet:

- Restaurant dashboard

- Orders

- Menu management

- Restaurant profile

RIDER PAGES:

Create the basic structure:

- Rider dashboard

- Available deliveries

- Active delivery

- Delivery history

ADMIN PAGES:

Create the basic structure:

- Admin dashboard

- Users

- Restaurants

- Orders

- Riders

DESIGN DIRECTION:

FoodRush should feel like a modern Nigerian food delivery platform.

The interface should feel:

- Friendly

- Fast

- Clean

- Youthful

- Premium without being expensive-looking

- Easy to use on mobile

- Strong visual hierarchy

- Clear food imagery

- Smooth but restrained animations

Do not make it look like a generic SaaS dashboard.

The customer-facing experience should feel like a real consumer product such as a modern food delivery app.

Use:

- Large food imagery

- Restaurant cards

- Food cards

- Category chips

- Search

- Filters

- Clear prices

- Ratings

- Delivery information

- Prominent CTAs

- Bottom navigation on mobile where appropriate

Create a consistent FoodRush design system:

- Typography scale

- Spacing system

- Border radius

- Buttons

- Inputs

- Cards

- Badges

- Modals

- Toasts

- Loading states

- Empty states

- Error states

- Skeleton loaders

NAVIGATION:

Desktop:

- FoodRush logo

- Home

- Restaurants

- Categories

- Orders

- Favorites

- Search

- Cart

- Profile

Mobile:

- Bottom navigation

- Home

- Search

- Orders

- Favorites

- Profile

AUTHENTICATION:

Create Login and Register pages.

The frontend should be structured so authentication will later use the existing Spring Boot API.

Create an API layer such as:

src/api/

client.js

auth.js

restaurants.js

menu.js

cart.js

orders.js

payments.js

Use Axios for API requests.

Use an environment variable:

VITE_API_URL=http://localhost:8080/api

Do not hardcode the API URL throughout the application.

JWT:

The backend uses JWT authentication.

Create the frontend architecture so that the JWT can be stored and automatically attached to authenticated API requests.

Do not invent authentication endpoints. Keep the API functions easy to modify once the exact backend DTOs and response structures are connected.

DATA:

For the initial UI build, use realistic mock data where necessary so the screens are visually complete.

However, clearly isolate mock data from the API layer.

Do NOT scatter fake restaurant/menu data directly throughout components.

Use a structure such as:

src/

api/

components/

data/

hooks/

layouts/

pages/

routes/

utils/

The real Spring Boot API will replace the mock data later.

ROUTING:

Set up React Router with clean routes such as:

/

/login

/register

/restaurants

/restaurants/:id

/cart

/checkout

/orders

/orders/:id

/favorites

/profile

/profile/addresses

Prepare role-based route protection for:

- customer

- restaurant

- rider

- admin

Do not implement complex permissions until the backend integration is connected.

COMPONENT ARCHITECTURE:

Build reusable components rather than duplicating UI.

Examples:

Navbar

MobileBottomNav

SearchBar

RestaurantCard

FoodCard

CategoryCard

Rating

Price

CartItem

QuantitySelector

OrderCard

StatusBadge

AddressCard

EmptyState

LoadingSkeleton

Button

Input

Modal

Toast

Make components reusable across the customer and dashboard areas.

RESPONSIVENESS:

The application must work properly at:

- mobile

- tablet

- desktop

Design mobile-first.

Do not simply shrink the desktop interface for mobile.

ACCESSIBILITY:

Use semantic HTML.

Provide labels for inputs.

Ensure buttons have clear accessible names.

Maintain good keyboard navigation.

Do not rely only on color to communicate status.

CODE QUALITY:

Keep the code modular.

Avoid giant components.

Use reusable components.

Keep API logic outside UI components.

Keep mock data separate from components.

Use clear naming.

Avoid unnecessary dependencies.

IMPORTANT BACKEND RULE:

The existing backend is Spring Boot.

Do NOT:

- create a Supabase backend

- create a new Node backend

- create database tables

- replace the REST API

- invent backend business logic

The frontend must remain independent enough that I can connect it to the existing Spring Boot API later.

FIRST BUILD:

Start by creating:

1. Global FoodRush design system

2. Landing page

3. Navbar

4. Mobile navigation

5. Login page

6. Register page

7. Restaurant discovery page

8. Restaurant cards

9. Restaurant details page

10. Menu/food cards

11. Cart page

12. Basic checkout page

Use realistic mock data for the UI.

Make the result feel like a finished food delivery product, not a wireframe.

Before making major architectural changes, preserve the React/Vite structure and keep the application easy for a developer to continue working on manually.

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://fooodrush.lovable.app

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/a22a5853-0067-4c58-8814-0b5956538d87).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
