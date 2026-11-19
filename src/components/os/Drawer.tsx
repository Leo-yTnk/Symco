import {
  useId,
  useLayoutEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { Button } from "./controls";

export function Drawer({
  title,
  caption,
  close,
  children,
}: {
  title: string;
  caption?: string;
  close: () => void;
  children: ReactNode | ((dismiss: () => void) => ReactNode);
}) {
  const id = useId();
  const ref = useRef<HTMLDivElement>(null);
  const closeRef = useRef(close);
  const [closing, setClosing] = useState(false);
  closeRef.current = close;

  useLayoutEffect(() => {
    const previous = document.activeElement;
    const element = ref.current;
    if (!element) return;
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    element.focus();
    return () => {
      document.body.style.overflow = overflow;
      if (previous instanceof HTMLElement && previous.isConnected)
        previous.focus();
    };
  }, []);

  useLayoutEffect(() => {
    if (!closing) return;
    const animations = ref.current?.getAnimations?.() ?? [];
    if (!animations.length) {
      closeRef.current();
      return;
    }
    let active = true;
    void Promise.allSettled(
      animations.map((animation) => animation.finished),
    ).then(() => {
      if (active) closeRef.current();
    });
    return () => {
      active = false;
    };
  }, [closing]);

  const dismiss = () => setClosing(true);

  return createPortal(
    <div
      className="os-overlay"
      data-closing={closing}
      onClick={(event) => {
        if (event.target === event.currentTarget) dismiss();
      }}
    >
      <div
        ref={ref}
        tabIndex={-1}
        className="os-task-panel"
        role="dialog"
        aria-modal="true"
        aria-labelledby={id}
        onKeyDown={(event) => {
          if (event.key === "Escape") {
            event.stopPropagation();
            dismiss();
          }
          if (event.key !== "Tab") return;
          const focusable = Array.from(
            event.currentTarget.querySelectorAll<HTMLElement>(
              "button:not(:disabled), input:not(:disabled), select:not(:disabled), textarea:not(:disabled), a[href]",
            ),
          ).filter((element) => !element.closest("[inert], [hidden]"));
          const first = focusable[0];
          const last = focusable.at(-1);
          if (
            event.shiftKey &&
            (document.activeElement === first ||
              document.activeElement === ref.current)
          ) {
            event.preventDefault();
            last?.focus();
          } else if (!event.shiftKey && document.activeElement === last) {
            event.preventDefault();
            first?.focus();
          }
        }}
      >
        <header>
          <div>
            {caption && <small>{caption}</small>}
            <h2 id={id}>{title}</h2>
          </div>
          <Button variant="icon" aria-label="Fechar painel" onClick={dismiss}>
            <X size={20} />
          </Button>
        </header>
        {typeof children === "function" ? children(dismiss) : children}
      </div>
    </div>,
    document.body,
  );
}
