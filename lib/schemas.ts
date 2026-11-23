import { z } from "zod";

export const serviceCategories = [
  "venue",
  "catering",
  "photography",
  "decoration",
  "music",
  "makeup",
] as const;

const passwordSchema = z
  .string()
  .min(6, "Password must be at least 6 characters")
  .regex(/[A-Z]/, "Add at least one uppercase letter")
  .regex(/[a-z]/, "Add at least one lowercase letter");

export function passwordChecks(password: string) {
  return [
    { label: "At least 6 characters", ok: password.length >= 6 },
    { label: "One uppercase letter", ok: /[A-Z]/.test(password) },
    { label: "One lowercase letter", ok: /[a-z]/.test(password) },
  ];
}

export const signUpSchema = z.object({
  name: z.string().min(1, "Name is required").max(100),
  email: z.string().email("Enter a valid email"),
  password: passwordSchema,
  role: z.enum(["customer", "vendor"]),
});

export type SignUpValues = z.infer<typeof signUpSchema>;

export const signInSchema = z.object({
  email: z.string().email("Enter a valid email"),
  password: z.string().min(1, "Password is required"),
});

export type SignInValues = z.infer<typeof signInSchema>;

export const serviceSchema = z.object({
  serviceName: z.string().min(3, "Name needs at least 3 characters").max(120),
  category: z.enum(serviceCategories, { message: "Pick a category" }),
  description: z.string().min(10, "Describe the service (min 10 characters)").max(5000),
  price: z.number({ message: "Enter a price" }).min(0, "Price can't be negative"),
  location: z.string().min(2, "Location is required").max(200),
  images: z.array(z.string().url()).max(10).default([]),
});

export type ServiceValues = z.infer<typeof serviceSchema>;

export const bookingSchema = z.object({
  eventDate: z.string().min(1, "Pick a date"),
  eventTime: z.string().min(1, "Pick a time"),
  eventLocation: z.string().min(2, "Event location is required").max(200),
  phone: z
    .string()
    .min(6, "Enter a valid phone number")
    .max(30, "Phone number is too long")
    .regex(/^[+\d][\d\s-]*$/, "Enter a valid phone number"),
  message: z.string().max(1000).optional(),
});

export type BookingValues = z.infer<typeof bookingSchema>;

export function bookingToISO(date: string, time: string) {
  const d = new Date(`${date}T${time}:00`);
  if (Number.isNaN(d.getTime())) return null;
  if (d.getTime() <= Date.now()) return null;
  return d.toISOString();
}

export const profileSchema = z.object({
  name: z.string().min(1, "Name is required").max(100),
  image: z.string().url("Enter a valid image URL").or(z.literal("")),
  businessName: z.string().max(150).optional(),
  phone: z.string().max(30).optional(),
});

export type ProfileValues = z.infer<typeof profileSchema>;
