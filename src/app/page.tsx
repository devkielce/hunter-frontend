import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-neutral-50 px-4">
      <h1 className="text-2xl font-bold text-neutral-900 mb-2">
        Hunter – Okazje nieruchomościowe
      </h1>
      <p className="text-neutral-600 mb-8">
        Dashboard do agregowania ofert z komornika, e-licytacji i Facebooka.
      </p>
      <Link
        href="/dashboard"
        className="rounded-lg bg-neutral-900 px-6 py-3 text-white font-medium hover:bg-neutral-800 transition-colors"
      >
        Przejdź do dashboardu
      </Link>
    </div>
  );
}
