"use client";

import { useState } from "react";
import { useWallet } from "@aptos-labs/wallet-adapter-react";
import { aptosContractClient } from "@/lib/services";

export default function StakePanel() {
  // Extract signAndSubmitTransaction for real adapter wiring
  const { account, signAndSubmitTransaction } = useWallet();
  const [amount, setAmount] = useState("");
  const [loading, setLoading] = useState(false);

  const handleStake = async () => {
    if (!account || !amount) return;
    setLoading(true);
    try {
      // Pass signAndSubmitTransaction down to handle real on-chain staking calls
      await aptosContractClient.stakeApt(account.address, Number(amount), signAndSubmitTransaction);
      alert(`Successfully processed stake of ${amount} APT.`);
      setAmount("");
    } catch (e) {
      alert("Failed to stake APT");
    } finally {
      setLoading(false);
    }
  };

  if (!account) return null;

  return (
    <div className="bg-white p-6 border border-gray-200 rounded-xl shadow-sm">
      <h3 className="font-bold text-lg text-gray-900">Stake APT for Quota</h3>
      <p className="text-sm text-gray-500 mb-4">Increase your hot storage limit by staking APT.</p>
      <div className="flex gap-3">
        <input 
          type="number" 
          value={amount} 
          onChange={(e) => setAmount(e.target.value)} 
          placeholder="Amount (APT)" 
          className="border border-gray-300 px-4 py-2 rounded-lg flex-1 outline-none focus:ring-2 focus:ring-blue-500 transition"
          min="0"
          step="0.1"
        />
        <button 
          onClick={handleStake} 
          disabled={loading || !amount || Number(amount) <= 0}
          className="bg-black text-white px-6 py-2 rounded-lg font-medium hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition"
        >
          {loading ? "Staking..." : "Stake"}
        </button>
      </div>
    </div>
  );
}
