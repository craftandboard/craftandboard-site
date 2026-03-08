import { StationQueue } from "../../../components/station-queue";
import { getStationQueue } from "../../../lib/api";

export default async function EdgebandingStationPage() {
  const queue = await getStationQueue("edgebanding");
  const parts = queue && "parts" in queue ? queue.parts : [];

  return (
    <section className="space-y-6">
      <StationQueue station="edgebanding" nextStatus="EDGEBANDED" initialParts={parts} />
    </section>
  );
}
