"use client";

import { useWallet } from "@aptos-labs/wallet-adapter-react";
import { ENV } from "@/lib/env";

export default function FundAccount() {
  const { account } = useWallet();
  
  if (!account) return null;

  return (
    <div className="bg-white p-6 border border-gray-200 rounded-xl shadow-sm h-full">
      <h3 className="font-bold text-lg text-gray-900 mb-2">Fund Account</h3>
      <div className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 mb-3">
        Network: {ENV.APTOS_NETWORK}
      </div>
      
      {ENV.APTOS_NETWORK === "testnet" || ENV.APTOS_NETWORK === "devnet" ? (
        <button 
          onClick={() => window.open(`https://aptoslabs.com/testnet-faucet`, "_blank")}
          className="w-full bg-blue-50 text-blue-700 px-4 py-2.5 rounded-lg font-medium hover:bg-blue-100 transition border border-blue-200"
        >
          Claim Faucet (Testnet APT)
        </button>
      ) : (
        <p className="text-sm text-gray-500 bg-gray-50 p-3 rounded-lg border border-gray-200">
          Mainnet On-ramp integrations (MoonPay) will be available soon.
        </p>
      )}
    </div>
  );
}
