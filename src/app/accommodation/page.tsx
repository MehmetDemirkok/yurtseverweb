import PageHeader from "../components/PageHeader";
import AccommodationTableSection from "../components/AccommodationTableSection";

export default function AccommodationPage() {
  return (
    <div className="w-full mx-auto px-4 py-8 animate-fade-in">
      <PageHeader
        title="Konaklama Kayıtları"
        description="Tüm konaklama kayıtlarını ve işlemlerini yönetin"
        icon={<svg className="w-12 h-12 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 10V7a5 5 0 0110 0v3M5 21h14a2 2 0 002-2v-7a2 2 0 00-2-2H5a2 2 0 00-2 2v7a2 2 0 002 2z" /></svg>}
      />
      <AccommodationTableSection />
    </div>
  );
} 