import Navigation from "@/components/navigation";
import UrlShortenerForm from "@/components/url-shortener-form";
import StatsOverview from "@/components/stats-overview";
import LinksTable from "@/components/links-table";
import Footer from "@/components/footer";

export default function Dashboard() {
  return (
    <div className="min-h-full bg-slate-50">
      <Navigation />
      
      <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        <UrlShortenerForm />
        <StatsOverview />
        <LinksTable />
      </main>
      
      <Footer />
    </div>
  );
}
