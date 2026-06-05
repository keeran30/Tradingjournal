import Sidebar from "../components/Sidebar"

export default function SettingsPage() {
  return (
    <main className="min-h-screen bg-zinc-950 text-white flex flex-col md:flex-row">

      <Sidebar />

      <section className="flex-1 p-8">

        <h1 className="text-4xl font-bold mb-2">
          Settings
        </h1>

        <p className="text-zinc-400">
          Account and subscription settings coming soon.
        </p>

      </section>

    </main>
  )
}