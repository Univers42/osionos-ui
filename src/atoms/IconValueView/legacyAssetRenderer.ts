/* ************************************************************************** */
/*                                                                            */
/*                                                        :::      ::::::::   */
/*   legacyAssetRenderer.ts                             :+:      :+:    :+:   */
/*                                                    +:+ +:+         +:+     */
/*   By: dlesieur <dlesieur@student.42.fr>          +#+  +:+       +#+        */
/*                                                +#+#+#+#+#+   +#+           */
/*   Created: 2026/10/13 00:00:00 by dlesieur          #+#    #+#             */
/*   Updated: 2026/10/13 00:00:00 by dlesieur         ###   ########.fr       */
/*                                                                            */
/* ************************************************************************** */

// Its own module so LazyLegacyAssetRenderer can load it on demand: AssetRenderer resolves values
// through ui-collection's emoji and icon catalogs (~95 KB, plus maps built over them on load),
// which only legacy values (`icon:<catalog id>`, a bare catalog id, `url:`) still need.
export { AssetRenderer } from "@univers42/ui-collection";
