import { Backdrop } from "@/components/Backdrop";
import { Breakthrough } from "@/components/sections/Breakthrough";
import { Demo } from "@/components/sections/Demo";
import { Footer } from "@/components/sections/Footer";
import { Future } from "@/components/sections/Future";
import { Hero } from "@/components/sections/Hero";
import { Honest } from "@/components/sections/Honest";
import { Loop } from "@/components/sections/Loop";
import { Candidates } from "@/components/sections/results/Candidates";
import { FalseLead } from "@/components/sections/results/FalseLead";
import { Recall } from "@/components/sections/results/Recall";
import { RecordTimeline } from "@/components/sections/results/RecordTimeline";
import { Rediscoveries } from "@/components/sections/results/Rediscoveries";
import { ScoreJump } from "@/components/sections/results/ScoreJump";

export default function Home() {
  return (
    <>
      <Backdrop />
      <Hero />
      <main>
        <Demo />
        <Loop />
        <section aria-label="Results">
          <ScoreJump />
          <Recall />
          <RecordTimeline />
          <Rediscoveries />
          <FalseLead />
          <Candidates />
        </section>
        <Honest />
        <Breakthrough />
        <Future />
      </main>
      <Footer />
    </>
  );
}
