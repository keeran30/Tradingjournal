export default function AppLoader({ message = "Loading" }: { message?: string }) {
  return (
    <main className="min-h-screen bg-zinc-950 flex items-center justify-center">
      <div className="text-center">
        <div className="w-8 h-8 border-2 border-yellow-500 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
        <p className="text-zinc-400 text-sm">{message}</p>
      </div>
    </main>
  )
}