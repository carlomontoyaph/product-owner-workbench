import { Icon } from "./Icons";
import type { Toast } from "@/hooks/useToast";

export function Toaster({ toast }: { toast: Toast | null }) {
  if (!toast) return null;
  return (
    <div className="toast">
      <span className="ico"><Icon name={toast.ico} size={15} /></span>
      {toast.msg}
    </div>
  );
}
