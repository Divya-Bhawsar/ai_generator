import Link from "next/link";
import { AuthFrame } from "@/components/auth-frame";
import { SignUpForm } from "@/components/sign-up-form";

export default function SignUpPage() {
  return (
    <AuthFrame
      title="Create your account"
      description="Your personal space for turning ideas into explainers."
      footer={
        <>
          Already have an account?{" "}
          <Link href="/sign-in" style={{ color: "#315ceb", fontWeight: 600 }}>
            Sign in
          </Link>
        </>
      }
    >
      <SignUpForm />
    </AuthFrame>
  );
}
