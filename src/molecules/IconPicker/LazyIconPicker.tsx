/* ************************************************************************** */
/*                                                                            */
/*                                                        :::      ::::::::   */
/*   LazyIconPicker.tsx                                 :+:      :+:    :+:   */
/*                                                    +:+ +:+         +:+     */
/*   By: dlesieur <dlesieur@student.42.fr>          +#+  +:+       +#+        */
/*                                                +#+#+#+#+#+   +#+           */
/*   Created: 2026/10/13 00:00:00 by dlesieur          #+#    #+#             */
/*   Updated: 2026/10/13 00:00:00 by dlesieur         ###   ########.fr       */
/*                                                                            */
/* ************************************************************************** */

// The picker (emoji list, icon catalog, color board, asset tabs - ~130 KB with its ui-collection
// data) is off the boot path: it loads once the browser is idle, so the first open does not wait
// on it either.
import React, { Suspense } from "react";
import type { IconPicker as EagerIconPicker } from "./IconPicker";

type IconPickerProps = React.ComponentProps<typeof EagerIconPicker>;

const loadIconPicker = () => import("./IconPicker");
const LoadedIconPicker = React.lazy(() => loadIconPicker().then((module) => ({ default: module.IconPicker })));

// Ponytail: a page that is never idle within 4 s loads it then anyway; a failed warm-up is
// dropped because the first open imports again and reports its own failure.
if (globalThis.window !== undefined) {
  const warm = (): void => { loadIconPicker().catch(() => undefined); };
  if (typeof globalThis.requestIdleCallback === "function") globalThis.requestIdleCallback(warm, { timeout: 4000 });
  else globalThis.setTimeout(warm, 2000);
}

export const IconPicker: React.FC<IconPickerProps> = (props) => (
  <Suspense fallback={null}>
    <LoadedIconPicker {...props} />
  </Suspense>
);
