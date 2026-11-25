import { Button } from "@darthcharles/greda";

export function CollectionHeader({
  titleId,
  title,
  actionLabel,
  actionVariant = "secondary",
  onAdd,
}: {
  titleId: string;
  title: string;
  actionLabel: string;
  actionVariant?: "default" | "secondary";
  onAdd: () => void;
}) {
  return (
    <div className="mb-lg flex min-w-0 flex-col gap-md tablet:flex-row tablet:items-start tablet:justify-between tablet:gap-lg">
      <h2
        id={titleId}
        className="m-0 min-w-0 break-words font-display text-[32px] leading-tight font-semibold tracking-[-.04em]"
      >
        {title}
      </h2>
      <Button
        className="min-h-11 max-w-full self-start whitespace-normal tablet:shrink-0"
        variant={actionVariant}
        onClick={onAdd}
      >
        {actionLabel}
      </Button>
    </div>
  );
}
