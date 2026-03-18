"use client";

import { useWallet } from "@aptos-labs/wallet-adapter-react";
import { useEffect, useState } from "react";
import type { FileMetadataView } from "aptos-adapter";
import { aptosContractClient } from "@/lib/services";
import Uploader from "@/components/uploader";
import FileTable from "@/components/file-table";
import StakePanel from "@/components/stake-panel";
import FundAccount from "@/components/fund-account";

export default function Home() {
  const { account, connected } = useWallet();
  const [files, setFiles] = useState<FileMetadataView[]>([]);

  const loadData = async () => {
    if (!account) {
      setFiles([]);
      return;
    }
    try {
      const data = await aptosContractClient.getUserFiles(account.address);
      setFiles(data);
    } catch (error) {
      console.error("Failed to load user files:", error);
      setFiles([]);
    }
  };

  useEffect(() => {
    loadData();
  }, [account, connected]);

  if (!connected) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
        <h2 className="text-4xl font-extrabold text-gray-900 mb-4 tracking-tight">Your Decentralized Vault</h2>
        <p className="text-gray-500 max-w-md text-lg">Connect your Aptos Wallet to start uploading files to Shelby Storage Protocol.</p>
      </div>
    );
  }

  return (
    <div className="pb-12">
      <Uploader onUploadSuccess={loadData} />
      
      <FileTable files={files} title="Your Private Vault" />
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-12 pt-8 border-t border-gray-200">
        <StakePanel />
        <FundAccount />
      </div>
    </div>
  );
}
