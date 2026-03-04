import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background px-4 py-12">
      <h1 className="font-display text-3xl font-bold text-foreground sm:text-4xl mb-2 text-center">
        Hunter
      </h1>
      <p className="text-muted-foreground text-center mb-8 max-w-md">
        Okazje nieruchomościowe — dashboard ofert z komornika, e-licytacji i Facebooka.
      </p>
      <Link
        href="/dashboard"
        className="hunter-btn-gold inline-flex items-center gap-2"
      >
        Przejdź do dashboardu
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
        </svg>
      </Link>
    </div>
  );
}
