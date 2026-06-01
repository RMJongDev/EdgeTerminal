import { Badge, DataRow, Notice, PageHeader, Panel, PanelBody, PanelHeader } from "@/components/edge-terminal";
import { Button } from "@/components/ui/button";
import { generateRiskReview } from "@/lib/edge-terminal/actions";
import { getTerminalData } from "@/lib/edge-terminal/data";

type RiskPageProps = {
  searchParams: Promise<{ notice?: string }>;
};

export const dynamic = "force-dynamic";

export default async function RiskPage({ searchParams }: RiskPageProps) {
  const params = await searchParams;
  const data = await getTerminalData();
  const reviewedIds = new Set(data.riskReviews.map((review) => review.setupId));
  const pending = data.setups.filter((setup) => !reviewedIds.has(setup.id));

  return (
    <div>
      <Notice message={params.notice} />
      <PageHeader title="Risk Review" eyebrow="Mandatory counterargument before paper trades">
        <Badge tone="red">{data.riskReviews.filter((review) => review.riskScore >= 65).length} high risk</Badge>
        <Badge tone="amber">{pending.length} pending</Badge>
      </PageHeader>

      <div className="grid gap-4 xl:grid-cols-[1fr_380px]">
        <Panel>
          <PanelHeader title="Completed reviews" />
          <div className="divide-y divide-border">
            {data.riskReviews.map((review) => {
              const setup = data.setups.find((item) => item.id === review.setupId);
              return (
                <div key={review.id} className="p-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <h2 className="font-semibold">{setup?.title ?? "Setup"}</h2>
                    <Badge tone={review.finalVerdict === "skip" ? "red" : review.finalVerdict === "wait" ? "amber" : "green"}>
                      {review.finalVerdict}
                    </Badge>
                  </div>
                  <div className="mt-3 grid gap-2">
                    <DataRow label="Risk score" value={<Badge tone="red">{review.riskScore}/100</Badge>} />
                    <DataRow label="Counterargument" value={review.counterargument} />
                    <DataRow label="Reason to skip" value={review.reasonToSkip} />
                  </div>
                </div>
              );
            })}
          </div>
        </Panel>

        <Panel>
          <PanelHeader title="Pending setups" />
          <PanelBody className="grid gap-3">
            {pending.map((setup) => (
              <form key={setup.id} action={generateRiskReview} className="rounded-md border border-border bg-background p-3">
                <input type="hidden" name="setup_id" value={setup.id} />
                <div className="font-medium">{setup.title}</div>
                <p className="mt-1 text-sm text-muted-foreground">{setup.rationale}</p>
                <Button className="mt-3" size="sm" type="submit">Generate review</Button>
              </form>
            ))}
            {pending.length === 0 ? <p className="text-sm text-muted-foreground">All setups have a risk review.</p> : null}
          </PanelBody>
        </Panel>
      </div>
    </div>
  );
}
