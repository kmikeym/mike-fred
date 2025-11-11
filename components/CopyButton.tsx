"use client";

interface CopyButtonProps {
  text: string;
  label: string;
}

export default function CopyButton({ text, label }: CopyButtonProps) {
  return (
    <button
      onClick={() => {
        navigator.clipboard.writeText(text);
      }}
      className="mt-4 px-4 py-2 bg-primary text-white rounded-md hover:bg-accent transition-colors"
    >
      {label}
    </button>
  );
}
