'use client';

import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';

interface DataPoint {
  month: string;
  amount: number;
}

interface ExpenseBarChartProps {
  data: DataPoint[];
}

const CustomTooltip = ({ active, payload, label }: { active?: boolean; payload?: Array<{ value: number }>; label?: string }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-[#1a1a2e] border border-[#2a2a45] rounded-lg px-3 py-2 shadow-xl">
        <p className="text-xs text-slate-400 capitalize">{label}</p>
        <p className="text-sm font-semibold text-white">
          ${payload[0].value.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
        </p>
      </div>
    );
  }
  return null;
};

export default function ExpenseBarChart({ data }: ExpenseBarChartProps) {
  return (
    <ResponsiveContainer width="100%" height={180}>
      <BarChart data={data} margin={{ top: 5, right: 5, left: -10, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#2a2a45" vertical={false} />
        <XAxis
          dataKey="month"
          tick={{ fill: '#64748b', fontSize: 11 }}
          axisLine={false}
          tickLine={false}
          tickFormatter={(val: string) => val.slice(0, 3).toUpperCase()}
        />
        <YAxis
          tick={{ fill: '#64748b', fontSize: 11 }}
          axisLine={false}
          tickLine={false}
          tickFormatter={(val: number) => `$${(val / 1000).toFixed(0)}k`}
        />
        <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(124,58,237,0.1)' }} />
        <Bar dataKey="amount" fill="url(#barGradient)" radius={[4, 4, 0, 0]} />
        <defs>
          <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#8b5cf6" />
            <stop offset="100%" stopColor="#6366f1" />
          </linearGradient>
        </defs>
      </BarChart>
    </ResponsiveContainer>
  );
}
