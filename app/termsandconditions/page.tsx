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
          <p>TradeVault is a trading journal and analytics platform. We provide tools for traders to log, analyze, and improve their trading performance. All insights are educational, not financial advice.</p>
        </section>
        <section>
          <h2 className="text-xl font-bold text-white mb-2">3. User Accounts</h2>
          <p>You are responsible for maintaining the confidentiality of your account credentials. You must be 18 years or older to use this service.</p>
        </section>
        <section>
          <h2 className="text-xl font-bold text-white mb-2">4. No Financial Advice</h2>
          <p>TradeVault does not provide financial advice, trading recommendations, or market predictions. All analytics are based on your historical data for educational purposes only. Trading involves substantial risk of financial loss.</p>
        </section>
        <section>
          <h2 className="text-xl font-bold text-white mb-2">5. Subscription and Payments</h2>
          <p>Premium features require a paid subscription. Payments are processed securely via Stripe. You may cancel your subscription at any time through the Settings page.</p>
        </section>
        <section>
          <h2 className="text-xl font-bold text-white mb-2">6. Limitation of Liability</h2>
          <p>TradeVault and its creators shall not be held liable for any trading losses, damages, or consequences arising from the use of this platform.</p>
        </section>
        <section>
          <h2 className="text-xl font-bold text-white mb-2">7. Contact</h2>
          <p>For questions regarding these terms, contact us at support@tradevault.pro</p>
        </section>
      </div>
    </main>
  )
}