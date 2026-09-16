"use client";

import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Upload, X, Loader2, ImageOff } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAppLocale } from "@/lib/i18n";

type UploadFolder = "products" | "bills" | "profiles";

interface ImageUploadFieldProps {
  folder: UploadFolder;
  value: string | null | undefined;
  onChange: (url: string | null) => void;
  disabled?: boolean;
}

export function ImageUploadField({ folder, value, onChange, disabled }: ImageUploadFieldProps) {
  const { t } = useAppLocale();
  const { toast } = useToast();
  const [isUploading, setIsUploading] = useState(false);
  const [imageError, setImageError] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    setIsUploading(true);
    setImageError(false);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("folder", folder);
      const response = await fetch("/api/uploads/image", {
        method: "POST",
        credentials: "include",
        body: formData,
      });
      const data = await response.json().catch(() => null);
      if (!response.ok) {
        throw new Error(data?.error || `Upload failed with ${response.status}`);
      }
      onChange(data.url as string);
    } catch (error) {
      toast({
        title: t("imageUpload.failed"),
        description: error instanceof Error ? error.message : undefined,
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="flex items-center gap-3">
      {value && !imageError ? (
        <img
          src={value}
          alt=""
          className="h-16 w-16 rounded-md object-cover border border-border"
          onError={() => setImageError(true)}
        />
      ) : (
        <div className="h-16 w-16 rounded-md border border-dashed border-border flex items-center justify-center text-muted-foreground">
          <ImageOff className="h-5 w-5" />
        </div>
      )}
      <div className="flex flex-col gap-1">
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleFileChange}
          disabled={disabled || isUploading}
        />
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => inputRef.current?.click()}
          disabled={disabled || isUploading}
        >
          {isUploading ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <Upload className="h-4 w-4 mr-2" />
          )}
          {isUploading ? t("imageUpload.uploading") : value ? t("imageUpload.replace") : t("imageUpload.upload")}
        </Button>
        {value ? (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="text-destructive h-6 px-2"
            onClick={() => onChange(null)}
            disabled={disabled || isUploading}
          >
            <X className="h-3.5 w-3.5 mr-1" /> {t("imageUpload.remove")}
          </Button>
        ) : null}
      </div>
    </div>
  );
}
