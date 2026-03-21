import Link from 'next/link'

export default function HomePage() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center min-h-screen bg-gradient-to-br from-indigo-50 to-white px-4">
      <div className="text-center max-w-2xl">
        <h1 className="text-6xl font-bold text-indigo-600 mb-4">V-Link</h1>
        <p className="text-xl text-gray-600 mb-10">
          Conectăm voluntari cu organizatori. Construim comunități mai puternice.
        </p>
        <div className="flex gap-4 justify-center">
          <Link
            href="/login"
            className="px-6 py-3 rounded-lg border border-indigo-600 text-indigo-600 font-medium hover:bg-indigo-50 transition-colors"
          >
            Autentificare
          </Link>
          <Link
            href="/register"
            className="px-6 py-3 rounded-lg bg-indigo-600 text-white font-medium hover:bg-indigo-700 transition-colors"
          >
            Înregistrare
          </Link>
        </div>
      </div>
    </main>
  )
}
