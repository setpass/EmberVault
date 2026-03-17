"use client";

import { FileMetadataView } from "aptos-adapter";
import { shelbyClient } from "@/lib/services";

export default function FileTable({ files, title }: { files: FileMetadataView[], title: string }) {
  const handleDownload = async (cid: string) => {
    try {
      const blobUrl = await shelbyClient.downloadFile(cid);
      window.open(blobUrl, "_blank"); 
    } catch (e) {
      alert("Failed to download file");
    }
  };

  return (
    <div className="mb-8">
      <h2 className="text-xl font-bold mb-4 text-gray-900">{title}</h2>
      {files.length === 0 ? (
        <p className="text-gray-500 bg-white p-6 border border-gray-200 rounded-xl text-center shadow-sm">No files found.</p>
      ) : (
        <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden text-sm">
          <table className="w-full text-left">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="p-4 font-semibold text-gray-600">File Name</th>
                <th className="p-4 font-semibold text-gray-600 hidden md:table-cell">Owner Address</th>
                <th className="p-4 font-semibold text-gray-600">Shelby CID</th>
                <th className="p-4 font-semibold text-gray-600 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-gray-700">
              {files.map((f, i) => (
                <tr key={i} className="hover:bg-gray-50 transition">
                  <td className="p-4 font-medium">{f.fileName}</td>
                  <td className="p-4 font-mono text-xs hidden md:table-cell text-gray-500">{f.ownerAddress.slice(0, 12)}...</td>
                  <td className="p-4 font-mono text-xs text-gray-500"><span className="bg-gray-100 px-2 py-1 rounded">{f.cid.slice(0, 16)}...</span></td>
                  <td className="p-4 text-right">
                    <button onClick={() => handleDownload(f.cid)} className="text-blue-600 font-medium hover:text-blue-800 transition">
                      Download
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
