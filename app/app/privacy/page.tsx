export default function PrivacyPage() {
  return (
    <main className="min-h-screen bg-zinc-950 text-white p-8 max-w-3xl mx-auto">
      <h1 className="text-4xl font-bold mb-8">Privacy Policy</h1>
      <p className="text-zinc-400 mb-4">Last updated: June 2026</p>
      
      <div className="space-y-6 text-zinc-300">
        <section>
          <h2 className="text-xl font-bold text-white mb-2">1. Information We Collect</h2>
          <p>We collect your email address for authentication purposes, trading data you voluntarily enter into the platform, and basic usage analytics to improve our service. We do not collect any data from your broker or trading accounts.</p>
        </section>
        <section>
          <h2 className="text-xl font-bold text-white mb-2">2. How We Use Your Data</h2>
          <p>Your trading data is used exclusively to generate your personal analytics, AI insights, and performance reports. Your data is never sold, shared, or used for any purpose outside of providing the TradeVault service to you.</p>
        </section>
        <section>
          <h2 className="text-xl font-bold text-white mb-2">3. Data Storage and Security</h2>
          <p>All data is stored securely using Supabase with Row Level Security enabled. Each user's data is completely isolated from other users. Data is encrypted in transit via HTTPS and encrypted at rest.</p>
        </section>
        <section>
          <h2 className="text-xl font-bold text-white mb-2">4. Cookies</h2>
          <p>We use only essential cookies required for authentication and session management. No tracking or advertising cookies are used on our platform.</p>
        </section>
        <section>
          <h2 className="text-xl font-bold text-white mb-2">5. Third-Party Services</h2>
          <p>We use Supabase for data storage and authentication, Stripe for payment processing, and Groq for AI features. Please refer to their respective privacy policies for additional information.</p>
        </section>
        <section>
          <h2 className="text-xl font-bold text-white mb-2">6. Your Rights</h2>
          <p>You have the right to access, export, or delete all your data at any time. You can delete your account and all associated data from the Settings page. To request a complete data export, contact support@tradevault.pro.</p>
        </section>
        <section>
          <h2 className="text-xl font-bold text-white mb-2">7. Contact</h2>
          <p>For privacy-related inquiries, contact us at support@tradevault.pro</p>
        </section>
      </div>
    </main>
  )
}