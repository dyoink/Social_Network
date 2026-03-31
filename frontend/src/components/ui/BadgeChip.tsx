import type { UserBadgeDto } from '../../api/api-generated';

interface BadgeChipProps {
  badge: UserBadgeDto;
  size?: 'sm' | 'md';
}

const BadgeChip = ({ badge, size = 'sm' }: BadgeChipProps) => {
  const isSmall = size === 'sm';
  
  return (
    <span
      className={`inline-flex items-center gap-0.5 rounded-full font-semibold ${
        isSmall 
          ? 'px-1.5 py-0 text-[10px] leading-4' 
          : 'px-2 py-0.5 text-xs'
      }`}
      style={{ 
        backgroundColor: `${badge.color}20`, 
        color: badge.color ?? '#f59e0b',
        border: `1px solid ${badge.color}40`
      }}
      title={badge.description ?? badge.name ?? ''}
    >
      <span>{badge.icon}</span>
      <span>{badge.name}</span>
    </span>
  );
};

export default BadgeChip;
