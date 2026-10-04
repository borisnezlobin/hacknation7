import { LabMark } from "../LabMark";
import { SpectrumDip } from "../SpectrumDip";
import { VideoWindow } from "../VideoWindow";

export function Footer() {
  return (
    <footer className="relative">
      <div className="mx-auto grid max-w-7xl gap-12 px-4 pb-24 md:grid-cols-2 md:items-center md:px-10">
        <div className="flex flex-col gap-6">
          <div className="flex items-center gap-4">
            <LabMark size={40} />
            <span className="text-headline">Planet lab</span>
          </div>
          <p className="text-body max-w-md">We built this for HackNation&rsquo;s 7th Global AI Hackathon, Challenge 03 (Databricks Omnigent).</p>
        </div>
        <VideoWindow title="The team" src="/media/team.mp4" poster="/media/team-poster.jpg" playLabel="Meet the team" />
      </div>
      <SpectrumDip className="h-24 w-full md:h-32" bandHeight={12} dipDepth={36} dipCenter={500} dipWidth={160} />
    </footer>
  );
}
