"use client";

import { useState } from "react";
import { useWallet } from "@aptos-labs/wallet-adapter-react";
import { shelbyClient, aptosContractClient } from "@/lib/services";
import { UploadCloud, Loader2 } from "lucide-react";

export default function Uploader({ onUploadSuccess }: { onUploadSuccess: () => void }) {
  // Extract signAndSubmitTransaction for real adapter wiring
  const { account, signAndSubmitTransaction } = useWallet();
  const [loading, setLoading] = useState(false);
  const [isPublic, setIsPublic] = useState(false);
  const [statusText, setStatusText] = useState("");

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !account) return;

    try {
      setLoading(true);
      setStatusText("Uploading to Shelby Network...");
      const { cid } = await shelbyClient.uploadFile(file);

      setStatusText("Securing metadata on Aptos...");
      // Pass signAndSubmitTransaction as the 3rd parameter to handle real txs
      await aptosContractClient.registerFileMetadata(account.address, {
        cid,
        fileName: file.name,
        size: file.size,
        createdAt: Date.now(),
        isPublic
      }, signAndSubmitTransaction);
      
      onUploadSuccess();
    } catch (e) {
      console.error(e);
      alert("Error on Uploading process.");
    } finally {
      setLoading(false);
      setStatusText("");
      e.target.value = '';
    }
  };

  if (!account) return null;

  return (
    <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 bg-white my-6 shadow-sm">
      <div className="flex flex-col items-center justify-center relative w-full h-32 hover:bg-gray-50 transition rounded-lg">
        <input 
          type="file" 
          disabled={loading}
          onChange={handleFileChange}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-wait" 
        />
        {loading ? (
           <div className="flex flex-col items-center">
             <Loader2 className="w-8 h-8 text-blue-500 animate-spin mb-2" />
             <p className="font-medium text-gray-600">{statusText}</p>
           </div>
        ) : (
           <div className="flex flex-col items-center">
             <UploadCloud className="w-10 h-10 text-gray-400 mb-2" />
             <p className="font-medium text-gray-700">Click or Drop file here to upload</p>
           </div>
        )}
      </div>

      <div className="mt-6 flex items-center justify-center gap-2 border-t border-gray-100 pt-4">
        <input 
          type="checkbox" 
          id="pub" 
          checked={isPublic} 
          onChange={e => setIsPublic(e.target.checked)}
          className="w-4 h-4 rounded border-gray-300" 
        />
        <label htmlFor="pub" className="text-sm font-medium text-gray-700">
          Make this file public (Visible in Network Explorer)
        </label>
      </div>
    </div>
  );
}
