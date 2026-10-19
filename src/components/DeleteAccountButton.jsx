import React, { useState } from "react";
import { Trash2, Loader2 } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { deleteAccount } from "@/functions/deleteAccount";
import {
  AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle,
  AlertDialogDescription, AlertDialogFooter, AlertDialogAction, AlertDialogCancel,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/components/ui/use-toast";

export default function DeleteAccountButton({ className = "", children }) {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [status, setStatus] = useState("idle");

  const handleDelete = async () => {
    setDeleting(true);
    setStatus("idle");
    let deleted = false;
    try {
      await deleteAccount({});
      deleted = true;
    } catch (error) {
      console.error("Account deletion failed", error);
    }
    if (deleted) {
      setStatus("success");
      toast({ title: "Account deleted", description: "All of your data has been erased. Signing you out…" });
      try {
        await base44.auth.logout();
      } catch (error) {
        console.warn("Logout after deletion failed", error);
      }
      return;
    }
    setDeleting(false);
    setStatus("error");
    toast({ title: "Deletion failed", description: "Your account could not be deleted right now. Nothing was removed — please try again.", variant: "destructive" });
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={className}
        style={{ WebkitTapHighlightColor: "transparent" }}
      >
        <Trash2 className="w-4 h-4 flex-shrink-0" />
        {children ?? "Delete Account"}
      </button>

      <AlertDialog open={open} onOpenChange={setOpen}>
        <AlertDialogContent className="max-w-sm rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-foreground">Delete account permanently?</AlertDialogTitle>
            <AlertDialogDescription>
              This permanently erases your business profiles, strategies, funnels, brand kits, and leads. This action cannot be undone. You will be signed out immediately.
            </AlertDialogDescription>
          </AlertDialogHeader>
          {status === "success" && (
            <p className="text-sm font-semibold text-emerald-600">Account deleted successfully. Signing you out…</p>
          )}
          {status === "error" && (
            <p className="text-sm font-semibold text-destructive">Deletion failed. Your account is untouched — please try again.</p>
          )}
          <AlertDialogFooter className="flex-row gap-2">
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleting ? <><Loader2 className="w-4 h-4 animate-spin mr-2" />Deleting…</> : "Delete forever"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}