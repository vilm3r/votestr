import { AppProps } from 'next/app';
import './styles.css';
import { ThemeProvider } from 'next-themes';

function CustomApp({ Component, pageProps }: AppProps) {
  return (
    <>
      <main className="app">
        <ThemeProvider attribute="class">
          <Component {...pageProps} />
        </ThemeProvider>
      </main>
    </>
  );
}

export default CustomApp;
