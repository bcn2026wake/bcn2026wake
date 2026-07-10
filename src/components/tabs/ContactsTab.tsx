import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { EMERGENCY_CONTACTS } from '../../data/eventData';
import { useAuth } from '../../context/AuthContext';
import { fetchContactsDirectory } from '../../services/contacts';
import type { ContactsDirectory, DirectoryPerson } from '../../types';

const CALL_ICON = (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2 4.2 2 2 0 0 1 4 2h3a2 2 0 0 1 2 1.7c.1.9.3 1.8.6 2.6a2 2 0 0 1-.5 2.1L7.9 9.9a16 16 0 0 0 6 6l1.5-1.2a2 2 0 0 1 2.1-.5c.8.3 1.7.5 2.6.6a2 2 0 0 1 1.7 2z" />
  </svg>
);

function PersonRow({ person, subtitle }: { person: DirectoryPerson; subtitle?: string }) {
  const { t } = useTranslation();
  const tags = [
    person.isLeader ? t('contacts.tags.leader') : null,
    person.isMaintainer ? t('contacts.tags.maintainer') : null,
  ].filter(Boolean);

  return (
    <div className="card">
      <div className="row">
        <div>
          <strong>{person.name}</strong>
          {tags.length > 0 && <span className="tl-badge">{tags.join(' · ')}</span>}
          {subtitle && <div className="hint-text">{subtitle}</div>}
          {person.phone && <div className="hint-text">{person.phone}</div>}
        </div>
        {person.phone && (
          <a
            className="contact-call"
            href={`tel:${person.phone}`}
            aria-label={`${t('contacts.call')} ${person.name}`}
          >
            {CALL_ICON}
            {t('contacts.call')}
          </a>
        )}
      </div>
    </div>
  );
}

function Directory({ directory }: { directory: ContactsDirectory }) {
  const { t } = useTranslation();
  const roomOf = (p: DirectoryPerson) =>
    p.roomNumber ? `${t('profile.room')} ${p.roomNumber}` : undefined;

  if (directory.role === 'maintainer') {
    const groups = directory.groups ?? [];
    const maintainers = directory.maintainers ?? [];
    if (groups.length === 0 && maintainers.length === 0) {
      return <div className="center-state">{t('contacts.directory.empty')}</div>;
    }
    return (
      <>
        {groups.map((g) => (
          <div key={g.teamCode}>
            <h3 className="section-subtitle">{g.teamName}</h3>
            {g.members.map((p) => (
              <PersonRow key={p.id} person={p} subtitle={roomOf(p)} />
            ))}
          </div>
        ))}
        {maintainers.length > 0 && (
          <div>
            <h3 className="section-subtitle">{t('contacts.directory.maintainers')}</h3>
            {maintainers.map((p) => (
              <PersonRow key={p.id} person={p} subtitle={p.teamName} />
            ))}
          </div>
        )}
      </>
    );
  }

  const people = directory.people ?? [];
  const heading =
    directory.role === 'leader'
      ? t('contacts.directory.group')
      : t('contacts.directory.leaders');

  return (
    <>
      <h3 className="section-subtitle">{heading}</h3>
      {people.length === 0 ? (
        <div className="center-state">{t('contacts.directory.empty')}</div>
      ) : (
        people.map((p) => <PersonRow key={p.id} person={p} subtitle={roomOf(p)} />)
      )}
    </>
  );
}

export default function ContactsTab() {
  const { t } = useTranslation();
  const { profile } = useAuth();

  const [directory, setDirectory] = useState<ContactsDirectory | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const load = useCallback(() => {
    if (!profile) return () => {};
    let active = true;
    setLoading(true);
    setError(false);
    fetchContactsDirectory(profile)
      .then((d) => active && setDirectory(d))
      .catch(() => active && setError(true))
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, [profile]);

  useEffect(() => load(), [load]);

  return (
    <section role="tabpanel">
      {/* General contacts — everybody sees these (static, translatable). */}
      <h2 className="tab-title">{t('contacts.title')}</h2>
      {EMERGENCY_CONTACTS.map((c) => (
        <div className="card" key={c.id}>
          <div className="row">
            <div>
              <strong>{t(c.nameKey)}</strong>
              {c.roleKey && <div className="hint-text">{t(c.roleKey)}</div>}
              <div className="hint-text">{c.phone}</div>
            </div>
            <a
              className="contact-call"
              href={`tel:${c.phone}`}
              aria-label={`${t('contacts.call')} ${t(c.nameKey)}`}
            >
              {CALL_ICON}
              {t('contacts.call')}
            </a>
          </div>
        </div>
      ))}

      {/* Personal directory — role-based, fetched from DynamoDB. */}
      <h2 className="tab-title" style={{ marginTop: 24 }}>
        {t('contacts.directory.title')}
      </h2>

      {loading ? (
        <div className="center-state">{t('common.loading')}</div>
      ) : error ? (
        <div className="center-state">
          <div>{t('contacts.loadError')}</div>
          <button className="btn" style={{ marginTop: 12 }} onClick={load}>
            {t('common.retry')}
          </button>
        </div>
      ) : directory ? (
        <Directory directory={directory} />
      ) : null}
    </section>
  );
}

