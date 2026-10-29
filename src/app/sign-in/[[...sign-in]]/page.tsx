import { SignIn } from "@clerk/nextjs";
import Link from "next/link";
import { AuthFrame } from "@/components/auth-frame";

export default function SignInPage() {
  return (
    <AuthFrame
      title="Welcome back"
      description="Sign in to pick up where your ideas left off."
      footer={<>New to VidyaMotion? <Link href="/sign-up">Create an account</Link></>}
    >
      <SignIn
        routing="path"
        path="/sign-in"
        signUpUrl="/sign-up"
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
