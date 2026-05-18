import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { api } from '../../server/api';
import type { UserSummary } from '../types/domain';
import ProfileEditorModal from './ProfileEditorModal';
import UserAppointments from './UserApointment';
import UserSubscriptions from './UserSubscriptions';
import './css/DashboardLayout.css';

interface DashboardLayoutProps {
  children: React.ReactNode;
  user: UserSummary | null;
  onUserUpdate: (user: UserSummary) => void;
  activeTab?: string;
  onTabChange?: (tab: string) => void;
  searchQuery?: string;
  onSearchChange?: (query: string) => void;
}

const IconScissor = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="6" cy="6" r="3"/><circle cx="6" cy="18" r="3"/>
    <line x1="20" y1="4" x2="8.12" y2="15.88"/><line x1="14.47" y1="14.48" x2="20" y2="20"/>
    <line x1="8.12" y1="8.12" x2="12" y2="12"/>
  </svg>
);

const IconSearch = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
  </svg>
);

const IconCalendar = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
    <line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/>
    <line x1="3" y1="10" x2="21" y2="10"/>
  </svg>
);

const IconDashboard = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/>
    <rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/>
  </svg>
);

const IconUsers = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>
    <path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
  </svg>
);

const IconLogout = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>
  </svg>
);

const IconMenu = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="18" x2="21" y2="18"/>
  </svg>
);

const IconChevronLeft = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="15 18 9 12 15 6"/>
  </svg>
);

export default function DashboardLayout({ 
  children, 
  user, 
  onUserUpdate, 
  activeTab, 
  onTabChange,
  searchQuery,
  onSearchChange
}: DashboardLayoutProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const [profileModalOpen, setProfileModalOpen] = useState(false);
  const [appointmentsOpen, setAppointmentsOpen] = useState(false);
  const [subscriptionsOpen, setSubscriptionsOpen] = useState(false);
  const [avatarLoadFailed, setAvatarLoadFailed] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);

  if (!user) return <>{children}</>;

  const isBarber = user.userTable === 'usuarioBarber';
  const isAdmin = user.role === 'ADM_Estabelecimento';
  const isClient = user.role === 'Cliente' && !isBarber;

  const navItems = isClient 
    ? [
        { id: 'discover', label: 'Descobrir', icon: <IconSearch />, path: '/painel' },
        { id: 'bookings', label: 'Meus Agendamentos', icon: <IconCalendar />, path: '/painel', action: () => setAppointmentsOpen(true) },
        { id: 'subscriptions', label: 'Minhas Assinaturas', icon: <IconUsers />, path: '/painel', action: () => setSubscriptionsOpen(true) },
      ]
    : isBarber
    ? [
        { id: 'dashboard', label: 'Visão Geral', icon: <IconDashboard />, path: '/barber-painel' },
      ]
    : isAdmin
    ? [
        { id: 'admin-dashboard', label: 'Painel Admin', icon: <IconDashboard />, path: '/painel-admin' },
      ]
    : [];

  const fotoUrl = api.getPhotoUrl(user.fotoUrl || user.foto_url || user.imagem_url) || null;

  const handleLogout = () => {
    localStorage.removeItem('usuario');
    localStorage.removeItem('usuarioId');
    navigate('/login');
  };

  const handleNavItemClick = (item: any) => {
    if (item.action) {
      item.action();
    } else {
      // Close any layout-managed modals when navigating to a "real" tab
      setAppointmentsOpen(false);
      setSubscriptionsOpen(false);
      
      if (onTabChange) {
        onTabChange(item.id);
      }
      navigate(item.path);
    }
  };

  const currentActiveTab = activeTab || (location.pathname === '/painel' && !appointmentsOpen && !subscriptionsOpen ? 'discover' : '');

  return (
    <div className={`dashboard-container ${isCollapsed ? 'collapsed' : ''}`}>
      <aside className="dashboard-sidebar">
        <div className="sidebar-header">
          <div className="dashboard-logo" onClick={() => navigate('/')}>
            <div className="logo-icon"><IconScissor /></div>
            {!isCollapsed && <span>DINAMIC CUT</span>}
          </div>
          <button className="collapse-btn" onClick={() => setIsCollapsed(!isCollapsed)}>
            {isCollapsed ? <IconMenu /> : <IconChevronLeft />}
          </button>
        </div>
        
        <nav className="dashboard-nav">
          {navItems.map(item => (
            <div 
              key={item.id} 
              className={`nav-item ${(currentActiveTab === item.id || (item.id === 'bookings' && appointmentsOpen) || (item.id === 'subscriptions' && subscriptionsOpen)) ? 'active' : ''}`}
              onClick={() => handleNavItemClick(item)}
              title={isCollapsed ? item.label : ''}
            >
              {item.icon}
              {!isCollapsed && <span>{item.label}</span>}
            </div>
          ))}
        </nav>

        <div className="sidebar-footer">
          <button className="logout-btn" onClick={handleLogout} title={isCollapsed ? 'Sair' : ''}>
            <IconLogout />
            {!isCollapsed && <span>Sair</span>}
          </button>
        </div>
      </aside>

      <main className="dashboard-main">
        <header className="dashboard-topbar">
          <div className="topbar-search">
            <IconSearch />
            <input 
              type="text" 
              placeholder="Buscar..." 
              value={searchQuery || ''}
              onChange={(e) => onSearchChange?.(e.target.value)}
            />
          </div>

          <div className="topbar-user" onClick={() => setProfileModalOpen(true)}>
            <div className="user-info">
              <p className="user-name">{user.nome}</p>
              <p className="user-role">{isBarber ? 'Barbeiro' : isAdmin ? 'Admin' : 'Cliente'}</p>
            </div>
            <div className="user-avatar">
              {fotoUrl && !avatarLoadFailed ? (
                <img src={fotoUrl} alt={user.nome} onError={() => setAvatarLoadFailed(true)} />
              ) : (
                <div className="avatar-placeholder">{user.nome.charAt(0)}</div>
              )}
            </div>
          </div>
        </header>

        <div className="dashboard-content">
          {children}
        </div>
      </main>

      {profileModalOpen && (
        <ProfileEditorModal
          user={user}
          isOpen={profileModalOpen}
          onClose={() => setProfileModalOpen(false)}
          onSaved={(updatedUser) => {
            onUserUpdate(updatedUser);
            setProfileModalOpen(false);
          }}
        />
      )}

      {appointmentsOpen && (
        <UserAppointments isOpen={appointmentsOpen} onClose={() => setAppointmentsOpen(false)} />
      )}

      {subscriptionsOpen && (
        <UserSubscriptions isOpen={subscriptionsOpen} onClose={() => setSubscriptionsOpen(false)} />
      )}
    </div>
  );
}
