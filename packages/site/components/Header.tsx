import GitHub from '@mui/icons-material/GitHub';
import DarkModeIcon from '@mui/icons-material/DarkMode';
import LightModeIcon from '@mui/icons-material/LightMode';
import Link from 'next/link';
import { ButtonUnstyled } from '@mui/base';
import { useTheme } from 'next-themes';
import { useEffect, useState } from 'react';

type HeaderProps = {
  show_create_cta?: boolean;
};

const Header = ({ show_create_cta = true }: HeaderProps) => {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <header aria-label="Site Header">
      <div className="mx-auto flex h-16 max-w-screen-xl items-center gap-8 px-4 sm:px-6 lg:px-8">
        <Link className="block text-2xl font-bold text-indigo-700" href="/">
          <span>Votestr</span>
        </Link>

        <div className="flex flex-1 items-center justify-end md:justify-between">
          <nav aria-label="Site Nav" className="hidden md:block"></nav>

          <div className="flex items-center gap-4">
            <div className="flex gap-4">
              {mounted && (
                <ButtonUnstyled
                  id="theme"
                  className=""
                  onClick={() =>
                    setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')
                  }
                >
                  {resolvedTheme === 'dark' ? (
                    <DarkModeIcon />
                  ) : (
                    <LightModeIcon />
                  )}
                </ButtonUnstyled>
              )}
              <Link
                id="github"
                className=""
                href="https://github.com/vilm3r/votestr"
              >
                <GitHub />
              </Link>
            </div>
            <div className={`sm:gap-4 ${show_create_cta ? 'flex' : 'hidden'}`}>
              <Link
                className="block rounded-md bg-indigo-600 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-indigo-800"
                href="/"
              >
                Create Poll
              </Link>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
