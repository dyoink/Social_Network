import React from 'react';

interface StatCardProps {
  label: string;
  value: number | string;
  sub?: string;
  color?: 'primary' | 'green' | 'orange' | 'red';
  icon: React.ReactNode;
}

const colorMap = {
  primary: 'bg-primary/10 text-primary',
  green:   'bg-green-100 text-green-600',
  orange:  'bg-orange-100 text-orange-600',
  red:     'bg-red-100 text-red-600',
};

const StatCard = ({ label, value, sub, color = 'primary', icon }: StatCardProps) => (
  <div className="bg-white rounded-2xl p-6 border border-outline-variant/10 shadow-sm flex items-start gap-4">
    <div className={`p-3 rounded-xl ${colorMap[color]}`}>{icon}</div>
    <div>
      <p className="text-sm text-outline font-medium">{label}</p>
      <p className="text-3xl font-extrabold font-headline text-on-surface mt-0.5">{value.toLocaleString()}</p>
      {sub && <p className="text-xs text-outline mt-1">{sub}</p>}
    </div>
  </div>
);

export default StatCard;
