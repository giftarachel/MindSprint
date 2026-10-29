import { Link } from 'react-router-dom';
import {
  LightningIcon, TrendUpIcon, ChartIcon, TrophyIcon,
  CheckCircleIcon, UserIcon, QuizIcon, ArrowRightIcon,
} from '../components/Icons';
import styles from './LandingPage.module.css';

const FEATURES = [
  { Icon: LightningIcon, title: 'Interactive Quizzes',   desc: 'Timed, multiple-choice quizzes with real-time progress tracking.' },
  { Icon: CheckCircleIcon, title: 'Instant Results',     desc: 'Get your score, percentage, and detailed feedback immediately.' },
  { Icon: TrendUpIcon,   title: 'Track Performance',     desc: 'View your history, trends, and improvement over time.' },
  { Icon: TrophyIcon,    title: 'Leaderboard',           desc: 'Compete with peers and see where you rank in real time.' },
];

const STEPS = [
  { num: '01', Icon: UserIcon,          title: 'Sign Up',        desc: 'Create a free student or teacher account in seconds.' },
  { num: '02', Icon: QuizIcon,          title: 'Browse Quizzes', desc: 'Explore published quizzes across multiple categories.' },
  { num: '03', Icon: CheckCircleIcon,   title: 'Take the Quiz',  desc: 'Answer timed questions with a clear, focused interface.' },
  { num: '04', Icon: ChartIcon,         title: 'See Results',    desc: 'Receive instant scoring and review correct answers.' },
];

export default function LandingPage() {
  return (
    <div className={styles.page}>
      {/* ── Nav ── */}
      <header className={styles.header}>
        <div className={styles.headerInner}>
          <div className={styles.brand}>
            <span className={styles.logo}>MS</span>
            <span className={styles.brandName}>MindSprint</span>
          </div>
          <nav className={styles.headerNav}>
            <Link to="/login" className={styles.loginLink}>Login</Link>
            <Link to="/register" className={styles.ctaBtn}>Get Started</Link>
          </nav>
        </div>
      </header>

      {/* ── Hero ── */}
      <section className={styles.hero}>
        <div className={styles.heroContent}>
          <span className={styles.pill}>Academic Quiz Platform</span>
          <h1 className={styles.heroTitle}>
            Think Fast.<br />
            Learn More.<br />
            <span className={styles.accent}>Sprint Ahead.</span>
          </h1>
          <p className={styles.heroSubtitle}>
            MindSprint helps teachers create engaging quizzes and students master
            subjects through instant feedback and performance insights.
          </p>
          <div className={styles.heroCta}>
            <Link to="/register" className={styles.primaryBtn}>Get Started Free</Link>
            <Link to="/login"    className={styles.secondaryBtn}>Login to Account</Link>
          </div>
        </div>
        <div className={styles.heroVisual} aria-hidden="true">
          <div className={styles.quizCard}>
            <div className={styles.qcHeader}>
              <span className={styles.qcBadge}>In Progress</span>
              <span className={styles.qcTimer}>02:45</span>
            </div>
            <p className={styles.qcQuestion}>What is the time complexity of binary search?</p>
            <div className={styles.qcOptions}>
              {['O(n)', 'O(log n)', 'O(n²)', 'O(1)'].map((o, i) => (
                <div key={i} className={`${styles.qcOption} ${i === 1 ? styles.selected : ''}`}>{o}</div>
              ))}
            </div>
            <div className={styles.qcProgress}>
              <div className={styles.qcBar} style={{ width: '40%' }} />
            </div>
            <p className={styles.qcMeta}>Question 4 of 10</p>
          </div>
        </div>
      </section>

      {/* ── Features ── */}
      <section className={styles.section}>
        <div className={styles.sectionInner}>
          <h2 className={styles.sectionTitle}>Everything you need to quiz smarter</h2>
          <div className={styles.featureGrid}>
            {FEATURES.map((f) => (
              <div key={f.title} className={styles.featureCard}>
                <div className={styles.featureIconWrap}>
                  <f.Icon size={24} color="var(--color-primary)" />
                </div>
                <h3 className={styles.featureTitle}>{f.title}</h3>
                <p className={styles.featureDesc}>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── How It Works ── */}
      <section className={`${styles.section} ${styles.altBg}`}>
        <div className={styles.sectionInner}>
          <h2 className={styles.sectionTitle}>How It Works</h2>
          <div className={styles.stepsGrid}>
            {STEPS.map((s) => (
              <div key={s.num} className={styles.step}>
                <div className={styles.stepHeader}>
                  <span className={styles.stepNum}>{s.num}</span>
                  <div className={styles.stepIconWrap}>
                    <s.Icon size={20} color="var(--color-primary)" />
                  </div>
                </div>
                <h3 className={styles.stepTitle}>{s.title}</h3>
                <p className={styles.stepDesc}>{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA Banner ── */}
      <section className={styles.cta}>
        <h2>Ready to sprint ahead?</h2>
        <p>Join students and teachers already using MindSprint.</p>
        <Link to="/register" className={styles.primaryBtn}>
          Create Free Account <ArrowRightIcon size={16} style={{ marginLeft: 4 }} />
        </Link>
      </section>

      {/* ── Footer ── */}
      <footer className={styles.footer}>
        <span className={styles.brandName}>MindSprint</span>
        <span className={styles.footerText}>© {new Date().getFullYear()} — Online Quiz Platform</span>
      </footer>
    </div>
  );
}
