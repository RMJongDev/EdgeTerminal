import { Badge, PageHeader, Panel, PanelBody, PanelHeader } from "@/components/edge-terminal";
import { getAiRuntimeStatus } from "@/lib/edge-terminal/ai";
import { getTerminalData } from "@/lib/edge-terminal/data";

export const dynamic = "force-dynamic";

export default async function AiLogPage() {
  const data = await getTerminalData();
  const runtime = getAiRuntimeStatus();

  return (
    <div>
      <PageHeader title="AI Analysis Log" eyebrow="Prompt, provider and output audit trail">
        <Badge tone={runtime.openai === "configured" ? "green" : "amber"}>OpenAI {runtime.openai}</Badge>
        <Badge tone={runtime.gemini === "configured" ? "green" : "amber"}>Gemini {runtime.gemini}</Badge>
      </PageHeader>

      <div className="grid gap-4 xl:grid-cols-[1fr_360px]">
        <Panel>
          <PanelHeader title="Analysis runs" />
          <div className="divide-y divide-border">
            {data.aiLogs.map((log) => (
              <div key={log.id} className="grid gap-2 p-4 md:grid-cols-[170px_minmax(0,1fr)_120px_100px] md:items-center">
                <div>
                  <div className="font-medium">{log.analysisType}</div>
                  <div className="text-xs text-muted-foreground">{new Date(log.createdAt).toLocaleString("nl-NL")}</div>
                </div>
                <div className="text-sm text-muted-foreground">{log.summary}</div>
                <Badge tone={log.provider === "mock" ? "amber" : "green"}>{log.provider}</Badge>
                <Badge tone={log.status === "success" ? "green" : "red"}>{log.status}</Badge>
              </div>
            ))}
          </div>
        </Panel>

        <Panel>
          <PanelHeader title="Runtime" />
          <PanelBody className="space-y-3 text-sm">
            <div>
              <div className="text-muted-foreground">OpenAI model</div>
              <div className="font-mono">{runtime.openaiModel}</div>
            </div>
            <div>
              <div className="text-muted-foreground">Gemini model</div>
              <div className="font-mono">{runtime.geminiModel}</div>
            </div>
            <p className="text-muted-foreground">
              Without provider keys the server actions write mock-ready outputs and keep the flow testable.
            </p>
          </PanelBody>
        </Panel>
      </div>
    </div>
  );
}
