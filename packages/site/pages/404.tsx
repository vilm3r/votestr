import Head from 'next/head';
import Link from 'next/link';
import Header from '../components/Header';

const FourOhFour = () => (
  <>
    <Head>
      <title>Votestr | 404</title>
      <meta name="viewport" content="initial-scale=1.0, width=device-width" />
      <meta
        name="description"
        content="Create your next poll on Nostr with Votestr!"
      />
      <link
        rel="apple-touch-icon"
        sizes="180x180"
        href="/apple-touch-icon.png"
      />
      <link
        rel="icon"
        type="image/png"
        sizes="32x32"
        href="/favicon-32x32.png"
      />
      <link
        rel="icon"
        type="image/png"
        sizes="16x16"
        href="/favicon-16x16.png"
      />
      <link rel="manifest" href="/site.webmanifest" />
      <link rel="mask-icon" href="/safari-pinned-tab.svg" color="#5bbad5" />
      <meta name="msapplication-TileColor" content="#da532c" />
      <meta name="theme-color" content="#ffffff" />
    </Head>
    <Header show_create_cta={false} />
    <div className="px-4 pt-20">
      <div className="text-center">
        <h1 className="text-9xl font-black text-gray-200">404</h1>

        <p className="text-2xl font-bold tracking-tight sm:text-4xl">Uh-oh!</p>

        <p className="mt-4 text-gray-500">We can&apos;t find that poll.</p>

        <Link
          href="/"
          className="mt-6 inline-block rounded bg-indigo-600 px-5 py-3 text-sm font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring"
        >
          Create your own poll
        </Link>
      </div>
    </div>
  </>
);

export default FourOhFour;
