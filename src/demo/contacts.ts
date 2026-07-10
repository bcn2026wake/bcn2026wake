import type { ContactsDirectory, DirectoryPerson, UserProfile } from '../types';
import demoData from './data.json';

type Person = (typeof demoData.people)[number];

const teamName = (code: string) =>
  demoData.camp.teams.find((t) => t.code === code)?.name ?? '';

const toPerson = (p: Person): DirectoryPerson => ({
  id: p.id,
  name: p.name,
  phone: p.phone,
  roomNumber: p.roomNumber,
  isLeader: p.isLeader,
  isMaintainer: p.isMaintainer,
});

/** Role-based mock directory derived from the flat `people` list in demo mode. */
export function demoDirectory(profile: UserProfile): ContactsDirectory {
  const people = demoData.people;
  const roommates = people
    .filter((p) => p.id !== profile.id && p.roomNumber === profile.roomNumber)
    .map(toPerson);

  if (profile.isMaintainer) {
    return {
      role: 'maintainer',
      roommates,
      groups: demoData.camp.teams.map((t) => ({
        teamCode: t.code,
        teamName: t.name,
        members: people.filter((p) => p.teamCode === t.code).map(toPerson),
      })),
      maintainers: people
        .filter((p) => p.isMaintainer)
        .map((p) => ({ ...toPerson(p), teamCode: p.teamCode, teamName: teamName(p.teamCode) })),
    };
  }

  if (profile.isLeader) {
    return {
      role: 'leader',
      roommates,
      people: people
        .filter((p) => p.teamCode === profile.teamCode && p.id !== profile.id)
        .map(toPerson),
    };
  }

  return {
    role: 'member',
    roommates,
    // A member's contacts are their team's leaders.
    people: people
      .filter((p) => p.teamCode === profile.teamCode && p.isLeader)
      .map(toPerson),
  };
}
