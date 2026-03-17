"use client";

import Link from "next/link";
import { useWallet } from "@aptos-labs/wallet-adapter-react";

export default function Header() {
  const { account, connected, connect, disconnect, wallets } = useWallet();

  return (
    <header className="bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center shadow-sm">
      <div className="flex items-center gap-8">
        <Link href="/" className="text-xl font-bold tracking-tight text-gray-900">
          Shelby Storage
        </Link>
        <nav className="flex gap-4 text-sm font-medium text-gray-500">
          <Link href="/" className="hover:text-black transition">Dashboard</Link>
          <Link href="/explorer" className="hover:text-black transition">Explorer</Link>
        </nav>
      </div>

      <div>
        {!connected ? (
          <button 
            onClick={() => connect(wallets[0].name)}
            className="bg-black text-white px-5 py-2 rounded-md font-medium text-sm hover:bg-gray-800 transition"
          >
            Connect Wallet
          </button>
        ) : (
          <div className="flex items-center gap-4">
            <span className="text-sm font-mono text-gray-600 bg-gray-100 px-3 py-1 rounded border border-gray-200">
              {account?.address.slice(0, 6)}...{account?.address.slice(-4)}
            </span>
            <button onClick={disconnect} className="text-sm text-red-500 font-medium hover:underline">
              Disconnect
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
