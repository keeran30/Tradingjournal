"use client"

import { useState } from "react"
import Sidebar from "../components/Sidebar"

export default function ContactPage() {
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [phone, setPhone] = useState("")
  const [message, setMessage] = useState("")
  const [sent, setSent] = useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setSent(true)
    setName("")
    setEmail("")
    setPhone("")
    setMessage("")
    setTimeout(() => setSent(false), 5000)
  }

  return (
    <main className="min-h-screen bg-zinc-950 text-white flex flex-col md:flex-row">
      <Sidebar />
      <section className="flex-1 p-4 md:p-8 overflow-y-auto">
        <h1 className="text-3xl md:text-4xl font-bold mb-2">Contact Us</h1>
        <p className="text-zinc-400 mb-8">Questions? We are here to help.</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl">
          <div className="bg-zinc-900 p-6 rounded-2xl border border-zinc-800">
            <h3 className="font-bold text-lg mb-4">Send a Message</h3>
            {sent ? (
              <div className="bg-green-900/30 border border-green-500/30 p-4 rounded-xl text-green-400">
                Message sent! We will reply within 24 hours.
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-zinc-400 text-sm mb-1">Name</label>
                  <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name" className="w-full p-3 bg-zinc-800 rounded-xl border border-zinc-700 focus:border-yellow-500 outline-none" required />
                </div>
                <div>
                  <label className="block text-zinc-400 text-sm mb-1">Email</label>
                  <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" className="w-full p-3 bg-zinc-800 rounded-xl border border-zinc-700 focus:border-yellow-500 outline-none" required />
                </div>
                <div>
                  <label className="block text-zinc-400 text-sm mb-1">Phone (optional)</label>
                  <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+1 (555) 000-0000" className="w-full p-3 bg-zinc-800 rounded-xl border border-zinc-700 focus:border-yellow-500 outline-none" />
                </div>
                <div>
                  <label className="block text-zinc-400 text-sm mb-1">Message</label>
                  <textarea value={message} onChange={(e) => setMessage(e.target.value)} placeholder="Tell us what is on your mind..." rows={4} className="w-full p-3 bg-zinc-800 rounded-xl border border-zinc-700 focus:border-yellow-500 outline-none resize-none" required />
                </div>
                <button type="submit" className="w-full bg-yellow-500 hover:bg-yellow-400 text-black py-3 rounded-xl font-bold transition">Send Message</button>
              </form>
            )}
          </div>
          <div className="space-y-6">
            <div className="bg-zinc-900 p-6 rounded-2xl border border-zinc-800">
              <h3 className="font-bold text-lg mb-4">Contact Info</h3>
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">📧</span>
                  <div>
                    <p className="text-zinc-400 text-sm">Email</p>
                    <p className="text-white font-medium">support@tradevault.pro</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-2xl">📞</span>
                  <div>
                    <p className="text-zinc-400 text-sm">Phone</p>
                    <p className="text-white font-medium">0451 406 141</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  )
}