import { Button } from "@darthcharles/greda";

export function CollectionHeader({
  titleId,
  title,
  description,
  actionLabel,
  onAdd,
}: {
  titleId: string;
  title: string;
  description?: string;
  actionLabel: string;
  onAdd: () => void;
}) {
  return (
    <div className="mb-6 flex min-w-0 flex-col gap-4 tablet:flex-row tablet:items-start tablet:justify-between tablet:gap-6">
      <div className="min-w-0">
        <h2
          id={titleId}
          className="m-0 break-words font-display text-[32px] leading-tight font-semibold tracking-[-.04em]"
        >
          {title}
        </h2>
        {description && (
          <p className="mt-2 mb-0 text-sm leading-relaxed text-muted-foreground">{description}</p>
        )}
      </div>
      <Button
        className="min-h-11 max-w-full self-start whitespace-normal tablet:shrink-0"
        variant="secondary"
        onClick={onAdd}
      >
        {actionLabel}
      </Button>
    </div>
  );
}
