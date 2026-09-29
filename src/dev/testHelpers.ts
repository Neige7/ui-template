import { canStackItems } from '../mock/server';
import {
  GuildPermissionAction,
  hasGuildPermission,
} from '../screens/guild/permissionMatrix';
import { GuildRole } from '../types';

export { canStackItems };

export function hasGuildPermissionFromMatrix(
  role: GuildRole,
  action: GuildPermissionAction
): boolean {
  return hasGuildPermission(role, action);
}
