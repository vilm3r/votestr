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
      ></meta>
    </Head>
    <Header show_create_cta={false} />
    <div className="px-4 pt-20">
      <div className="text-center">
        <h1 className="font-black text-gray-200 text-9xl">404</h1>

        <p className="text-2xl font-bold tracking-tight sm:text-4xl">Uh-oh!</p>

        <p className="mt-4 text-gray-500">We can&apos;t find that poll.</p>

        <Link
          href="/"
          className="inline-block px-5 py-3 mt-6 text-sm font-medium text-white bg-indigo-600 rounded hover:bg-indigo-700 focus:outline-none focus:ring"
        >
          Create your own poll
        </Link>
      </div>
    </div>
  </>
);

export default FourOhFour;
