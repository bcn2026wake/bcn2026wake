import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../context/AuthContext';
import { updatePhone } from '../../services/auth';

export default function ProfileTab() {
  const { t } = useTranslation();
  const { profile, enterWithProfile } = useAuth();
  
  const [isEditingPhone, setIsEditingPhone] = useState(false);
  const [editedPhone, setEditedPhone] = useState('');
  const [savingPhone, setSavingPhone] = useState(false);

  if (!profile) return null;

  const handleEditPhone = () => {
    setEditedPhone(profile.phone);
    setIsEditingPhone(true);
  };

  const handleSavePhone = async () => {
    if (!editedPhone.trim()) {
      setIsEditingPhone(false);
      return;
    }
    setSavingPhone(true);
    try {
      await updatePhone(profile.id, editedPhone.trim());
      enterWithProfile({ ...profile, phone: editedPhone.trim() });
      setIsEditingPhone(false);
    } catch (err) {
      console.error('Failed to update phone', err);
      // Fallback: just close editing mode or show an error
      setIsEditingPhone(false);
    } finally {
      setSavingPhone(false);
    }
  };

  return (
    <section role="tabpanel">
      <h2 className="tab-title">{t('profile.title')}</h2>

      <div className="card">
        <div className="row">
          <span className="label">{t('profile.name')}</span>
          <span className="value">{profile.name}</span>
        </div>
        <div className="row">
          <span className="label">{t('profile.id')}</span>
          <span className="value">{profile.id}</span>
        </div>
        {(profile.isLeader || profile.isMaintainer) && (
          <div className="row">
            <span className="label">{t('profile.role')}</span>
            <span className="value">
              {profile.isLeader && <span className="badge">{t('profile.leader')}</span>}
              {profile.isMaintainer && <span className="badge">{t('profile.maintainer')}</span>}
            </span>
          </div>
        )}
        <div className="row" style={{ alignItems: isEditingPhone ? 'center' : 'flex-start' }}>
          <span className="label">{t('profile.phone')}</span>
          <span className="value">
            {isEditingPhone ? (
              <div style={{ display: 'flex', gap: '8px' }}>
                <input
                  type="tel"
                  value={editedPhone}
                  onChange={(e) => setEditedPhone(e.target.value)}
                  disabled={savingPhone}
                  className="input"
                  style={{ padding: '4px', maxWidth: '120px' }}
                />
                <button 
                  onClick={handleSavePhone} 
                  disabled={savingPhone}
                  style={{ padding: '4px 8px', cursor: 'pointer' }}
                >
                  Save
                </button>
              </div>
            ) : (
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <a href={`tel:${profile.phone}`}>{profile.phone}</a>
                <button 
                  onClick={handleEditPhone}
                  style={{ padding: '2px 6px', fontSize: '12px', cursor: 'pointer' }}
                >
                  Edit
                </button>
              </div>
            )}
          </span>
        </div>
      </div>

      <div className="card">
        {profile.churchName && (
          <div className="row">
            <span className="label">{t('profile.church')}</span>
            <span className="value">{profile.churchName}</span>
          </div>
        )}
        {profile.teamName && (
          <div className="row">
            <span className="label">{t('profile.team')}</span>
            <span className="value">{profile.teamName}</span>
          </div>
        )}
        {profile.teamCode && (
          <div className="row">
            <span className="label">{t('profile.teamCode')}</span>
            <span className="value">{profile.teamCode}</span>
          </div>
        )}
        {profile.roomNumber && (
          <div className="row">
            <span className="label">{t('profile.room')}</span>
            <span className="value">{profile.roomNumber}</span>
          </div>
        )}
      </div>

      {(profile.leadersName.length > 0 || profile.roommatesName.length > 0) && (
        <div className="card">
          {profile.leadersName.length > 0 && (
            <div className="row">
              <span className="label">{t('profile.leaders')}</span>
              <span className="value">{profile.leadersName.join(', ')}</span>
            </div>
          )}
          {profile.roommatesName.length > 0 && (
            <div className="row">
              <span className="label">{t('profile.roommates')}</span>
              <span className="value">{profile.roommatesName.join(', ')}</span>
            </div>
          )}
        </div>
      )}
    </section>
  );
}
