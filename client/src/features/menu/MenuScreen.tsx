import { Button } from "@darthcharles/greda";
import { Notice } from "../../components/Notice";
import { demoMenu } from "../../demoData";
import { MenuView } from "./MenuView";
import { useMenus, useGenerateMenu } from "./queries";

export function MenuScreen() {
  const {
    data: menus,
    isPending: loading,
    isError,
    error: menusError,
  } = useMenus();
  const {
    mutate: generateMenu,
    isPending: generating,
    error: generationError,
  } = useGenerateMenu();
  const menu = menus?.[0] ?? (isError && !menus ? demoMenu : null);
  const error =
    generationError?.message ??
    (isError && !menus
      ? "Demo mode · connect the Rails API to use your own meals."
      : menusError?.message);
  return (
    <>
      {error && <Notice>{error}</Notice>}
      <div className="mt-[31px] mb-[17px] flex flex-col items-start justify-between gap-[15px] tablet:mt-[39px] tablet:mb-5 tablet:flex-row tablet:items-end tablet:gap-0">
        <div>
          <p className="mb-[5px] text-[10px] font-bold tracking-[.13em] text-muted-foreground uppercase">
            This week
          </p>
          <h3 className="mb-0 font-display text-[28px] font-semibold tracking-[-.04em]">
            {menu ? formatDateRange(menu.from, menu.to) : "Your next menu"}
          </h3>
        </div>
        <Button
          variant="default"
          className="w-full tablet:w-auto"
          onClick={() => generateMenu()}
          disabled={generating || loading}
        >
          <span className="text-xl leading-[12px] font-normal">
            {generating ? "…" : "+"}
          </span>
          {generating ? "Planning" : "Plan my week"}
        </Button>
      </div>

      <MenuView
        menu={menu}
        loading={loading}
        generating={generating}
        onGenerate={() => generateMenu()}
      />
    </>
  );
}

function formatDateRange(from: string, to: string) {
  const start = new Date(from);
  const end = new Date(to);
  const options: Intl.DateTimeFormatOptions = {
    month: "short",
    day: "numeric",
  };
  return `${start.toLocaleDateString("en-US", options)} — ${end.toLocaleDateString("en-US", options)}`;
}
