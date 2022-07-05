import { useEffect, useRef } from "react";
import type { Observable } from "rxjs";

function useObservable<T, O extends Observable<T>>(source$: O) {
  const ref = useRef<O>();
  if (!ref.current) {
    ref.current = source$;
  }

  useEffect(() => () => (ref.current = undefined), []);

  return ref.current!;
}

export { useObservable };
