import {
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
  type KeyboardEvent,
  type MouseEvent,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";
import { Check, ChevronDown, Ellipsis, Pencil, Trash2 } from "lucide-react";
import { Button } from "./controls";

type Anchor = { element: HTMLElement; point?: { x: number; y: number } };

type MenuItem = {
  id: string;
  label: string;
  icon?: ReactNode;
  danger?: boolean;
  disabled?: boolean;
};

function useDropdown() {
  const id = useId();
  const [anchor, setAnchor] = useState<Anchor | null>(null);
  const [closing, setClosing] = useState(false);
  return {
    id,
    anchor,
    closing,
    open(next: Anchor) {
      setClosing(false);
      setAnchor(next);
    },
    close(restoreFocus = false) {
      setClosing(true);
      if (restoreFocus && anchor?.element.isConnected) anchor.element.focus();
    },
    finish() {
      setAnchor(null);
      setClosing(false);
    },
  };
}

function Dropdown({
  menu,
  items,
  label,
  selected,
  onChoose,
  matchAnchor = false,
}: {
  menu: ReturnType<typeof useDropdown>;
  items: MenuItem[];
  label: string;
  selected?: string;
  onChoose: (id: string) => void;
  matchAnchor?: boolean;
}) {
  const { id, anchor, closing, close, finish } = menu;
  const panel = useRef<HTMLDivElement>(null);
  const list = useRef<HTMLDivElement>(null);
  const closeRef = useRef(close);
  const finishRef = useRef(finish);
  const collapsed = useRef(0);
  const animation = useRef<Animation>();
  const [active, setActive] = useState(
    () =>
      items.find((item) => item.id === selected && !item.disabled)?.id ??
      items.find((item) => !item.disabled)?.id,
  );
  closeRef.current = close;
  finishRef.current = finish;

  useLayoutEffect(() => {
    const element = panel.current;
    const content = list.current;
    if (!anchor || !element || !content) return;
    element.style.height = "";
    element.style.width = "";
    element.style.top = "";
    element.style.bottom = "";
    content.style.maxHeight = "";
    const bounds = anchor.element.getBoundingClientRect();
    const style = getComputedStyle(element);
    const gutter = parseFloat(style.getPropertyValue("--space-2")) || 8;
    const viewportWidth =
      document.documentElement.clientWidth || window.innerWidth;
    const viewportHeight = window.innerHeight;
    const width = Math.min(
      viewportWidth - 2 * gutter,
      Math.max(matchAnchor ? bounds.width : 0, element.offsetWidth),
    );
    const x =
      anchor.point?.x ?? (matchAnchor ? bounds.left : bounds.right - width);
    const below = (anchor.point?.y ?? bounds.bottom) + gutter;
    const above = (anchor.point?.y ?? bounds.top) - gutter;
    const naturalHeight = content.scrollHeight + element.clientTop * 2;
    const flip =
      below + naturalHeight > viewportHeight - gutter &&
      above - gutter > viewportHeight - below - gutter;
    const height = Math.min(
      naturalHeight,
      Math.max(0, flip ? above - gutter : viewportHeight - below - gutter),
    );
    element.style.width = `${width}px`;
    element.style.left = `${Math.max(gutter, Math.min(x, viewportWidth - gutter - width))}px`;
    if (flip) element.style.bottom = `${viewportHeight - above}px`;
    else element.style.top = `${below}px`;
    element.style.height = `${height}px`;
    content.style.maxHeight = `${Math.max(0, height - element.clientTop * 2)}px`;
    element.style.visibility = "visible";
    content
      .querySelector<HTMLElement>('[data-active="true"]')
      ?.scrollIntoView?.({ block: "nearest" });
    const padding = getComputedStyle(content);
    collapsed.current = Math.min(
      height,
      (content.firstElementChild?.getBoundingClientRect().height ?? 0) +
        (parseFloat(padding.paddingTop) || 0) +
        (parseFloat(padding.paddingBottom) || 0) +
        element.clientTop * 2,
    );
    if (
      element.animate &&
      motionDuration(style) &&
      height > collapsed.current
    ) {
      const enter = element.animate(
        [{ height: `${collapsed.current}px` }, { height: `${height}px` }],
        {
          duration: motionDuration(style),
          easing: style.getPropertyValue("--ease-out").trim() || "ease-out",
        },
      );
      animation.current = enter;
      element.setAttribute("data-animating", "");
      void enter.finished.then(
        () => {
          if (animation.current === enter)
            element.removeAttribute("data-animating");
        },
        () => {},
      );
    }
    content.focus({ preventScroll: true });
    return () => {
      animation.current?.cancel();
      element.removeAttribute("data-animating");
    };
  }, [anchor, matchAnchor]);

  useLayoutEffect(() => {
    const element = panel.current;
    if (!closing || !element) return;
    const height = element.getBoundingClientRect().height;
    animation.current?.cancel();
    const style = getComputedStyle(element);
    const duration = motionDuration(style);
    if (!element.animate || !duration || height <= collapsed.current) {
      finishRef.current();
      return;
    }
    const exit = element.animate(
      [{ height: `${height}px` }, { height: `${collapsed.current}px` }],
      {
        duration,
        easing: style.getPropertyValue("--ease-out").trim() || "ease-out",
        fill: "forwards",
      },
    );
    animation.current = exit;
    element.setAttribute("data-animating", "");
    let running = true;
    void exit.finished.then(
      () => {
        if (running) finishRef.current();
      },
      () => {},
    );
    return () => {
      running = false;
      exit.cancel();
      element.removeAttribute("data-animating");
    };
  }, [closing]);

  useEffect(() => {
    if (!anchor || closing) return;
    const outside = (event: Event) => {
      if (
        event.target instanceof Node &&
        !panel.current?.contains(event.target) &&
        !anchor.element.contains(event.target)
      )
        closeRef.current();
    };
    const reposition = (event: Event) => {
      if (event.target instanceof Node && panel.current?.contains(event.target))
        return;
      closeRef.current(panel.current?.contains(document.activeElement));
    };
    document.addEventListener("pointerdown", outside, true);
    document.addEventListener("focusin", outside, true);
    window.addEventListener("resize", reposition);
    window.addEventListener("scroll", reposition, true);
    return () => {
      document.removeEventListener("pointerdown", outside, true);
      document.removeEventListener("focusin", outside, true);
      window.removeEventListener("resize", reposition);
      window.removeEventListener("scroll", reposition, true);
    };
  }, [anchor, closing]);

  function choose(item: MenuItem) {
    if (item.disabled || closing) return;
    close(true);
    onChoose(item.id);
  }

  function onKeyDown(event: KeyboardEvent) {
    event.stopPropagation();
    const enabled = items.filter((item) => !item.disabled);
    const index = enabled.findIndex((item) => item.id === active);
    if (event.key === "Tab") {
      close(true);
      return;
    }
    if (event.key === "Escape") {
      event.preventDefault();
      close(true);
      return;
    }
    if ((event.key === " " || event.key === "Enter") && enabled[index]) {
      event.preventDefault();
      choose(enabled[index]);
      return;
    }
    const key = event.key;
    const next =
      key === "Home"
        ? enabled[0]
        : key === "End"
          ? enabled.at(-1)
          : key === "ArrowDown"
            ? enabled[(index + 1) % enabled.length]
            : key === "ArrowUp"
              ? enabled[(index <= 0 ? enabled.length : index) - 1]
              : key.length === 1 &&
                  !event.ctrlKey &&
                  !event.metaKey &&
                  !event.altKey
                ? [
                    ...enabled.slice(index + 1),
                    ...enabled.slice(0, index + 1),
                  ].find((item) =>
                    item.label
                      .toLocaleLowerCase()
                      .startsWith(key.toLocaleLowerCase()),
                  )
                : undefined;
    if (!next) return;
    event.preventDefault();
    setActive(next.id);
    document
      .getElementById(`${id}-${next.id}`)
      ?.scrollIntoView?.({ block: "nearest" });
  }

  return createPortal(
    <div
      className="os-dropdown"
      ref={panel}
      data-closing={closing}
      onClick={(event) => event.stopPropagation()}
    >
      <div
        id={id}
        ref={list}
        className="os-dropdown-list"
        role={matchAnchor ? "listbox" : "menu"}
        aria-label={label}
        tabIndex={-1}
        aria-activedescendant={
          active === undefined ? undefined : `${id}-${active}`
        }
        aria-hidden={closing || undefined}
        onKeyDown={onKeyDown}
        onContextMenu={(event) => event.preventDefault()}
      >
        {items.map((item) => (
          <button
            key={item.id}
            id={`${id}-${item.id}`}
            type="button"
            tabIndex={-1}
            role={matchAnchor ? "option" : "menuitem"}
            aria-selected={matchAnchor ? item.id === selected : undefined}
            disabled={item.disabled || closing}
            className="os-dropdown-option"
            data-danger={item.danger}
            data-active={active === item.id}
            onMouseMove={() => {
              if (!item.disabled) setActive(item.id);
            }}
            onMouseDown={(event) => event.preventDefault()}
            onClick={() => choose(item)}
          >
            {item.icon}
            <span>{item.label}</span>
            {item.id === selected && <Check size={15} aria-hidden="true" />}
          </button>
        ))}
      </div>
    </div>,
    document.body,
  );
}

function motionDuration(style: CSSStyleDeclaration) {
  const token = style.getPropertyValue("--duration-normal").trim();
  return (parseFloat(token) || 0) * (token.endsWith("ms") ? 1 : 1000);
}

export function Select<Value extends string>({
  id,
  label,
  value,
  options,
  onChange,
}: {
  id?: string;
  label: string;
  value: Value;
  options: readonly { value: Value; label: string; disabled?: boolean }[];
  onChange: (value: Value) => void;
}) {
  const menu = useDropdown();
  const expanded = !!menu.anchor && !menu.closing;
  return (
    <>
      <Button
        id={id}
        className="os-select"
        aria-label={label}
        aria-describedby={`${menu.id}-value`}
        aria-haspopup="listbox"
        aria-expanded={expanded}
        aria-controls={expanded ? menu.id : undefined}
        onClick={(event) => {
          if (expanded) menu.close(true);
          else menu.open({ element: event.currentTarget });
        }}
        onKeyDown={(event) => {
          if (!["ArrowDown", "ArrowUp"].includes(event.key)) return;
          event.preventDefault();
          menu.open({ element: event.currentTarget });
        }}
      >
        <span id={`${menu.id}-value`}>
          {options.find((option) => option.value === value)?.label ?? "—"}
        </span>
        <ChevronDown size={16} aria-hidden="true" />
      </Button>
      {menu.anchor && (
        <Dropdown
          menu={menu}
          items={options.map((option) => ({
            ...option,
            id: option.value,
          }))}
          label={label}
          selected={value}
          matchAnchor
          onChoose={(next) => {
            const option = options.find((item) => item.value === next);
            if (option && option.value !== value) onChange(option.value);
          }}
        />
      )}
    </>
  );
}

export type RecordAction = MenuItem & { run: () => void };
type ContextEvents = {
  onContextMenu: (event: MouseEvent<HTMLElement>) => void;
  onKeyDown: (event: KeyboardEvent<HTMLElement>) => void;
};

export function RecordActions({
  label,
  items,
  children,
}: {
  label: string;
  items: RecordAction[];
  children: (events: ContextEvents, trigger: ReactNode) => ReactNode;
}) {
  const menu = useDropdown();
  const triggerRef = useRef<HTMLButtonElement>(null);
  const expanded = !!menu.anchor && !menu.closing;
  return (
    <>
      {children(
        {
          onContextMenu(event) {
            if (
              event.target instanceof Element &&
              event.target.closest(
                "input, textarea, select, a, [contenteditable=true], [aria-haspopup=listbox]",
              )
            )
              return;
            if (!triggerRef.current) return;
            event.preventDefault();
            event.stopPropagation();
            menu.open({
              element: triggerRef.current,
              point:
                event.clientX || event.clientY
                  ? { x: event.clientX, y: event.clientY }
                  : undefined,
            });
          },
          onKeyDown(event) {
            if (
              event.defaultPrevented ||
              !triggerRef.current ||
              !(
                event.key === "ContextMenu" ||
                (event.shiftKey && event.key === "F10")
              )
            )
              return;
            event.preventDefault();
            event.stopPropagation();
            menu.open({ element: triggerRef.current });
          },
        },
        <button
          type="button"
          className="os-icon-button os-record-menu-trigger"
          ref={triggerRef}
          aria-label={label}
          aria-haspopup="menu"
          aria-expanded={expanded}
          aria-controls={expanded ? menu.id : undefined}
          onClick={(event) => {
            event.stopPropagation();
            if (expanded) menu.close(true);
            else menu.open({ element: event.currentTarget });
          }}
        >
          <Ellipsis size={17} aria-hidden="true" />
        </button>,
      )}
      {menu.anchor && (
        <Dropdown
          menu={menu}
          items={items}
          label={label}
          onChoose={(id) => items.find((item) => item.id === id)?.run()}
        />
      )}
    </>
  );
}

export function EditRecordActions({
  title,
  edit,
  remove,
  children,
}: {
  title: string;
  edit: () => void;
  remove: () => void;
  children: Parameters<typeof RecordActions>[0]["children"];
}) {
  return (
    <RecordActions
      label={`Ações de ${title}`}
      items={[
        { id: "edit", label: "Editar", icon: <Pencil size={16} />, run: edit },
        {
          id: "delete",
          label: "Apagar",
          icon: <Trash2 size={16} />,
          danger: true,
          run: remove,
        },
      ]}
    >
      {children}
    </RecordActions>
  );
}
