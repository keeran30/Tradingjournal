export default function PrivacyPage() {
  return (
    <main className="min-h-screen bg-zinc-950 text-white p-8 max-w-3xl mx-auto">
      <h1 className="text-4xl font-bold mb-8">Privacy Policy</h1>
      <p className="text-zinc-400 mb-6">Last updated: June 2026</p>

      <div className="space-y-8 text-zinc-300">
        <section>
          <h2 className="text-xl font-bold text-white mb-3">1. Information We Collect</h2>
          <p className="leading-relaxed">
            We collect your email address for authentication purposes and trading data that you voluntarily enter into the platform. 
            We do not access, collect, or store any data from your broker accounts or trading platforms.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-white mb-3">2. How We Use Your Data</h2>
          <p className="leading-relaxed">
            Your trading data is used exclusively to generate your personal analytics, AI insights, and performance reports. 
            We never sell, rent, or share your personal data with third parties for marketing purposes.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-white mb-3">3. Data Storage and Security</h2>
          <p className="leading-relaxed">
            All data is stored securely using Supabase with enterprise-grade encryption. 
            Row Level Security (RLS) ensures each user can only access their own data. 
            Data is encrypted in transit (HTTPS) and at rest.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-white mb-3">4. Cookies and Tracking</h2>
          <p className="leading-relaxed">
            We use only essential cookies required for authentication and session management. 
            We do not use tracking cookies, advertising cookies, or any third-party analytics cookies.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-white mb-3">5. Third-Party Services</h2>
          <p className="leading-relaxed">
            We use the following third-party services to operate our platform:
          </p>
          <ul className="list-disc pl-6 mt-2 space-y-1">
            <li>Supabase — Database and authentication</li>
            <li>Stripe — Payment processing</li>
            <li>Groq — AI-powered analytics</li>
          </ul>
          <p className="mt-2 leading-relaxed">
            Please refer to their respective privacy policies for additional information on how they handle your data.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-white mb-3">6. Your Rights</h2>
          <p className="leading-relaxed">
            You have the right to access, export, or permanently delete all your data at any time. 
            You can delete your account and all associated data from the Settings page. 
            For data export requests, contact us at support@tradevault.pro.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-white mb-3">7. Contact Us</h2>
          <p className="leading-relaxed">
            If you have any questions about this Privacy Policy or how your data is handled, 
            please contact us at <a href="mailto:support@tradevault.pro" className="text-yellow-400 hover:text-yellow-300">support@tradevault.pro</a>.
          </p>
        </section>
      </div>
    </main>
  )
}