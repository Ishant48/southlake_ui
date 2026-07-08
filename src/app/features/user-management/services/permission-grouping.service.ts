import { Injectable } from '@angular/core';
import { Module, Permission } from '../models/permission.model';

export interface PermissionSubModule {
  name: string;
  permissions: Permission[];
}

export interface PermissionGroup {
  name: string;
  icon: string;
  permissions: Permission[];
  subModules: PermissionSubModule[];
}

const GROUP_ICONS = ['grid', 'file', 'home', 'admin'];
const GENERAL_GROUP_NAME = 'General';

@Injectable({ providedIn: 'root' })
export class PermissionGroupingService {
  buildGroups(modules: Module[], permissions: Permission[]): PermissionGroup[] {
    const activeModules = modules.filter(m => m.isActive !== false);
    const byId = new Map(activeModules.map(m => [m.id, m]));
    const childrenOf = new Map<string, Module[]>();
    const topLevel: Module[] = [];

    for (const mod of activeModules) {
      const parentId = mod.parentModuleId;
      if (parentId && byId.has(parentId)) {
        const siblings = childrenOf.get(parentId) ?? [];
        siblings.push(mod);
        childrenOf.set(parentId, siblings);
      } else {
        topLevel.push(mod);
      }
    }

    topLevel.sort((a, b) => a.sortOrder - b.sortOrder);

    const matchedPermissionIds = new Set<string>();
    const groups: PermissionGroup[] = topLevel.map((mod, index) => {
      const subModules = this.collectLeafSubModules(
        mod,
        childrenOf,
        permissions,
        matchedPermissionIds,
      );
      const groupPermissions = subModules.reduce<Permission[]>(
        (acc, sub) => [...acc, ...sub.permissions],
        [],
      );
      return {
        name: mod.label,
        icon: GROUP_ICONS[index % GROUP_ICONS.length],
        permissions: groupPermissions,
        subModules,
      };
    });

    const orphanPermissions = permissions.filter(p => !matchedPermissionIds.has(p.id));
    if (orphanPermissions.length > 0) {
      groups.push({
        name: GENERAL_GROUP_NAME,
        icon: 'admin',
        permissions: orphanPermissions,
        subModules: [{ name: GENERAL_GROUP_NAME, permissions: orphanPermissions }],
      });
    }

    return groups;
  }

  private collectLeafSubModules(
    mod: Module,
    childrenOf: Map<string, Module[]>,
    permissions: Permission[],
    matchedIds: Set<string>,
  ): PermissionSubModule[] {
    const children = (childrenOf.get(mod.id) ?? [])
      .slice()
      .sort((a, b) => a.sortOrder - b.sortOrder);
    const isHeaderOnly = !mod.route && !mod.permissionAction && children.length > 0;

    if (isHeaderOnly) {
      return children.flatMap(child =>
        this.collectLeafSubModules(child, childrenOf, permissions, matchedIds),
      );
    }

    const matched = mod.permissionAction
      ? permissions.filter(p => p.action === mod.permissionAction)
      : [];
    matched.forEach(p => matchedIds.add(p.id));
    matched.sort((a, b) => a.label.localeCompare(b.label));

    const ownSubModule: PermissionSubModule = { name: mod.label, permissions: matched };
    const childSubModules = children.flatMap(child =>
      this.collectLeafSubModules(child, childrenOf, permissions, matchedIds),
    );

    return [ownSubModule, ...childSubModules];
  }
}
