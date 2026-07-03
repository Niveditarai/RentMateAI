import Link from 'next/link';
import { Home } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="border-t border-[#E2E8F0]/30 dark:border-[#1E293B]/60 bg-[#F8FAFC] dark:bg-[#070A13] mt-auto">
      <div className="max-w-7xl mx-auto px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          
          {/* Brand Info */}
          <div className="md:col-span-2 space-y-4">
            <Link href="/" className="flex items-center gap-2 font-bold text-xl tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-cyan-500">
              <Home className="h-6 w-6 text-blue-600" />
              <span>RentMate AI</span>
            </Link>
            <p className="text-sm text-slate-500 dark:text-slate-400 max-w-sm">
              Find the perfect room. Find the perfect flatmate. Powered by AI compatibility matching to deliver secure, premium co-living rentals.
            </p>
          </div>

          {/* Nav links */}
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-400">Discover</h3>
            <ul className="mt-4 space-y-2 text-sm text-slate-500 dark:text-slate-400">
              <li>
                <Link href="/listings" className="hover:text-blue-500 transition-colors">Find Rooms</Link>
              </li>
              <li>
                <Link href="/auth/signup" className="hover:text-blue-500 transition-colors">List a Property</Link>
              </li>
            </ul>
          </div>

          {/* Legal Info */}
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-400">Company</h3>
            <ul className="mt-4 space-y-2 text-sm text-slate-500 dark:text-slate-400">
              <li>
                <span className="cursor-pointer hover:text-blue-500 transition-colors">Privacy Policy</span>
              </li>
              <li>
                <span className="cursor-pointer hover:text-blue-500 transition-colors">Terms of Service</span>
              </li>
            </ul>
          </div>

        </div>

        {/* copyright banner */}
        <div className="mt-8 border-t border-slate-200/10 dark:border-slate-800/40 pt-8 flex items-center justify-between text-xs text-slate-400">
          <span>&copy; {new Date().getFullYear()} RentMate AI Inc. All rights reserved.</span>
          <span className="flex gap-4">
            <span>Built like a startup.</span>
          </span>
        </div>
      </div>
    </footer>
  );
}
