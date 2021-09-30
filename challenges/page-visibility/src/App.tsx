import { useLayoutEffect } from "react";
import {
  fromEvent,
  startWith,
  map,
  distinctUntilChanged,
  skipUntil,
  take,
} from "rxjs";

const VIDEO_URL =
  "https://s3-ap-northeast-1.amazonaws.com/daniemon/demos/The%2BVillage-Mobile.mp4";

export function App() {
  useLayoutEffect(() => {
    const subscription = fromEvent(
      document.getElementById("videoElem")!,
      "play",
    ).subscribe(() => {
      document.title = "Playing";
    });

    return () => subscription.unsubscribe();
  }, []);

  useLayoutEffect(() => {
    const subscription = fromEvent(
      document.getElementById("videoElem")!,
      "pause",
    ).subscribe(() => {
      document.title = "Paused";
    });

    return () => subscription.unsubscribe();
  }, []);

  useLayoutEffect(() => {
    const subscription = fromEvent(document, "visibilitychange")
      .pipe(
        skipUntil(
          fromEvent(document.getElementById("videoElem")!, "play").pipe(
            take(1),
          ),
        ),
        map(() => document.visibilityState !== "hidden"),
        distinctUntilChanged(),
      )
      .subscribe((visible) => {
        const videoElem = document.getElementById(
          "videoElem",
        ) as HTMLVideoElement;
        if (visible) {
          if (videoElem.paused) {
            videoElem.play();
          }
        } else {
          if (!videoElem.paused) {
            videoElem.pause();
          }
        }
      });

    return () => subscription.unsubscribe();
  }, []);

  return (
    <video
      id="videoElem"
      src={VIDEO_URL}
      style={{ width: "100%" }}
      controls
      poster="/thumbnail.jpg"
    />
  );
}
