'use client';

import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useUser } from "../../_components/auth-provider";
import { updateMe } from "@/lib/actions/user";
import { useFormActionState } from "@/lib/hooks";

const DashboardGeneralPage = () => {
  const router = useRouter();
  const { user } = useUser();

  const [state, formAction, isPending] = useFormActionState(updateMe, () => { router.refresh() });

  return (
    <>
      <h1 className="text-2xl font-bold">General Settings</h1>
      <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
        <h3 className="font-semibold mb-4">User Info</h3>
        <form className="flex flex-col gap-2 items-start" action={formAction}>
          <Label htmlFor="username">Username</Label>
          <Input id="username" name="username" defaultValue={user?.username || ''} className="w-full" required />
          <Button type="submit" className="mt-2" disabled={isPending}>Save</Button>
          {state.error && <small className="text-destructive">{state.error}</small>}
        </form>
      </div>
    </>
  );
};

export default DashboardGeneralPage;
