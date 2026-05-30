import { cn } from '../lib/cn';

type AvatarProps = {
  name: string;
  src?: string | null;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
};

const sizes = {
  sm: 'h-6 w-6 text-xs',
  md: 'h-8 w-8 text-sm',
  lg: 'h-12 w-12 text-base',
} as const;

export function Avatar({ name, src, size = 'md', className }: AvatarProps) {
  const initials = name
    .split(' ')
    .map((p) => p[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase();

  return (
    <span
      className={cn(
        'inline-flex items-center justify-center rounded-full bg-muted font-medium text-muted-foreground',
        sizes[size],
        className,
      )}
    >
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={src} alt={name} className="h-full w-full rounded-full object-cover" />
      ) : (
        initials
      )}
    </span>
  );
}
