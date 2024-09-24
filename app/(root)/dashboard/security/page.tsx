'use client';

import { useDisconnect } from "wagmi";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { deleteMe } from "@/lib/actions/user";
import { useFormActionState } from "@/lib/hooks";

const DashboardSecurityPage = () => {
  const { disconnect } = useDisconnect();
  const [_state, formAction, isPending] = useFormActionState(deleteMe);

  return (
    <>
      <h1 className="text-2xl font-bold">Security Settings</h1>
      <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
        <h3 className="font-semibold mb-4">Delete Account</h3>
        <form className="flex flex-col gap-2 items-start" onSubmit={(e: React.FormEvent<HTMLFormElement>) => {
          e.preventDefault();
          formAction(new FormData(e.currentTarget));
          disconnect();
        }}>
          <Label>Account deletion is non-reversable. Please proceed with caution.</Label>
          <Button type="submit" variant="destructive" className="mt-2" disabled={isPending}>Confirm</Button>
        </form>
      </div>
    </>
  );
};

export default DashboardSecurityPage;
