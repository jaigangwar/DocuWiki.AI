"use client";

import { useState, useCallback } from "react";
import { motion } from "framer-motion";
import { Download, Loader2, Archive, CheckCircle } from "lucide-react";
import { NeonButton } from "@/components/ui/NeonButton";
import { getAllFiles } from "@/lib/virtual-fs";

export function ExportButton() {
  const [exporting, setExporting] = useState(false);
  const [done, setDone] = useState(false);

  const handleExport = useCallback(async () => {
    setExporting(true);
    setDone(false);

    try {
      // Dynamic import JSZip to keep bundle lighter
      const JSZip = (await import("jszip")).default;
      const zip = new JSZip();

      // Fetch all files from virtual FS
      const allFiles = await getAllFiles();

      if (allFiles.length === 0) {
        alert("No files to export. Process some PDFs first.");
        setExporting(false);
        return;
      }

      // Add each file to the ZIP
      for (const file of allFiles) {
        zip.file(file.path, file.content);
      }

      // Generate and download
      const blob = await zip.generateAsync({
        type: "blob",
        compression: "DEFLATE",
        compressionOptions: { level: 6 },
      });

      // Trigger download
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `docuwiki-knowledge-base-${new Date().toISOString().slice(0, 10)}.zip`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      setDone(true);
      setTimeout(() => setDone(false), 3000);
    } catch (error) {
      console.error("Export failed:", error);
      alert("Export failed. Please try again.");
    } finally {
      setExporting(false);
    }
  }, []);

  return (
    <NeonButton
      variant={done ? "secondary" : "primary"}
      size="md"
      onClick={handleExport}
      loading={exporting}
      disabled={exporting}
      icon={
        done ? (
          <CheckCircle className="w-4 h-4 text-success" />
        ) : exporting ? undefined : (
          <Download className="w-4 h-4" />
        )
      }
    >
      {done ? "Downloaded!" : exporting ? "Packaging..." : "Export as ZIP"}
    </NeonButton>
  );
}
