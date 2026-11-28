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

// The picker (emoji list, color swatches, virtual list: ~116 KB beyond what boot already loaded,
// production build 2026-10-13) is off the boot path: it loads the first time one is opened,
// so the sign-in screen and a home that never opens a picker never download it.
import React, { Suspense } from "react";
import type { IconPicker as EagerIconPicker } from "./IconPicker";

type IconPickerProps = React.ComponentProps<typeof EagerIconPicker>;

const loadIconPicker = () => import("./IconPicker");
const LoadedIconPicker = React.lazy(() => loadIconPicker().then((module) => ({ default: module.IconPicker })));

export const IconPicker: React.FC<IconPickerProps> = (props) => (
  <Suspense fallback={null}>
    <LoadedIconPicker {...props} />
  </Suspense>
);
