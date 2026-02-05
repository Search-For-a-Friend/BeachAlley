import React, { useEffect } from 'react';

interface SplashScreenProps {
  onComplete: () => void;
}

export const SplashScreen: React.FC<SplashScreenProps> = ({ onComplete }) => {
  useEffect(() => {
    // Auto-proceed after 2.5 seconds or tap to skip
    const timer = setTimeout(onComplete, 2500);
    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <div style={styles.container} onClick={onComplete}>
      <div style={styles.content}>
        <div style={styles.logo}>🌴</div>
        <h1 style={styles.title}>Beach Alley</h1>
        <p style={styles.subtitle}>Build Your Paradise</p>
        <div style={styles.loader}>
          <div style={styles.loaderBar} />
        </div>
        <p style={styles.tapHint}>Tap to continue</p>
      </div>
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  container: {
    width: '100%',
    height: '100%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'linear-gradient(135deg, #FF6B35 0%, #FF0080 50%, #9B4DCA 100%)',
    position: 'relative',
    overflow: 'hidden',
  },
  content: {
    textAlign: 'center',
    padding: '20px',
    animation: 'fadeIn 0.8s ease-in',
  },
  logo: {
    fontSize: '80px',
    marginBottom: '20px',
    animation: 'bounce 1s infinite',
  },
  title: {
    fontSize: '2.5rem',
    fontWeight: 'bold',
    margin: '0 0 10px 0',
    textShadow: '0 4px 8px rgba(0, 0, 0, 0.3)',
    letterSpacing: '2px',
  },
  subtitle: {
    fontSize: '1rem',
    opacity: 0.9,
    marginBottom: '40px',
  },
  loader: {
    width: '200px',
    height: '4px',
    background: 'rgba(255, 255, 255, 0.3)',
    borderRadius: '2px',
    margin: '0 auto 30px',
    overflow: 'hidden',
  },
  loaderBar: {
    width: '50%',
    height: '100%',
    background: '#fff',
    borderRadius: '2px',
    animation: 'loading 2.5s ease-in-out',
  },
  tapHint: {
    fontSize: '0.85rem',
    opacity: 0.7,
    animation: 'pulse 2s infinite',
  },
};

export default SplashScreen;
