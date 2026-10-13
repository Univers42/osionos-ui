/* ************************************************************************** */
/*                                                                            */
/*                                                        :::      ::::::::   */
/*   Dropdown.tsx                                       :+:      :+:    :+:   */
/*                                                    +:+ +:+         +:+     */
/*   By: dlesieur <dlesieur@student.42.fr>          +#+  +:+       +#+        */
/*                                                +#+#+#+#+#+   +#+           */
/*   Created: 2026/05/18 21:19:22 by dlesieur          #+#    #+#             */
/*   Updated: 2026/05/18 21:19:22 by dlesieur         ###   ########.fr       */
/*                                                                            */
/* ************************************************************************** */

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Check, ChevronDown } from "lucide-react";

import { menuPlacement, showsValue, triggerMoved, type MenuWidth } from "./dropdownLayout";
import { TRIGGER_BASE, TRIGGER_VARIANT } from "./dropdownStyles";

export interface DropdownOption<T extends string> {
  value: T;
  label: string;
  icon?: React.ReactNode;
  description?: string;
  disabled?: boolean;
}

interface DropdownProps<T extends string> {
  value: T;
  options: DropdownOption<T>[];
  onChange: (next: T) => void;
  disabled?: boolean;
  placeholder?: string;
  align?: "start" | "end";
  width?: MenuWidth;
  /** Accessible name of the trigger; without it the shown value names it. */
  label?: string;
  /** "inline" drops the border and background so the trigger sits in a row of text; "chip" shows the value as a pill. */
  variant?: "field" | "inline" | "chip";
}

function enabledOptionIndex<T extends string>(options: DropdownOption<T>[], start: number, direction: 1 | -1) {
  if (options.length === 0) return -1;
  for (let step = 1; step <= options.length; step++) {
    const index = (start + step * direction + options.length) % options.length;
    if (!options[index].disabled) return index;
  }
  return -1;
}

