"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useMemo, useState } from "react";
import { Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

export function ReviewModal({
  open,
  onClose,
  onSubmit,
  pending,
}: {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: { rating: number; review: string }) => void;
  pending?: boolean;
}) {
  const [rating, setRating] = useState<number>(5);
  const [review, setReview] = useState<string>("");

  const canSubmit = useMemo(() => {
    return Number.isInteger(rating) && rating >= 1 && rating <= 5 && review.trim().length >= 3;
  }, [rating, review]);

  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.div
            className="w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-xl"
            initial={{ y: 24, scale: 0.98 }}
            animate={{ y: 0, scale: 1 }}
            exit={{ y: 24, scale: 0.98 }}
            transition={{ type: "spring", stiffness: 320, damping: 28 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="border-b border-slate-200 px-4 py-3">
              <h3 className="text-base font-semibold text-slate-900">
                Rate the Eye
              </h3>
              <p className="text-xs text-slate-600">
                Your rating helps keep the marketplace trust-first.
              </p>
            </div>

            <div className="space-y-4 p-4">
              <div className="space-y-2">
                <p className="text-sm font-medium text-slate-900">Rating</p>
                <div className="flex items-center gap-2">
                  {Array.from({ length: 5 }).map((_, idx) => {
                    const v = idx + 1;
                    const active = v <= rating;
                    return (
                      <Button
                        key={v}
                        type="button"
                        variant={active ? "default" : "outline"}
                        size="sm"
                        className="min-w-0 px-2"
                        onClick={() => setRating(v)}
                      >
                        <Star className="mr-1 h-4 w-4" />
                        {v}
                      </Button>
                    );
                  })}
                </div>
              </div>

              <div className="space-y-2">
                <p className="text-sm font-medium text-slate-900">Review</p>
                <Textarea
                  placeholder="Share what went well (min 3 characters)"
                  value={review}
                  onChange={(e) => setReview(e.target.value)}
                />
              </div>

              {/* Hidden input to keep rating in form-like shape if needed later */}
              <Input type="hidden" value={rating} />

              <div className="flex items-center gap-2">
                <Button type="button" variant="outline" className="flex-1" onClick={onClose}>
                  Cancel
                </Button>
                <Button
                  type="button"
                  className="flex-1"
                  disabled={!canSubmit || pending}
                  onClick={() =>
                    onSubmit({
                      rating,
                      review: review.trim(),
                    })
                  }
                >
                  {pending ? "Submitting..." : "Submit rating"}
                </Button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}

