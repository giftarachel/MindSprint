import { useState } from 'react';
import { NavLink, useNavigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { initials } from '../utils';
import {
  DashboardIcon, UsersIcon, QuizIcon, CategoryIcon, ChartIcon,
  PlusIcon, HistoryIcon, TrophyIcon, UserIcon, TeacherIcon,
  LogoutIcon, MenuIcon,
} from '../components/Icons';
import styles from './DashboardLayout.module.css';

const NAV_LINKS = {
  admin: [
    { to: '/admin',            label: 'Dashboard',   Icon: DashboardIcon },
    { to: '/admin/users',      label: 'Users',        Icon: UsersIcon },
    { to: '/admin/quizzes',    label: 'Quizzes',      Icon: QuizIcon },
    { to: '/admin/categories', label: 'Categories',   Icon: CategoryIcon },
    { to: '/admin/statistics', label: 'Statistics',   Icon: ChartIcon },
  ],
  teacher: [
    { to: '/teacher',          label: 'Dashboard',   Icon: DashboardIcon },
    { to: '/teacher/quizzes',  label: 'My Quizzes',  Icon: QuizIcon },
    { to: '/teacher/create',   label: 'Create Quiz', Icon: PlusIcon },
  ],
  student: [
    { to: '/student',             label: 'Dashboard',    Icon: DashboardIcon },
    { to: '/student/quizzes',     label: 'Quizzes',      Icon: QuizIcon },
    { to: '/student/history',     label: 'My History',   Icon: HistoryIcon },
    { to: '/student/leaderboard', label: 'Leaderboard',  Icon: TrophyIcon },
    { to: '/student/profile',     label: 'Profile',      Icon: UserIcon },
  ],
};

const ROLE_ICONS = {
  admin:   TeacherIcon,
  teacher: TeacherIcon,
  student: UserIcon,
};

export default function DashboardLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const role = user?.role || 'student';
  const links = NAV_LINKS[role] || [];
  const RoleIcon = ROLE_ICONS[role] || UserIcon;

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
              <link.Icon size={16} className={styles.navIcon} />
              {link.label}
            </NavLink>
          ))}
        </nav>

        <button className={styles.logoutBtn} onClick={handleLogout}>
          <LogoutIcon size={15} />
          Logout
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
            <MenuIcon size={20} />
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
