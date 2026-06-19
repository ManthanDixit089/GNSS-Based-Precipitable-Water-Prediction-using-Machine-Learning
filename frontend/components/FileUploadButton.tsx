import React from "react";

// Generic file upload button for any file type
const FileUploadButton: React.FC<{
  label: string;
  accept?: string;
  onFileLoaded: (file: File, text: string) => void;
}> = ({ label, accept, onFileLoaded }) => {
  const handleChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const text = await file.text();
    onFileLoaded(file, text);
    e.target.value = "";
  };
  return (
    <label className="block cursor-pointer bg-sky-700 hover:bg-sky-800 text-white px-3 py-2 rounded mb-2 text-xs font-semibold">
      {label}
      <input type="file" accept={accept} onChange={handleChange} className="hidden" />
    </label>
  );
};

export default FileUploadButton;
