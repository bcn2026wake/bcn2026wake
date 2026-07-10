import { config } from '../config';
import { getCurrentIdToken } from './auth';
import type { ContactsDirectory, UserProfile } from '../types';


export async function fetchContactsDirectory(
  profile: UserProfile,
): Promise<ContactsDirectory> {
  if (config.demoMode) return demoDirectory(profile);

  const token = await getCurrentIdToken();
  if (!token) throw new Error('Not authenticated');

  const res = await fetch(`${config.apiBaseUrl}/contacts`, {
    headers: { Authorization: token },
  });
  if (!res.ok) throw new Error(`Contacts API error: ${res.status}`);
  return res.json();
}

/** Offline preview data mirroring the shape the API returns for each role. */
function demoDirectory(profile: UserProfile): ContactsDirectory {
  if (profile.isMaintainer) {
    return {
      role: 'maintainer',
      groups: [
        {
          teamCode: 'AUR',
          teamName: 'Team Aurora',
          members: [
            { id: 'X0000000T', name: 'Alex Rivera', phone: '+34600111001', roomNumber: '204' },
            { id: 'X0000000M', name: 'Mei Chen', phone: '+34600111002', roomNumber: '204', isMaintainer: true },
          ],
        },
        {
          teamCode: 'NEB',
          teamName: 'Team Nebula',
          members: [
            { id: 'X0000003C', name: 'Carlos Gómez', phone: '+34600111003', roomNumber: '311', isLeader: true },
            { id: 'X0000004P', name: 'Priya Patel', phone: '+34600111004', roomNumber: '311' },
          ],
        },
      ],
      maintainers: [
        { id: 'X0000000M', name: 'Mei Chen', phone: '+34600111002', teamCode: 'AUR', teamName: 'Team Aurora' },
      ],
    };
  }

  if (profile.isLeader) {
    return {
      role: 'leader',
      people: [
        { id: 'X0000004P', name: 'Priya Patel', phone: '+34600111004', roomNumber: '311' },
      ],
    };
  }

  return {
    role: 'member',
    people: [
      { id: 'X0000003C', name: 'Carlos Gómez', phone: '+34600111003', roomNumber: '311', isLeader: true },
    ],
  };
}
