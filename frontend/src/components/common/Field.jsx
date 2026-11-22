import { cloneElement, isValidElement, useId } from 'react'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'

/** Label + control + error message, wired for accessibility (aria-invalid / aria-describedby). */
export function Field({ label, error, hint, children, className, required }) {
  const id = useId()
  const errId = `${id}-err`
  const child = isValidElement(children)
    ? cloneElement(children, { id: children.props.id || id, 'aria-invalid': !!error || undefined, 'aria-describedby': error ? errId : undefined })
    : children
  return (
    <div className={cn('grid gap-2', className)}>
      {label && <Label htmlFor={children?.props?.id || id} className="text-[13px] font-medium text-foreground/80">{label}{required && <span className="text-destructive"> *</span>}</Label>}
      {child}
      {hint && !error && <p className="text-xs text-muted-foreground">{hint}</p>}
      {error && <p id={errId} role="alert" className="text-xs text-destructive">{error.message || String(error)}</p>}
    </div>
  )
}
