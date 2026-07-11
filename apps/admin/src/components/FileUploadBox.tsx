import { UploadCloud } from 'lucide-react';

export function FileUploadBox({ label, accept, onFile }: { label: string; accept?: string; onFile: (file: File) => void }) {
  return (
    <label className="uploadBox">
      <UploadCloud size={28} />
      <strong>{label}</strong>
      <span>Click to select a file</span>
      <input type="file" accept={accept} onChange={(event) => {
        const file = event.target.files?.[0];
        if (file) onFile(file);
        event.currentTarget.value = '';
      }} />
    </label>
  );
}
