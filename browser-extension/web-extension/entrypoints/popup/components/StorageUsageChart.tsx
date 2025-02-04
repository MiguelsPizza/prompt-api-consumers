import type { CachedModel } from "@/background/lib/modelUtils";
import { Card, CardContent, CardHeader, CardTitle } from "@local-first-web-ai-monorepo/react-ui/components/card";
import { ChartContainer, ChartTooltip } from "@local-first-web-ai-monorepo/react-ui/ui/chart";
import { ModelRecord } from "@mlc-ai/web-llm";
import { useQuery } from "@tanstack/react-query";
import type { PieLabelRenderProps } from "recharts";
import { Label, Pie, PieChart } from "recharts";
import { extractModelId, processModelRecord } from "../utils/modelUtils";

interface StorageUsageChartProps {
  models: CachedModel[];
  storageInfo: { used: number; available: number } | null;
  hoveredModel: ModelRecord | null;
}

export function StorageUsageChart({ models, storageInfo, hoveredModel }: StorageUsageChartProps) {
  const { data: modelDetails } = useQuery({
    queryKey: ['modelRecord', hoveredModel?.model_id],
    queryFn: () => processModelRecord(hoveredModel!),
    enabled: !!hoveredModel,
    staleTime: 1000 * 60 * 60, // 1 hour
    cacheTime: 1000 * 60 * 60 * 24, // 24 hours
  });
  const chartData = models.map(model => ({
    name: extractModelId(model.manifestUrl),
    size: Number(model.totalSize),
    fill: `hsl(${Math.random() * 360}, 70%, 50%)`,
  }));

  if (storageInfo) {
    chartData.push({
      name: 'Available',
      size: storageInfo.available - storageInfo.used,
      fill: 'hsl(200, 20%, 80%)',
    });
  }

  const StorageUsageLabel = (props: PieLabelRenderProps) => {
    const { viewBox } = props;
    if (!viewBox || typeof viewBox.cx !== 'number' || typeof viewBox.cy !== 'number') return null;

    let labelValue: number;
    let labelText: string;

    if (modelDetails) {
      labelValue = modelDetails.diskSpaceBytes;
      labelText = "Model Size";
    } else {
      labelValue = models.reduce((acc, model) => acc + Number(model.totalSize), 0);
      labelText = "MB Used";
    }

    return (
      <text
        x={viewBox.cx}
        y={viewBox.cy}
        textAnchor="middle"
        dominantBaseline="middle"
      >
        <tspan
          x={viewBox.cx}
          y={viewBox.cy}
          className="fill-foreground text-xl font-bold"
        >
          {(labelValue / 1024 / 1024).toFixed(2)}
        </tspan>
        <tspan
          x={viewBox.cx}
          y={viewBox.cy + 20}
          className="fill-muted-foreground text-sm"
        >
          {labelText}
        </tspan>
      </text>
    );
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Storage Usage</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[300px]">
          <ChartContainer
            config={{}}
            className="mx-auto aspect-square max-h-[250px]"
          >
            <PieChart>
              <ChartTooltip
                content={({ payload }) => {
                  if (payload && payload[0]) {
                    const data = payload[0].payload;
                    return (
                      <div className="bg-background p-2 rounded-lg shadow">
                        <div className="font-medium">{data.name}</div>
                        <div className="text-sm text-muted-foreground">
                          {(data.size / 1024 / 1024).toFixed(2)} MB
                        </div>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Pie
                data={chartData}
                dataKey="size"
                nameKey="name"
                innerRadius={60}
                strokeWidth={5}
              >
                {/* @ts-expect-error too lazy to type this atm */}
                <Label content={StorageUsageLabel} />
              </Pie>
            </PieChart>
          </ChartContainer>
        </div>
      </CardContent>
    </Card>
  );
}