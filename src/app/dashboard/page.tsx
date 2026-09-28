import { redirect } from "next/navigation";

// /dashboard has no content of its own; the calculator list lives on the home page.
export default function DashboardIndex() {
  redirect("/");
}
