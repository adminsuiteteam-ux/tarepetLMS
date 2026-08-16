import * as React from 'react';
import * as LabelPrimitive from '@radix-ui/react-label';
import { cn } from '@/lib/utils';
import { cva, type VariantProps } from 'class-variance-authority';

const labelVariants = cva(
  'text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70',
);

const Label = React.forwardRef<
  React.ElementRef<typeof LabelPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof LabelPrimitive.Root> &
    VariantProps<typeof labelVariants>
>(
  (
    {
      className,
      children,
      htmlFor,
      id,
      style,
      title,
      onClick,
      onMouseDown,
      onMouseLeave,
      onPointerDown,
      asChild,
      dir,
      tabIndex,
      'aria-label': ariaLabel,
      'aria-labelledby': ariaLabelledBy,
      'aria-describedby': ariaDescribedBy,
      'aria-hidden': ariaHidden,
      role,
    },
    ref,
  ) => (
    <LabelPrimitive.Root
      ref={ref}
      className={cn(labelVariants(), className)}
      children={children}
      htmlFor={htmlFor}
      id={id}
      style={style}
      title={title}
      onClick={onClick}
      onMouseDown={onMouseDown}
      onMouseLeave={onMouseLeave}
      onPointerDown={onPointerDown}
      asChild={asChild}
      dir={dir}
      tabIndex={tabIndex}
      aria-label={ariaLabel}
      aria-labelledby={ariaLabelledBy}
      aria-describedby={ariaDescribedBy}
      aria-hidden={ariaHidden}
      role={role}
    />
  ),
);
Label.displayName = LabelPrimitive.Root.displayName;

export { Label };

