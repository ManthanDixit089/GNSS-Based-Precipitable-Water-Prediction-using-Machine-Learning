"use client";

import React, { useRef, useState } from "react";

type FileUploadProps = {
  onFileLoaded: (file: File, text: string) => void;
  accept?: string;
  label?: string;
  disabled?: boolean;
};

const FileUpload: React.FC<FileUploadProps> = ({
  onFileLoaded,
  accept = ".csv,text/csv",
  label = "Upload CSV",
  disabled = false,
}) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    setError(null);
    const file = e.target.files?.[0];
    if (!file) return;
    setFileName(file.name);

    try {
      const text = await file.text();
      onFileLoaded(file, text);
    } catch (err) {
      setError("Failed to read file.");
    }
  };

  return (
    <div className="flex flex-col items-start gap-2 w-full max-w-xs">
      <label className="text-sm text-white/80">{label}</label>
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        disabled={disabled}
        className="block w-full text-xs text-white file:mr-3 file:py-1 file:px-2 file:rounded file:border-0 file:text-xs file:bg-sky-700 file:text-white hover:file:bg-sky-800"
        onChange={handleFileChange}
      />
      {fileName && (
        <div className="text-xs text-sky-300">Selected: {fileName}</div>
      )}
      {error && (
        <div className="text-xs text-red-400">{error}</div>
      )}
    </div>
  );
};

export default FileUpload;