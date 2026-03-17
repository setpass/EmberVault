"use client";

import { useEffect, useState } from "react";
import type { FileMetadataView } from "aptos-adapter";
import { aptosContractClient } from "@/lib/services";
import FileTable from "@/components/file-table";

export default function ExplorerPage() {
  const [files, setFiles] = useState<FileMetadataView[]>([]);

  useEffect(() => {
    aptosContractClient.getAllPublicFiles().then(setFiles);
  }, []);

  return (
    <div>
      <div className="mb-8 border-b border-gray-200 pb-6">
        <h1 className="text-3xl font-extrabold text-gray-900">Network Explorer</h1>
        <p className="text-gray-500 mt-2">Discover public data sets uploaded to the Shelby Network.</p>
      </div>
      
      <FileTable files={files} title="Public Network Files" />
    </div>
  );
}
