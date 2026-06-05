import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, PieChart, Pie, Legend } from 'recharts';

const COLORS = ['#6366f1', '#a855f7', '#ec4899', '#10b981', '#f59e0b', '#06b6d4', '#ef4444', '#8b5cf6'];

export function ElectionBarChart({ data }) {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={data} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
        <XAxis dataKey="name" tick={{ fill: '#94a3b8', fontSize: 12 }} />
        <YAxis allowDecimals={false} tick={{ fill: '#94a3b8', fontSize: 12 }} />
        <Tooltip
          contentStyle={{
            backgroundColor: '#1f2937',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: '8px',
            color: '#f1f5f9',
          }}
        />
        <Bar dataKey="votes" radius={[6, 6, 0, 0]} maxBarSize={60}>
          {data.map((_, index) => (
            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

export function ElectionPieChart({ data }) {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          innerRadius={60}
          outerRadius={100}
          paddingAngle={3}
          dataKey="votes"
          nameKey="name"
          label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
        >
          {data.map((_, index) => (
            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
          ))}
        </Pie>
        <Tooltip
          contentStyle={{
            backgroundColor: '#1f2937',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: '8px',
            color: '#f1f5f9',
          }}
        />
        <Legend wrapperStyle={{ color: '#94a3b8' }} />
      </PieChart>
    </ResponsiveContainer>
  );
}
