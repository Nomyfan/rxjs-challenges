import "./style.css";
import { Subject } from "rxjs";
import { map, pairwise, distinct } from "rxjs/operators";

function heavyWork() {
  let count = 0;
  const max = Math.random() * 100000000 * 0.8;
  for (let i = 0; i < max; i++) {
    count++;
  }
}

const app = document.querySelector<HTMLDivElement>("#app")!;

const frames$ = new Subject<number>();

function nextFrame(timestamp: number) {
  frames$.next(timestamp);
  if (Math.random() < 0.28) {
    queueMicrotask(heavyWork);
  }
  requestAnimationFrame(nextFrame);
}

const fps$ = frames$.pipe(
  pairwise(),
  map(([ts1, ts2]) => {
    const eli = ts2 - ts1;
    return Math.round(1000 / eli);
  }),
  distinct()
);

fps$.subscribe((fps) => {
  app.innerText = `FPS: ${fps}`;
});

app.innerText = "FPS: 0";

requestAnimationFrame(nextFrame);
