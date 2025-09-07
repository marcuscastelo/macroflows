import { type User } from '~/modules/user/domain/user'

export function saveUserIdToLocalStorage(userId: User['id']) {
  localStorage.setItem('currentUserId', String(userId))
}

export function loadUserIdFromLocalStorage() {
  const userId = localStorage.getItem('currentUserId')
  return userId !== null ? Number(userId) : 3
}
