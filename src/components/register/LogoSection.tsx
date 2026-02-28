"use client";

// components/register/LogoSection.tsx

import { useRef } from "react";
import { Upload } from "lucide-react";
import { SectionShell } from "./RegisterField";

interface LogoSectionProps {
  preview: string | null;
  file: File | null;
  onSelect: (file: File, preview: string) => void;
}

export function LogoSection({ preview, file, onSelect }: LogoSectionProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    onSelect(f, URL.createObjectURL(f));
  }

  return (
    <SectionShell
      icon={Upload}
      step="Seção 03"
      title="Logo do Estabelecimento"
      subtitle="Imagem exibida no menu virtual dos hóspedes (opcional)"
    >
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleChange}
      />

      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        className="flex w-full flex-col items-center justify-center gap-3 rounded-lg py-10 transition-colors hover:border-[rgba(201,169,110,0.45)]"
        style={{
          border: "1.5px dashed rgba(201,169,110,0.25)",
          background: "rgba(201,169,110,0.03)",
        }}
      >
        {preview ? (
          <>
            <img
              src={preview}
              alt="Preview da logo"
              className="h-24 w-24 rounded-full object-cover"
              style={{ border: "2px solid rgba(201,169,110,0.4)" }}
            />
            <p
              className="text-[0.75rem]"
              style={{ color: "#C9A96E" }}
            >
              Clique para trocar
            </p>
            {file && (
              <p
                className="text-[0.7rem]"
                style={{ color: "#6B6560" }}
              >
                {file.name}
              </p>
            )}
          </>
        ) : (
          <>
            <div
              className="flex h-14 w-14 items-center justify-center rounded-full"
              style={{
                border: "1px solid rgba(201,169,110,0.3)",
                background: "rgba(201,169,110,0.07)",
              }}
            >
              <Upload
                size={20}
                style={{ color: "#C9A96E" }}
              />
            </div>
            <div className="text-center">
              <p
                className="text-[0.82rem]"
                style={{ color: "#F0EDE8" }}
              >
                Clique para fazer upload
              </p>
              <p
                className="mt-0.5 text-[0.72rem]"
                style={{ color: "#6B6560" }}
              >
                PNG, JPG ou SVG — máx. 2MB
              </p>
            </div>
          </>
        )}
      </button>
    </SectionShell>
  );
}
