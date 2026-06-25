export default function PrivacyPage() {
  return (
    <main className="min-h-screen bg-zinc-950 text-white p-8 max-w-3xl mx-auto">
      <h1 className="text-4xl font-bold mb-8">Privacy Policy</h1>
      <p className="text-zinc-400 mb-4">Last updated: June 2026</p>
      <div className="space-y-6 text-zinc-300">
        <section>
          <h2 className="text-xl font-bold text-white mb-2">1. Information We Collect</h2>
          <p>We collect your email for authentication and trading data you voluntarily enter. We do not access your broker accounts.</p>
        </section>
        <section>
          <h2 className="text-xl font-bold text-white mb-2">2. How We Use Your Data</h2>
          <p>Your data is used exclusively to generate your personal analytics and insights. We never sell or share your data.</p>
        </section>
        <section>
          <h2 className="text-xl font-bold text-white mb-2">3. Data Security</h2>
          <p>All data is encrypted in transit and at rest. Row Level Security isolates each user&apos;s data completely.</p>
        </section>
        <section>
          <h2 className="text-xl font-bold text-white mb-2">4. Cookies</h2>
          <p>We use only essential cookies for authentication. No tracking or advertising cookies.</p>
        </section>
        <section>
          <h2 className="text-xl font-bold text-white mb-2">5. Third-Party Services</h2>
          <p>We use Supabase (database), Stripe (payments), and Groq (AI). Refer to their privacy policies for details.</p>
        </section>
        <section>
          <h2 className="text-xl font-bold text-white mb-2">6. Your Rights</h2>
          <p>You can export or delete all your data anytime from Settings. Contact support@tradevault.pro for assistance.</p>
        </section>
        <section>
          <h2 className="text-xl font-bold text-white mb-2">7. Contact</h2>
          <p>Privacy concerns? Email support@tradevault.pro</p>
        </section>
      </div>
    </main>
  )
}