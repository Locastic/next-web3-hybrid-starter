import { useActionState } from "react";

export function useFormActionState<T, U>(action: (input: T) => Promise<U>, onSuccess?: () => void) {
  // type State = { data: Awaited<U>, error: never } | { data: never, error: unknown };

  const [state, formAction, isPending] = useActionState(
    // TODO: add State type
    async (currentState: any, formData: FormData) => {
      try {
        // TODO: add schema parse check
        const res = await action(Object.fromEntries(formData) as T);

        onSuccess?.();

        return { data: res, error: null };
        // TODO: remove @ts-ignore
        // @ts-ignore
      } catch (error: Error) {
        return { data: null, error: error };
      }
    }, { data: null, error: null }
  );

  return [state, formAction, isPending] as const;
}
