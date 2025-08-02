import { ValidatedModelRecord } from "@/entrypoints/background/lib/modelUtils";
import { ChartContainer, ChartTooltip } from "@local-first-web-ai-monorepo/react-ui/ui/chart";
import { useQuery } from "@tanstack/react-query";
import { filesize } from "filesize";
import type { PieLabelRenderProps } from "recharts";
import { Cell, Label, Pie, PieChart } from "recharts";
import { processModelRecord } from "../utils/modelUtils";

interface StorageUsageChartProps {
  models: ValidatedModelRecord[];
  storageInfo: { used: number; available: number } | null;
  hoveredModel: ValidatedModelRecord | null;
}

const getColorFromString = (str: string = '') => {
  // Use a predefined color palette instead of random colors
  const palette = [
    'hsl(210, 70%, 55%)',  // Blue
    'hsl(280, 70%, 55%)',  // Purple
    'hsl(150, 70%, 55%)',  // Green
    'hsl(340, 70%, 55%)',  // Pink
    'hsl(30, 70%, 55%)',   // Orange
  ];

  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  return palette[Math.abs(hash) % palette.length];
};

export function StorageUsageChart({ models = [], storageInfo, hoveredModel }: StorageUsageChartProps) {
  let { data: modelDetails } = useQuery({
    queryKey: ['modelRecord', hoveredModel?.model_id],
    queryFn: () => processModelRecord(hoveredModel!),
    enabled: !!hoveredModel,
    staleTime: 1000 * 60 * 60, // 1 hour
    cacheTime: 1000 * 60 * 60 * 24, // 24 hours
  });

  const totalStorage = storageInfo ? storageInfo.available : 0;
  const usedStorage = models.reduce((acc, model) => acc + Number(model.vram_required_MB), 0);
  console.log({ usedStorage, models })
  const percentageUsed = totalStorage ? ((usedStorage / totalStorage) * 100).toFixed(1) : '0';

  let chartData = models.map(model => {
    const size = Number(model.vram_required_MB);
    return {
      name: model.model_id,
      size,
      percentage: totalStorage ? ((size / totalStorage) * 100).toFixed(1) : '0',
      fill: getColorFromString(model.model_id),
      fromHovered: false
    };
  });

  if (storageInfo) {
    const availableSize = storageInfo.available - storageInfo.used;
    chartData.push({
      // @ts-expect-error too lazy to type this atm
      name: 'Available',
      size: availableSize,
      percentage: ((availableSize / totalStorage) * 100).toFixed(1),
      fill: 'hsl(200, 20%, 90%)',
      fromHovered: false
    });
  }

  if (modelDetails && hoveredModel) {
    chartData.push({
      name: hoveredModel.model_id,
      size: Number(modelDetails.data?.usedStorage ?? 0),
      percentage: ((Number(modelDetails.data?.usedStorage ?? 0) / totalStorage) * 100).toFixed(1),
      fill: getColorFromString(hoveredModel.model_id),
      fromHovered: true
    });
  }

  // Find the highlighted segment (if any)
  const highlightedModel = hoveredModel ? chartData.find(item =>
    item.name === hoveredModel.model_id && item.fromHovered
  ) : null;

  const StorageUsageLabel = (props: PieLabelRenderProps) => {
    const { viewBox } = props;
    if (!viewBox || typeof viewBox.cx !== 'number' || typeof viewBox.cy !== 'number') return null;

    return (
      <text
        x={viewBox.cx}
        y={viewBox.cy}
        textAnchor="middle"
        dominantBaseline="middle"
      >
        <tspan
          x={viewBox.cx}
          y={viewBox.cy - 8}
          className="fill-foreground text-base font-bold"
        >
          {percentageUsed}%
        </tspan>
        <tspan
          x={viewBox.cx}
          y={viewBox.cy + 8}
          className="fill-muted-foreground text-xs"
        >
          Used
        </tspan>
      </text>
    );
  };

  return (
    <div className="space-y-2">
      {/* Compact chart */}
      <div className="h-[160px] relative">
        <ChartContainer
          config={{}}
          className="mx-auto aspect-square max-h-[160px]"
        >
          <PieChart>
            <ChartTooltip
              content={({ payload }) => {
                if (payload && payload[0]) {
                  const data = payload[0].payload;
                  return (
                    <div className="bg-background p-2 rounded-lg shadow">
                      <div className="font-medium">{data.name}</div>
                      <div className="text-xs text-muted-foreground">
                        {data.percentage}% ({filesize(data.size, {
                          exponent: 2,
                        })})
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
              animationDuration={300}
              innerRadius={35}
              outerRadius={60}
              strokeWidth={2}
              stroke="hsl(var(--background))"
            >
              {chartData.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={entry.fill}
                  opacity={hoveredModel && entry.name === hoveredModel.model_id ? 1 : 0.8}
                  strokeWidth={hoveredModel && entry.name === hoveredModel.model_id ? 4 : 2}
                />
              ))}
              {/* @ts-expect-error too lazy to type this atm */}
              <Label content={StorageUsageLabel} />
            </Pie>
          </PieChart>
          {hoveredModel && highlightedModel && (
            <div className="bg-accent/50 rounded-md p-2 text-xs text-center mt-1 w-full max-w-[220px] mx-auto">
              <div className="font-medium">{hoveredModel.model_id}</div>
              <div className="text-muted-foreground">
                {highlightedModel.percentage}% of storage
                ({filesize(Number(highlightedModel.size), { exponent: 3 })})
              </div>
            </div>
          )}
        </ChartContainer>
      </div>

      {/* Storage info */}
      <div className="flex justify-between items-center text-xs px-1">
        <span className="text-muted-foreground">
          {filesize(usedStorage, { exponent: 2 })} used
        </span>
        <span className="text-muted-foreground">
          {filesize(totalStorage, { exponent: 2 })} total
        </span>
      </div>
    </div>
  );
}