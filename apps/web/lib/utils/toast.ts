import { toast } from "sonner";

export const notify = {
  success: (msg: string, desc?: string) => toast.success(msg, { description: desc }),
  error: (msg: string, desc?: string) => toast.error(msg, { description: desc }),
  info: (msg: string, desc?: string) => toast(msg, { description: desc }),
};