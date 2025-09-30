import { type User } from '~/modules/user/domain/user'

export function saveUserIdToLocalStorage(userId: User['uuid']) {
  localStorage.setItem('currentUserUUID', userId)
}

export function loadUserIdFromLocalStorage() {
  const userId = localStorage.getItem('currentUserUUID')
  return userId !== null ? userId : 'a141dbbd-d33b-4a90-918d-cbaddc769c73'
}
