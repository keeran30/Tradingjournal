export default function TermsPage() {
  return (
    <main className="min-h-screen bg-zinc-950 text-white p-8 max-w-3xl mx-auto">
      <h1 className="text-4xl font-bold mb-8">Terms of Service</h1>
      <p className="text-zinc-400 mb-4">Last updated: June 2026</p>
      <div className="space-y-6 text-zinc-300">
        <section>
          <h2 className="text-xl font-bold text-white mb-2">1. Acceptance of Terms</h2>
          <p>By using TradeVault, you agree to these terms. If you disagree, do not use the service.</p>
        </section>
        <section>
          <h2 className="text-xl font-bold text-white mb-2">2. Description of Service</h2>
          <p>TradeVault is a trading journal and analytics platform. All insights are educational, not financial advice. Trading involves substantial risk of loss.</p>
        </section>
        <section>
          <h2 className="text-xl font-bold text-white mb-2">3. User Accounts</h2>
          <p>You are responsible for your account security. You must be 18 years or older to use this service.</p>
        </section>
        <section>
          <h2 className="text-xl font-bold text-white mb-2">4. No Financial Advice</h2>
          <p>TradeVault does not provide financial advice, trading recommendations, or market predictions.</p>
        </section>
        <section>
          <h2 className="text-xl font-bold text-white mb-2">5. Subscription and Payments</h2>
          <p>Premium features require a paid subscription. Payments are processed via Stripe. Cancel anytime from Settings.</p>
        </section>
        <section>
          <h2 className="text-xl font-bold text-white mb-2">6. Limitation of Liability</h2>
          <p>TradeVault shall not be held liable for any trading losses or damages from using this platform.</p>
        </section>
        <section>
          <h2 className="text-xl font-bold text-white mb-2">7. Contact</h2>
          <p>Questions? Contact support@tradevault.pro</p>
        </section>
      </div>
    </main>
  )
}