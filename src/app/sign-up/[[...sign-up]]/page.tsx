import { SignUp } from "@clerk/nextjs";
import Link from "next/link";
import { AuthFrame } from "@/components/auth-frame";

export default function SignUpPage() {
  return (
    <AuthFrame
      title="Create your account"
      description="Your personal space for turning ideas into explainers."
      footer={<>Already have an account? <Link href="/sign-in">Sign in</Link></>}
    >
      <SignUp
        routing="path"
        path="/sign-up"
        signInUrl="/sign-in"
        fallbackRedirectUrl="/dashboard"
        appearance={{
          elements: {
            rootBox: "clerk-root-box",
            card: "clerk-auth-card",
            headerTitle: "clerk-hidden",
            headerSubtitle: "clerk-hidden",
            socialButtonsBlockButton: "clerk-social-button",
            formButtonPrimary: "clerk-primary-button",
            formFieldInput: "clerk-field-input",
            footer: "clerk-hidden",
          },
        }}
      />
    </AuthFrame>
  );
}
