import Link from 'next/link';

export const metadata = { title: 'Sign in · Ziki merge flow mock-up' };

export default function Login() {
  return (
    <div className="login">
      <div className="hero">
        <p className="muted small">Issue tracking for teams and their AI agents</p>
        <h1>Every fix, from report<br />to production.</h1>
        <p className="lead">See only what needs you. Let the agents do the rest.</p>
      </div>
      <div className="panel signin">
        <h2>Sign in to Ziki</h2>
        <p className="muted small">This is a demo screen. There is no real sign-in and nothing is collected.</p>
        <Link href="/" className="btn primary wide">Continue with Google</Link>
        <p className="muted small">Opens the demo with sample data.</p>
      </div>
    </div>
  );
}
