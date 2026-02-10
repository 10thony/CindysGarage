import { useState, useEffect } from "react";
import { useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Card, CardContent } from "./ui/card";
import { ImageUpload } from "./ImageUpload";
import { X, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface ItemFormProps {
  garageId: Id<"garages">;
  itemId?: Id<"items">;
  initialData?: {
    name: string;
    imageUrl: string;
    initialPrice: number;
    salePrice: number;
  };
  onSuccess: () => void;
  onCancel: () => void;
}

export function ItemForm({
  garageId,
  itemId,
  initialData,
  onSuccess,
  onCancel,
}: ItemFormProps) {
  const [name, setName] = useState(initialData?.name || "");
  const [imageUrl, setImageUrl] = useState(initialData?.imageUrl || "");
  const [initialPrice, setInitialPrice] = useState(
    initialData?.initialPrice?.toString() || ""
  );
  const [salePrice, setSalePrice] = useState(
    initialData?.salePrice?.toString() || ""
  );
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const createItem = useMutation(api.items.createItem);
  const updateItem = useMutation(api.items.updateItem);

  useEffect(() => {
    if (initialData) {
      setName(initialData.name);
      setImageUrl(initialData.imageUrl);
      setInitialPrice(initialData.initialPrice.toString());
      setSalePrice(initialData.salePrice.toString());
    }
  }, [initialData]);

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!name.trim()) {
      newErrors.name = "Item name is required";
    }

    if (!imageUrl.trim()) {
      newErrors.imageUrl = "Image is required";
    }

    const initialPriceNum = parseFloat(initialPrice);
    if (isNaN(initialPriceNum) || initialPriceNum <= 0) {
      newErrors.initialPrice = "Initial price must be greater than 0";
    }

    const salePriceNum = parseFloat(salePrice);
    if (isNaN(salePriceNum) || salePriceNum <= 0) {
      newErrors.salePrice = "Sale price must be greater than 0";
    }

    if (salePriceNum > initialPriceNum) {
      newErrors.salePrice = "Sale price cannot be greater than initial price";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) {
      return;
    }

    setIsSubmitting(true);

    try {
      if (itemId) {
        // Update existing item
        await updateItem({
          itemId,
          name: name.trim(),
          imageUrl: imageUrl.trim(),
          initialPrice: parseFloat(initialPrice),
          salePrice: parseFloat(salePrice),
        });
      } else {
        // Create new item
        await createItem({
          garageId,
          name: name.trim(),
          imageUrl: imageUrl.trim(),
          initialPrice: parseFloat(initialPrice),
          salePrice: parseFloat(salePrice),
        });
      }

      onSuccess();
    } catch (error) {
      console.error("Failed to save item:", error);
      alert(
        error instanceof Error ? error.message : "Failed to save item. Please try again."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
        onClick={onCancel}
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          onClick={(e) => e.stopPropagation()}
          className="w-full max-w-2xl max-h-[90vh] overflow-y-auto"
        >
          <Card className="card-gradient border-2 border-border/50 shadow-elegant-xl">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold">
                  {itemId ? "Edit Item" : "Add New Item"}
                </h2>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={onCancel}
                  disabled={isSubmitting}
                >
                  <X className="h-5 w-5" />
                </Button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Image Upload */}
                <div>
                  <label className="text-sm font-medium mb-2 block">
                    Item Image <span className="text-destructive">*</span>
                  </label>
                  <ImageUpload
                    value={imageUrl}
                    onChange={setImageUrl}
                    disabled={isSubmitting}
                  />
                  {errors.imageUrl && (
                    <p className="text-sm text-destructive mt-1">
                      {errors.imageUrl}
                    </p>
                  )}
                </div>

                {/* Item Name */}
                <div>
                  <label htmlFor="name" className="text-sm font-medium mb-2 block">
                    Item Name <span className="text-destructive">*</span>
                  </label>
                  <Input
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Enter item name"
                    disabled={isSubmitting}
                    className={errors.name ? "border-destructive" : ""}
                  />
                  {errors.name && (
                    <p className="text-sm text-destructive mt-1">{errors.name}</p>
                  )}
                </div>

                {/* Prices */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label
                      htmlFor="initialPrice"
                      className="text-sm font-medium mb-2 block"
                    >
                      Initial Price <span className="text-destructive">*</span>
                    </label>
                    <Input
                      id="initialPrice"
                      type="number"
                      step="0.01"
                      min="0.01"
                      value={initialPrice}
                      onChange={(e) => setInitialPrice(e.target.value)}
                      placeholder="0.00"
                      disabled={isSubmitting}
                      className={errors.initialPrice ? "border-destructive" : ""}
                    />
                    {errors.initialPrice && (
                      <p className="text-sm text-destructive mt-1">
                        {errors.initialPrice}
                      </p>
                    )}
                  </div>

                  <div>
                    <label
                      htmlFor="salePrice"
                      className="text-sm font-medium mb-2 block"
                    >
                      Sale Price <span className="text-destructive">*</span>
                    </label>
                    <Input
                      id="salePrice"
                      type="number"
                      step="0.01"
                      min="0.01"
                      value={salePrice}
                      onChange={(e) => setSalePrice(e.target.value)}
                      placeholder="0.00"
                      disabled={isSubmitting}
                      className={errors.salePrice ? "border-destructive" : ""}
                    />
                    {errors.salePrice && (
                      <p className="text-sm text-destructive mt-1">
                        {errors.salePrice}
                      </p>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-3 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={onCancel}
                    disabled={isSubmitting}
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={isSubmitting}
                    className="flex-1"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      itemId ? "Update Item" : "Create Item"
                    )}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
