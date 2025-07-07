// utils/permissions.ts
import { CustomUser } from '@/lib/auth'

/**
 * Check if the current user can view the target user's profile.
 * - Admin: can view all profiles
 * - Employee: can only view their own profile
 * - Leader: can view users in their department or their own profile
 */
export function checkProfileAccess(
  currentUser: CustomUser | null,
  targetUserId: number,
  targetUserDepartment?: number | null
): boolean {
  if (!currentUser) return false

  // Admin can view all profiles
  if (currentUser.role === 'admin') return true
  
  // Employee can only view their own profile
  if (currentUser.role === 'employee') return currentUser.id === targetUserId
  
  // Leader can view users in their department or their own profile
  if (currentUser.role === 'leader') {
    // Can always view their own profile
    if (currentUser.id === targetUserId) return true
    
    // Can view users in their department (both must have department_id)
    if (currentUser.department_id && targetUserDepartment) {
      return currentUser.department_id === targetUserDepartment
    }
    
    // If no department info available, deny access
    return false
  }
  
  return false
}

/**
 * Check if the current user can view the target user's salary.
 * - Admin: can view all salaries
 * - User: can view their own salary
 */
export function checkSalaryAccess(
  currentUser: CustomUser | null,
  targetUserId: number
): boolean {
  if (!currentUser) return false
  return currentUser.role === 'admin' || currentUser.id === targetUserId
}

/**
 * Check if the current user can edit the target user's profile.
 * - Admin: can edit all profiles
 * - Leader: can edit users in their department (but not their role/department)
 * - Employee: cannot edit any profiles
 */
export function checkProfileEditAccess(
  currentUser: CustomUser | null,
  targetUserId: number,
  targetUserDepartment?: number | null
): boolean {
  if (!currentUser) return false

  // Admin can edit all profiles
  if (currentUser.role === 'admin') return true
  
  // Leader can edit users in their department (but not themselves for sensitive fields)
  if (currentUser.role === 'leader') {
    if (currentUser.department_id && targetUserDepartment) {
      return currentUser.department_id === targetUserDepartment
    }
  }
  
  // Employees cannot edit profiles
  return false
}

/**
 * Check if the current user can assign tasks to the target user.
 * - Admin: can assign tasks to anyone
 * - Leader: can assign tasks to users in their department
 * - Employee: cannot assign tasks
 */
export function checkTaskAssignAccess(
  currentUser: CustomUser | null,
  targetUserId: number,
  targetUserDepartment?: number | null
): boolean {
  if (!currentUser) return false

  // Admin can assign tasks to anyone
  if (currentUser.role === 'admin') return true
  
  // Leader can assign tasks to users in their department
  if (currentUser.role === 'leader') {
    if (currentUser.department_id && targetUserDepartment) {
      return currentUser.department_id === targetUserDepartment
    }
  }
  
  // Employees cannot assign tasks
  return false
}

/**
 * Get accessible user IDs for the current user based on their role and department.
 * This is useful for filtering lists of users.
 */
export function getAccessibleUserIds(
  currentUser: CustomUser | null,
  allUsers: { id: number; department_id: number | null }[]
): number[] {
  if (!currentUser) return []

  // Admin can access all users
  if (currentUser.role === 'admin') {
    return allUsers.map(user => user.id)
  }
  
  // Employee can only access their own profile
  if (currentUser.role === 'employee') {
    return [currentUser.id]
  }
  
  // Leader can access users in their department + their own profile
  if (currentUser.role === 'leader') {
    const accessibleIds = [currentUser.id] // Always include their own ID
    
    if (currentUser.department_id) {
      const departmentUserIds = allUsers
        .filter(user => user.department_id === currentUser.department_id)
        .map(user => user.id)
      
      // Merge and remove duplicates
      return [...new Set([...accessibleIds, ...departmentUserIds])]
    }
    
    return accessibleIds
  }
  
  return []
}