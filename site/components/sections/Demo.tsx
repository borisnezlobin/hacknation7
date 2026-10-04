import { VideoWindow } from "../VideoWindow";

export function Demo() {
  return (
    <section id="demo" aria-label="Demo video" className="mx-auto max-w-6xl scroll-mt-10 px-4 py-24 md:px-10 md:py-36">
      <VideoWindow title="Planet lab demo" src="/media/demo.mp4" poster="/media/demo-poster.jpg" playLabel="Play the demo" />
    </section>
  );
}
