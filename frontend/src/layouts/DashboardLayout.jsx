/**
 * DashboardLayout – shared sidebar + topbar layout for all three roles.
 */
import { useState } from 'react';
import { NavLink, useNavigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { initials } from '../utils';
import styles from './DashboardLayout.module.css';

const NAV_LINKS = {
  admin: [
    { to: '/admin',            label: 'Dashboard',   icon: '▦' },
    { to: '/admin/users',      label: 'Users',        icon: '👥' },
    { to: '/admin/quizzes',    label: 'Quizzes',      icon: '📋' },
    { to: '/admin/categories', label: 'Categories',   icon: '🏷️' },
    { to: '/admin/statistics', label: 'Statistics',   icon: '📊' },
  ],
  teacher: [
    { to: '/teacher',          label: 'Dashboard',   icon: '▦' },
    { to: '/teacher/quizzes',  label: 'My Quizzes',  icon: '📋' },
    { to: '/teacher/create',   label: 'Create Quiz', icon: '＋' },
  ],
  student: [
    { to: '/student',           label: 'Dashboard',  icon: '▦' },
    { to: '/student/quizzes',   label: 'Quizzes',    icon: '📋' },
    { to: '/student/history',   label: 'My History', icon: '📜' },
    { to: '/student/leaderboard', label: 'Leaderboard', icon: '🏆' },
    { to: '/student/profile',   label: 'Profile',    icon: '👤' },
  ],
};

export default function DashboardLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const role = user?.role || 'student';
  const links = NAV_LINKS[role] || [];

  async function handleLogout() {
    await logout();
    navigate('/login');
  }

  return (
    <div className={styles.layout}>
      {/* ── Sidebar ─────────────────────────────────────── */}
      <aside className={`${styles.sidebar} ${sidebarOpen ? styles.open : ''}`}>
        <div className={styles.brand}>
          <span className={styles.brandIcon}>MS</span>
          <span className={styles.brandName}>MindSprint</span>
        </div>

        <nav className={styles.nav} aria-label="Main navigation">
          {links.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.to === `/${role}`}
              className={({ isActive }) =>
                `${styles.navLink} ${isActive ? styles.active : ''}`
              }
              onClick={() => setSidebarOpen(false)}
            >
              <span className={styles.navIcon} aria-hidden="true">{link.icon}</span>
              {link.label}
            </NavLink>
          ))}
        </nav>

        <button className={styles.logoutBtn} onClick={handleLogout}>
          <span aria-hidden="true">⎋</span> Logout
        </button>
      </aside>

      {/* ── Main ────────────────────────────────────────── */}
      <div className={styles.main}>
        {/* Topbar */}
        <header className={styles.topbar}>
          <button
            className={styles.menuBtn}
            onClick={() => setSidebarOpen((v) => !v)}
            aria-label="Toggle menu"
          >
            ☰
          </button>
          <div className={styles.topbarRight}>
            <div className={styles.avatar} title={user?.name}>
              {initials(user?.name)}
            </div>
            <div className={styles.userInfo}>
              <span className={styles.userName}>{user?.name}</span>
              <span className={styles.userRole}>{role}</span>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className={styles.content}>
          <Outlet />
        </main>
      </div>

      {/* Overlay for mobile */}
      {sidebarOpen && (
        <div
          className={styles.overlay}
          onClick={() => setSidebarOpen(false)}
          aria-hidden="true"
        />
      )}
    </div>
  );
}
