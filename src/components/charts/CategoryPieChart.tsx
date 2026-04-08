'use client';

import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';

interface CategoryData {
  id: string;
  label: string;
  amount: number;
  color: string;
  percentage: number;
}

interface CategoryPieChartProps {
  data: CategoryData[];
}

const CustomTooltip = ({ active, payload }: { active?: boolean; payload?: Array<{ name: string; value: number; payload: { percentage: number } }> }) => {
  if (active && payload && payload.length) {
    const entry = payload[0];
    return (
      <div className="bg-[#1a1a2e] border border-[#2a2a45] rounded-lg px-3 py-2 shadow-xl">
        <p className="text-xs text-slate-400">{entry.name}</p>
        <p className="text-sm font-semibold text-white">
          ${entry.value.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
        </p>
        <p className="text-xs text-purple-400">{entry.payload.percentage.toFixed(1)}%</p>
      </div>
    );
  }
  return null;
};

export default function CategoryPieChart({ data }: CategoryPieChartProps) {
  if (!data || data.length === 0) {
    return (
      <div className="h-[180px] flex items-center justify-center text-slate-500 text-sm">
        Sin datos
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={180}>
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          innerRadius={50}
          outerRadius={80}
          paddingAngle={2}
          dataKey="amount"
          nameKey="label"
        >
          {data.map((entry) => (
            <Cell key={entry.id} fill={entry.color} stroke="transparent" />
          ))}
        </Pie>
        <Tooltip content={<CustomTooltip />} />
      </PieChart>
    </ResponsiveContainer>
  );
}
