import Link from "next/link";
import { AuthFrame } from "@/components/auth-frame";
import { SignInForm } from "@/components/sign-in-form";

export default function SignInPage() {
  return (
    <AuthFrame
      title="Welcome back"
      description="Sign in to pick up where your ideas left off."
      footer={
        <>
          New to VidyaMotion?{" "}
          <Link href="/sign-up" style={{ color: "#315ceb", fontWeight: 600 }}>
            Create an account
          </Link>
        </>
      }
    >
      <SignInForm />
    </AuthFrame>
  );
}
