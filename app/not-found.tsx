import Link from "next/link"

export default function NotFound() {
  return (
    <main className="min-h-screen bg-zinc-950 text-white flex items-center justify-center text-center p-4">
      <div>
        <p className="text-8xl font-bold text-yellow-500 mb-4">404</p>
        <h1 className="text-3xl font-bold mb-2">Page Not Found</h1>
        <p className="text-zinc-400 mb-8">The page you're looking for doesn't exist or has been moved.</p>
        <div className="flex gap-4 justify-center">
          <Link href="/" className="bg-yellow-500 hover:bg-yellow-400 text-black px-6 py-3 rounded-xl font-bold transition">Go Home</Link>
          <Link href="/dashboard" className="bg-zinc-800 hover:bg-zinc-700 text-white px-6 py-3 rounded-xl font-bold transition">Dashboard</Link>
        </div>
      </div>
    </main>
  )
}