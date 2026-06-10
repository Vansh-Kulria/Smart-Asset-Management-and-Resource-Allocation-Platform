"use server";

import { prisma } from "@/lib/db";
import bcrypt from "bcryptjs";

export async function registerUser(formData: {
  name: string;
  email: string;
  password?: string;
  role?: string;
  section?: string;
}) {
  try {
    const { name, email, password, role = "CONSUMER", section } = formData;

    if (!name || !email || !password) {
      return { success: false, error: "Please fill all required fields." };
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return { success: false, error: "Email already registered." };
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role,
        section: section || null,
      },
    });

    return { success: true, message: "User registered successfully!" };
  } catch (error: any) {
    console.error("Registration error:", error);
    return { success: false, error: error.message || "An error occurred during registration." };
  }
}
