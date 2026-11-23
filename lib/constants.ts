export type Role = "customer" | "vendor" | "admin";

export type ServiceCategory =
  | "venue"
  | "catering"
  | "photography"
  | "decoration"
  | "music"
  | "makeup";

export const CATEGORIES: { value: ServiceCategory; label: string; blurb: string }[] = [
  { value: "venue", label: "Venues", blurb: "Halls, resorts & open-air spaces" },
  { value: "catering", label: "Catering", blurb: "Traditional & fusion menus" },
  { value: "photography", label: "Photography", blurb: "Wedding stories in frames" },
  { value: "decoration", label: "Decoration", blurb: "Stages, florals & lighting" },
  { value: "music", label: "Music", blurb: "Bands, DJs & live artists" },
  { value: "makeup", label: "Makeup", blurb: "Bridal looks & styling" },
];

export const CATEGORY_LABELS: Record<ServiceCategory, string> = Object.fromEntries(
  CATEGORIES.map((c) => [c.value, c.label]),
) as Record<ServiceCategory, string>;

export interface Service {
  _id: string;
  vendorId: string;
  serviceName: string;
  category: ServiceCategory;
  description: string;
  price: number;
  location: string;
  images: string[];
  status: "pending" | "approved" | "rejected";
  isActive: boolean;
  vendor?: { name?: string; image?: string; businessName?: string };
  createdAt: string;
  updatedAt: string;
}

export type BookingStatus = "pending" | "accepted" | "rejected" | "cancelled";

export interface BookingCustomer {
  _id: string;
  name?: string;
  email?: string;
  image?: string;
  phone?: string;
}

export interface Booking {
  _id: string;
  serviceId: string | (Pick<Service, "_id" | "serviceName" | "images" | "price" | "location"> & { vendorId?: string });
  vendorId: string;
  customerId: string | BookingCustomer;
  customer?: BookingCustomer;
  phone?: string;
  eventDate: string;
  eventLocation: string;
  message?: string;
  status: BookingStatus;
  createdAt: string;
  updatedAt: string;
}

export function bookingCustomer(b: Booking): BookingCustomer | null {
  if (b.customer && typeof b.customer === "object") return b.customer;
  if (b.customerId && typeof b.customerId === "object") return b.customerId;
  return null;
}

export interface BackendUser {
  _id: string;
  name: string;
  email: string;
  image?: string;
  phone?: string;
  role: Role;
  isBlocked: boolean;
  roleSelected: boolean;
  businessName?: string;
  subscriptionPlan: "free" | "premium";
  subscriptionExpiresAt: string | null;
  stripeCustomerId: string | null;
  effectivePlan: "free" | "premium";
  createdAt: string;
  updatedAt: string;
}

export interface Pagination {
  page: number;
  limit: number;
  total: number;
  pages: number;
}

export interface Transaction {
  _id: string;
  vendorId?: string;
  vendor?: { name?: string; email?: string };
  plan: string;
  amount: number;
  currency?: string;
  status: "paid" | "failed" | "refunded" | "expired";
  stripeSessionId?: string;
  createdAt: string;
}

export function formatPrice(price: number) {
  return `৳${price.toLocaleString("en-IN")}`;
}

export function formatDate(value: string | Date) {
  return new Date(value).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}
