import { useLayoutEffect, useState } from "react";
import {
  debounceTime,
  fromEvent,
  map,
  from,
  switchMap,
  mapTo,
  merge,
  of,
  distinctUntilChanged,
  tap,
} from "rxjs";

type Action =
  | {
      type: "CANCEL";
    }
  | {
      type: "SEARCH";
      payload: string;
    }
  | {
      type: "SUCCESS";
      payload: string[];
    };

export function mockRequest(search: string) {
  return from(
    new Promise<{
      type: "SUCCESS";
      payload: string[];
    }>((res) =>
      setTimeout(() => {
        res({ type: "SUCCESS", payload: [search] });
      }, 1000)
    )
  );
}

function distinctAction(prev: Action, cur: Action): boolean {
  if (prev.type !== cur.type) {
    return false;
  }

  if (prev.type === "SEARCH" && cur.type === "SEARCH") {
    return prev.payload === cur.payload;
  }

  return false;
}

export function App() {
  const [isSearching, setIsSearching] = useState(false);
  const [list, setList] = useState<string[]>([]);

  useLayoutEffect(() => {
    const inputElem = document.getElementById("user-input")!;
    const cancel$ = fromEvent(inputElem, "input").pipe(
      mapTo({ type: "CANCEL" } as { type: "CANCEL" })
    );
    const input$ = fromEvent(inputElem, "input").pipe(
      debounceTime(500),
      tap(() => console.log("debounce 500")),
      map((evt) => (evt.target as any).value as string),
      map(
        (search) =>
          ({ type: "SEARCH", payload: search } as {
            type: "SEARCH";
            payload: string;
          })
      )
    );

    const stream$ = merge(cancel$, input$).pipe(
      tap((a) => console.log(a)),
      distinctUntilChanged(distinctAction),
      switchMap((action) => {
        if (action.type === "SEARCH") {
          console.log("requesting...");
          setIsSearching(true);
          return mockRequest(action.payload);
        }

        return of(action);
      })
    );

    const subscription = stream$.subscribe((action) => {
      if (action.type === "CANCEL") {
        setIsSearching(false);
      } else if (action.type === "SUCCESS") {
        setIsSearching(false);
        setList(action.payload);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  return (
    <div>
      <input id="user-input" type="text" placeholder="search something" />
      <div>{isSearching ? "Searching" : ""}</div>
      <div>{list.map((l) => l)}</div>
    </div>
  );
}