export function Dropdown<T extends string>({
  value,
  options,
  onChange,
  disabled = false,
  placeholder = "Select",
  align = "start",
  width = "trigger",
  label,
  variant = "field",
}: Readonly<DropdownProps<T>>) {
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const menuRef = useRef<HTMLDivElement | null>(null);
  const optionRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const [open, setOpen] = useState(false);
  const selectedIndex = useMemo(() => options.findIndex((option) => option.value === value), [options, value]);
  const [activeIndex, setActiveIndex] = useState(Math.max(0, selectedIndex));
  const [menuStyle, setMenuStyle] = useState<React.CSSProperties>({ opacity: 0 });
  const typeAheadRef = useRef("");
  const typeAheadTimerRef = useRef<ReturnType<typeof globalThis.setTimeout> | null>(null);
  const listboxId = useMemo(() => `dropdown-${crypto.randomUUID()}`, []);
  const selectedOption = options[selectedIndex];
  // An option whose value is "" means "nothing chosen" and shows the placeholder, muted.
  const hasValue = showsValue(selectedOption);

  const updatePosition = useCallback(() => {
    const trigger = triggerRef.current;
    if (!trigger) return;
    const placement = menuPlacement(
      trigger.getBoundingClientRect(),
      { width: globalThis.innerWidth, height: globalThis.innerHeight },
      width,
      align,
    );
    setMenuStyle({ position: "fixed", ...placement, opacity: 1, zIndex: 10003 });
  }, [align, width]);

  const openMenu = useCallback(() => {
    if (disabled) return;
    setActiveIndex(selectedIndex >= 0 ? selectedIndex : options.findIndex((option) => !option.disabled));
    setOpen(true);
  }, [disabled, options, selectedIndex]);

  const closeMenu = useCallback(() => setOpen(false), []);

  const choose = useCallback(
    (index: number) => {
      const option = options[index];
      if (!option || option.disabled) return;
      onChange(option.value);
      closeMenu();
      requestAnimationFrame(() => triggerRef.current?.focus());
    },
    [closeMenu, onChange, options],
  );

  const focusByFirstLetter = useCallback(
    (letter: string) => {
      typeAheadRef.current += letter.toLowerCase();
      if (typeAheadTimerRef.current) globalThis.clearTimeout(typeAheadTimerRef.current);
      typeAheadTimerRef.current = globalThis.setTimeout(() => { typeAheadRef.current = ""; }, 700);
      const needle = typeAheadRef.current;
      const index = options.findIndex(
        (option) => !option.disabled && option.label.toLowerCase().startsWith(needle),
      );
      if (index >= 0) setActiveIndex(index);
    },
    [options],
  );

  useEffect(() => {
    if (!open) return undefined;
    const frame = requestAnimationFrame(() => {
      updatePosition();
      // preventScroll: updatePosition() only queues the fixed-position style (the
      // DOM still has last render's — on first open, the unpositioned `{opacity:0}`
      // default), so a plain .focus() here can make the browser scroll the still
      // statically-flowed portal into view. That scroll is caught by the
      // document-capture "scroll closes the menu" handler below, self-closing the
      // menu it just opened (flaky: depends on whether the page is tall enough to
      // need the scroll).
      optionRefs.current[activeIndex]?.focus({ preventScroll: true });
    });

    const handlePointerDown = (event: PointerEvent) => {
      const target = event.target as Node;
      if (menuRef.current?.contains(target) || triggerRef.current?.contains(target)) return;
      closeMenu();
    };
    const openedAt = triggerRef.current?.getBoundingClientRect();
    const handleScroll = (event: Event) => {
      const target = event.target as Node;
      if (menuRef.current?.contains(target)) return;
      const now = triggerRef.current?.getBoundingClientRect();
      if (openedAt && now && !triggerMoved(openedAt, now)) return;
      closeMenu();
    };
    const handleResize = () => updatePosition();

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("scroll", handleScroll, true);
    globalThis.addEventListener("resize", handleResize);
    return () => {
      cancelAnimationFrame(frame);
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("scroll", handleScroll, true);
      globalThis.removeEventListener("resize", handleResize);
    };
  }, [activeIndex, closeMenu, open, updatePosition]);

  useEffect(() => {
    if (!open) return;
    optionRefs.current[activeIndex]?.focus({ preventScroll: true });
  }, [activeIndex, open]);

  const handleTriggerKeyDown = useCallback(
    (event: React.KeyboardEvent<HTMLButtonElement>) => {
      if (["ArrowDown", "ArrowUp", "Enter", " "].includes(event.key)) {
        event.preventDefault();
        openMenu();
      }
    },
    [openMenu],
  );

  const handleMenuKeyDown = useCallback(
    (event: React.KeyboardEvent<HTMLDivElement>) => {
      if (event.key === "Escape") {
        event.preventDefault();
        // The list is portaled to <body>; without this the keydown reaches a
        // parent menu's document-level Escape handler, which closes that menu
        // too and strands focus on an unmounted trigger.
        event.stopPropagation();
        closeMenu();
        triggerRef.current?.focus();
      } else if (event.key === "ArrowDown") {
        event.preventDefault();
        setActiveIndex((index) => enabledOptionIndex(options, index, 1));
      } else if (event.key === "ArrowUp") {
        event.preventDefault();
        setActiveIndex((index) => enabledOptionIndex(options, index, -1));
      } else if (event.key === "Home") {
        event.preventDefault();
        setActiveIndex(options.findIndex((option) => !option.disabled));
      } else if (event.key === "End") {
        event.preventDefault();
        for (let index = options.length - 1; index >= 0; index--) {
          if (!options[index].disabled) {
            setActiveIndex(index);
            break;
          }
        }
      } else if (event.key === "Enter") {
        event.preventDefault();
        choose(activeIndex);
      } else if (event.key.length === 1 && /\S/.test(event.key)) {
        focusByFirstLetter(event.key);
      }
    },
    [activeIndex, choose, closeMenu, focusByFirstLetter, options],
  );

  return (
    <>
      <button // NOSONAR - ARIA combobox is required for the custom portaled dropdown menu.
        ref={triggerRef}
        type="button"
        role="combobox"
        aria-controls={open ? listboxId : undefined}
        aria-expanded={open}
        aria-haspopup="listbox"
        aria-label={label}
        disabled={disabled}
        className={`${TRIGGER_BASE} ${TRIGGER_VARIANT[variant]}`}
        onClick={() => (open ? closeMenu() : openMenu())}
        onKeyDown={handleTriggerKeyDown}
      >
        <span className={`truncate${hasValue ? "" : " text-[var(--osio-fg-subtle)]"}`}>
          {hasValue ? selectedOption.label : placeholder}
        </span>
        <ChevronDown size={14} className="shrink-0 text-[var(--osio-fg-muted)]" />
      </button>
      {open && typeof document !== "undefined" ? createPortal(
        <div // NOSONAR - ARIA listbox is required for the custom portaled dropdown menu.
          ref={menuRef}
          id={listboxId}
          role="listbox"
          tabIndex={-1}
          className="overflow-y-auto rounded-[var(--osio-overlay-radius)] border border-[var(--osio-overlay-border)] bg-[var(--osio-overlay-bg)] p-[var(--osio-overlay-padding)] shadow-[var(--osio-overlay-shadow)] outline-none animate-[osio-pop-in_var(--osio-dur-fast)_var(--osio-ease-emphasized)]"
          style={menuStyle}
          onKeyDown={handleMenuKeyDown}
          // The list is portaled to <body>, outside any menu this dropdown sits
          // in, so a parent's document-level mousedown "click outside" handler
          // would close that menu — and unmount this list — before the option's
          // click lands.
          onMouseDown={(event) => event.stopPropagation()}
        >
          {options.map((option, index) => (
            <button
              key={option.value}
              ref={(node) => { optionRefs.current[index] = node; }}
              type="button"
              role="option"
              aria-selected={option.value === value}
              disabled={option.disabled}
              className="flex w-full items-start gap-2 rounded-[var(--osio-control-radius)] px-3 py-2 text-left text-sm text-[var(--osio-fg-default)] outline-none transition-colors duration-[var(--osio-dur-fast)] ease-[var(--osio-ease-standard)] hover:bg-[var(--osio-control-bg-hover)] focus-visible:bg-[var(--osio-control-bg-hover)] aria-selected:bg-[var(--osio-bg-muted)] aria-selected:text-[var(--osio-fg-strong)] disabled:cursor-not-allowed disabled:text-[var(--osio-fg-subtle)] disabled:hover:bg-transparent"
              onClick={() => choose(index)}
            >
              {option.icon ? <span className="mt-0.5 shrink-0 text-[var(--osio-fg-muted)]">{option.icon}</span> : null}
              <span className="min-w-0 flex-1">
                <span className="block truncate font-medium">{option.label}</span>
                {option.description ? <span className="mt-0.5 block text-xs text-[var(--osio-fg-muted)]">{option.description}</span> : null}
              </span>
              {option.value === value ? <Check size={14} className="mt-0.5 shrink-0 text-[var(--osio-accent)]" /> : null}
            </button>
          ))}
        </div>,
        document.body,
      ) : null}
    </>
  );
}
