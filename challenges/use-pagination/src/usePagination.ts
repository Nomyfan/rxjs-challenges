import { useCallback, useEffect, useState } from "react";
import {
  BehaviorSubject,
  combineLatest,
  from,
  Observable,
  of,
  throwError,
} from "rxjs";
import {
  filter,
  finalize,
  map,
  switchMap,
  RetryConfig,
  retry,
  delay,
  tap,
} from "rxjs/operators";
import { useObservable } from "./useObservable";

interface IPagination<PARAMS> {
  page: number;
  size: number;
  end: boolean;
  params?: PARAMS;
}

function usePagination<
  PARAMS extends Record<string, unknown>,
  LIST,
  V extends {
    list: LIST[];
    total: number;
  }
>(options: {
  pageSize: number;
  fetcher: (params: PARAMS & { page: number; size: number }) => Promise<V>;
  params$: Observable<PARAMS>;
  retryConfig?: RetryConfig;
}) {
  const { pageSize, fetcher, params$ } = options;

  const retryConfig = options.retryConfig ?? {};

  const pagination$ = useObservable(
    new BehaviorSubject<IPagination<PARAMS>>({
      page: 0,
      size: pageSize,
      end: false,
    })
  );

  const [state, setState] = useState<{
    data: V | undefined;
    error: any;
    loading: boolean;
  }>({
    data: undefined,
    error: undefined,
    loading: false,
  });

  useEffect(() => {
    const paramsSub = params$.subscribe((params) => {
      pagination$.next({ ...pagination$.getValue(), page: 0, params });
    });
    const dataSub = pagination$
      .pipe(
        filter((pagination) => {
          return !pagination.end;
        }),
        tap((pagination) => {
          setState((st) => ({
            ...st,
            loading: true,
            data: pagination.page === 0 ? undefined : st.data,
          }));
        }),
        switchMap((pagination) => {
          return from(
            fetcher({
              page: pagination.page,
              size: pagination.size,
              ...pagination.params!,
            })
          );
        }),
        retry({
          ...retryConfig,
          delay: (err, retryCount) => {
            setState((st) => ({ ...st, error: err, loading: false }));
            if (retryConfig.delay) {
              if (typeof retryConfig.delay === "number") {
                return of(1).pipe(
                  delay(retryConfig.delay),
                  tap(() => {
                    setState((st) => ({ ...st, error: undefined }));
                  })
                );
              }

              return from(retryConfig.delay(err, retryCount)).pipe(
                tap(() => {
                  setState((st) => ({ ...st, error: undefined }));
                })
              );
            } else {
              return throwError(() => err);
            }
          },
        }),
        finalize(() => {
          console.log("finalize");
          setState((st) => {
            return { ...st, loading: false };
          });
        })
      )
      .subscribe({
        next: (data) => {
          console.log("onnext");
          setState((st) => {
            const newList = [...(st?.data?.list ?? []), ...data.list];
            if (newList.length === data.total) {
              pagination$.next({ ...pagination$.getValue(), end: true });
            }
            return {
              loading: false,
              error: undefined,
              data: {
                ...data,
                list: newList,
                total: data.total,
              },
            };
          });
        },
        error: () => {
          console.log("onerror");
        },
        complete: () => {
          console.log("oncomplete");
        },
      });

    return () => {
      paramsSub.unsubscribe();
      dataSub.unsubscribe();
    };
  }, [params$, pagination$]);

  const loadMore = useCallback(() => {
    const currentPagination = pagination$.getValue();
    if (currentPagination.end) {
      return;
    }
    pagination$.next({
      ...currentPagination,
      page: currentPagination.page + 1,
    });
  }, [pagination$]);

  const reload = useCallback((pageSize?: number) => {
    const currentPagination = pagination$.getValue();
    pagination$.next({
      ...pagination$.getValue(),
      page: 0,
      size: pageSize ?? currentPagination.size,
      end: false,
    });
  }, []);

  return { ...state, loadMore, reload };
}

export { usePagination };
