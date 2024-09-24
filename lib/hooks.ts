import { useActionState } from "react";

// TODO: make type more strict
type ActionResult<R> = { data?: R | null, error?: string | null };

export function useFormActionState<T, U>(action: (input: T) => Promise<ActionResult<U>>, onSuccess?: () => void) {
  const [state, formAction, isPending] = useActionState(
    // TODO: add State type
    async (currentState: any, formData: FormData) => {
      let res = await action(Object.fromEntries(formData) as T);

      // TODO: need to investigate why this is happening: probably because of the redirect?
      if (res === undefined) {
        res = { data: null, error: null };
      }

      if (!res.error) {
        onSuccess?.();
      }

      return res;
    }, { data: null, error: null }
  );

  return [state, formAction, isPending] as const;
}
