import styles from './Footer.module.css';

export default function Footer() {
  return (
    <footer className={styles.footer}>
      <div className={styles.inner}>
        <div className={styles.brand}>
          <span className={styles.logo}>
            <span className={styles.logoIcon}>🧠</span>
            <span className={styles.logoText}>EmoSense</span>
          </span>
          <p className={styles.tagline}>
            Emotion-aware text classification powered by modern AI.
          </p>
        </div>

        <div className={styles.columns}>
          <div className={styles.column}>
            <h4 className={styles.columnTitle}>Product</h4>
            <a href="#features" className={styles.footerLink}>Features</a>
            <a href="#how-it-works" className={styles.footerLink}>How It Works</a>
            <a href="/dashboard" className={styles.footerLink}>Dashboard</a>
          </div>
          <div className={styles.column}>
            <h4 className={styles.columnTitle}>Resources</h4>
            <a href="https://github.com" target="_blank" rel="noopener noreferrer" className={styles.footerLink}>GitHub</a>
            <a href="https://huggingface.co" target="_blank" rel="noopener noreferrer" className={styles.footerLink}>HuggingFace</a>
            <a href="https://arxiv.org/abs/2005.00547" target="_blank" rel="noopener noreferrer" className={styles.footerLink}>GoEmotions Paper</a>
          </div>
        </div>
      </div>

      <div className={styles.bottom}>
        <p className={styles.copyright}>
          © {new Date().getFullYear()} EmoSense. Built with ❤️ for understanding human emotion.
        </p>
      </div>
    </footer>
  );
}
