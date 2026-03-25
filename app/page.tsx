import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { LandingPage } from "@/components/landing-page";
import { authOptions } from "@/lib/auth-options";

export default async function HomePage() {
  const session = await getServerSession(authOptions);
  const role = (session?.user as any)?.role as string | undefined;

  if (role === "POSTER") redirect("/poster");
  if (role === "EYE") redirect("/eye");

  return <LandingPage />;
}
