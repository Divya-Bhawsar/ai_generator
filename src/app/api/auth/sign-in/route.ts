import { NextRequest, NextResponse } from "next/server";
import { findUserByEmail } from "@/lib/db/users";
import { createSession, verifyPassword } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    let body;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json(
        { error: "Invalid JSON request body." },
        { status: 400 }
      );
    }

    const { email, password } = body || {};

    if (
      !email ||
      typeof email !== "string" ||
      !password ||
      typeof password !== "string"
    ) {
      return NextResponse.json(
        { error: "Valid email and password are required." },
        { status: 400 }
      );
    }

    const normalizedEmail = email.trim().toLowerCase();
    const existingUser = await findUserByEmail(normalizedEmail);

    if (!existingUser) {
      return NextResponse.json(
        {
          error:
            "No account found with this email. Please click 'Create an account' below to register first.",
        },
        { status: 401 }
      );
    }

    const isValid = await verifyPassword(password, existingUser.passwordHash);
    if (!isValid) {
      return NextResponse.json(
        { error: "Incorrect password. Please check your password and try again." },
        { status: 401 }
      );
    }

    await createSession({
      userId: existingUser._id,
      email: existingUser.email,
      name: existingUser.name,
    });

    return NextResponse.json({
      success: true,
      user: {
        id: existingUser._id,
        email: existingUser.email,
        name: existingUser.name,
      },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Authentication failed.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
