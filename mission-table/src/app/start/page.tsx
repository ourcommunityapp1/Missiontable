import TopNavBar from "@/components/TopNavBar";
import Footer from "@/components/Footer";
import StartGroupForm from "./StartGroupForm";

export const metadata = {
  title: "Start a Group — Mission Table",
  description: "Start a Mission Table for a nation.",
};

export default function StartPage() {
  return (
    <main className="min-h-screen flex flex-col bg-cream">
      <TopNavBar />
      <div className="flex-1">
        <StartGroupForm />
      </div>
      <Footer />
    </main>
  );
}
