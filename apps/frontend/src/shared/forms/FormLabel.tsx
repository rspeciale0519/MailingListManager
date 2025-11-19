import { Label } from '@/shared/ui';
import { cn } from '@/lib/utils';

interface FormLabelProps {
  htmlFor?: string;
  required?: boolean;
  children: React.ReactNode;
  className?: string;
}

export function FormLabel({ htmlFor, required, children, className }: FormLabelProps) {
  return (
    <Label htmlFor={htmlFor} className={cn('text-gray-900', className)}>
      {children}
      {required && <span className="ml-1 text-red-500">*</span>}
    </Label>
  );
}
