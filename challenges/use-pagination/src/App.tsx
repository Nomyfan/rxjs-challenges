import { BehaviorSubject, Subject } from "rxjs";
import { usePagination } from "./usePagination";
import { useObservable } from "./useObservable";

let count = 0;
let total = 10;

function fetcher(params: {
  name: string;
  age: number;
  page: number;
  size: number;
}): Promise<{
  list: { name: string; age: number }[];
  total: number;
  message: string;
}> {
  console.log("params", params);
  const shouldResolve = count > 0;
  count++;
  return new Promise((res, rej) => {
    setTimeout(() => {
      if (!shouldResolve) {
        rej("Error from mock server");
      }
      res({
        list: [...new Array(params.size)].map(() => {
          return { name: params.name, age: params.age };
        }),
        total,
        message: "ok",
      });
    }, 3000);
  });
}

function App() {
  const params$ = useObservable(
    new BehaviorSubject<{ name: string; age: number }>({
      name: "kim",
      age: 12,
    })
  );
  const retry$ = useObservable(new Subject());
  const { loading, data, error, loadMore, reload } = usePagination({
    pageSize: 5,
    fetcher,
    params$,
    retryConfig: {
      count: 3,
      delay: () => retry$,
    },
  });
  console.log("App, loading, data, error", loading, data, error);

  if (loading && !data) {
    return <div>Loading...</div>;
  }

  if (error) {
    return (
      <div>
        Error: {JSON.stringify(error)}
        <button
          onClick={() => {
            retry$.next(1);
          }}
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div>
      {"Data"}
      {data?.list?.map((it, index) => {
        return (
          <div key={index}>
            {it.name}-{it.age}
          </div>
        );
      })}
      {data && (
        <div>
          {data.list.length}/{data.total}
        </div>
      )}
      {data && data.list.length < data.total && !loading && (
        <button
          onClick={() => {
            loadMore();
          }}
        >
          Load more
        </button>
      )}
      {data && loading && <div>Loading more...</div>}
      {data && data.list.length >= data.total && <div>--END--</div>}
      {data && data.list.length >= data.total && (
        <button
          onClick={() => {
            reload(15);
            total = 45;
          }}
        >
          Reload
        </button>
      )}
    </div>
  );
}

export default App;
