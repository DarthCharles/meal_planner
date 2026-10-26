import { StrictMode, useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import { DialogProvider } from "../../src/components/dialog/DialogProvider";
import { useDialog } from "../../src/components/dialog/useDialog";
import "../../src/styles.css";

function Draft({
  onReplace,
  onPreviousClose,
}: {
  onReplace?: () => void;
  onPreviousClose?: () => void;
}) {
  const [value, setValue] = useState("Fresh draft");
  const { closeDialog } = useDialog();
  return (
    <>
      <label>
        Draft
        <input
          value={value}
          onChange={(event) => setValue(event.target.value)}
        />
      </label>
      {onReplace && <button onClick={onReplace}>Replace dialog</button>}
      {onPreviousClose && (
        <button onClick={onPreviousClose}>Invoke previous close</button>
      )}
      <button onClick={closeDialog}>Close through context</button>
    </>
  );
}

function Harness() {
  const { openDialog } = useDialog();
  const previousClose = useRef<(() => void) | null>(null);
  return (
    <button
      onClick={() =>
        openDialog({
          title: "First dialog",
          content: ({ close }) => (
            <Draft
              onReplace={() => {
                previousClose.current = close;
                openDialog({
                  title: "Second dialog",
                  content: () => (
                    <Draft onPreviousClose={() => previousClose.current?.()} />
                  ),
                });
              }}
            />
          ),
        })
      }
    >
      Open test dialog
    </button>
  );
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <DialogProvider>
      <Harness />
    </DialogProvider>
  </StrictMode>,
);
