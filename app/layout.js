import './globals.css';
import { Provider } from '../lib/store';
import Header from '../components/Header';

export const metadata = {
  title: 'Ziki merge flow mock-up',
  description: 'A mock-up of managing a fix from agent pull request to production without leaving Ziki.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <Provider>
          <Header />
          <main className="wrap">{children}</main>
        </Provider>
      </body>
    </html>
  );
}
