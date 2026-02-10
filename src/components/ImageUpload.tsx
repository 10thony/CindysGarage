import { useState } from "react";
import { useUploadThing } from "../lib/uploadthing";
import { Button } from "./ui/button";
import { Card, CardContent } from "./ui/card";
import { Upload, X, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface ImageUploadProps {
  value?: string;
  onChange: (url: string) => void;
  disabled?: boolean;
  className?: string;
}

export function ImageUpload({
  value,
  onChange,
  disabled = false,
  className = "",
}: ImageUploadProps) {
  const [preview, setPreview] = useState<string | null>(value || null);
  const { startUpload, isUploading } = useUploadThing("imageUploader", {
    onClientUploadComplete: (res) => {
      if (res && res[0]) {
        const url = res[0].url;
        setPreview(url);
        onChange(url);
      }
    },
    onUploadError: (error) => {
      console.error("Upload error:", error);
      alert("Failed to upload image. Please try again.");
    },
  });

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      alert("Please select an image file");
      return;
    }

    // Validate file size (16MB max)
    if (file.size > 16 * 1024 * 1024) {
      alert("Image size must be less than 16MB");
      return;
    }

    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreview(reader.result as string);
    };
    reader.readAsDataURL(file);

    // Start upload
    await startUpload([file]);
  };

  const handleRemove = () => {
    setPreview(null);
    onChange("");
  };

  return (
    <div className={className}>
      <AnimatePresence mode="wait">
        {preview ? (
          <motion.div
            key="preview"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="relative"
          >
            <Card className="card-gradient border-2 border-border/50 shadow-elegant overflow-hidden">
              <CardContent className="p-0">
                <div className="relative aspect-square bg-muted">
                  <img
                    src={preview}
                    alt="Preview"
                    className="w-full h-full object-cover"
                  />
                  {isUploading && (
                    <div className="absolute inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center">
                      <div className="text-center">
                        <Loader2 className="h-8 w-8 animate-spin text-white mx-auto mb-2" />
                        <p className="text-sm text-white font-medium">
                          Uploading...
                        </p>
                      </div>
                    </div>
                  )}
                  <Button
                    type="button"
                    variant="destructive"
                    size="icon"
                    className="absolute top-2 right-2"
                    onClick={handleRemove}
                    disabled={isUploading || disabled}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ) : (
          <motion.div
            key="upload"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
          >
            <Card className="card-gradient border-2 border-border/50 shadow-elegant">
              <CardContent className="p-6">
                <label
                  htmlFor="image-upload"
                  className="flex flex-col items-center justify-center cursor-pointer"
                >
                  <div className="p-4 rounded-full bg-primary/10 mb-4">
                    {isUploading ? (
                      <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    ) : (
                      <Upload className="h-8 w-8 text-primary" />
                    )}
                  </div>
                  <p className="text-sm font-medium mb-1">
                    {isUploading ? "Uploading..." : "Click to upload image"}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    PNG, JPG, GIF up to 16MB
                  </p>
                  <input
                    id="image-upload"
                    type="file"
                    accept="image/*"
                    onChange={handleFileSelect}
                    disabled={isUploading || disabled}
                    className="hidden"
                  />
                </label>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
