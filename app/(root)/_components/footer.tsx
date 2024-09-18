import Link from "next/link";

const Footer = () => {
  return (
    <footer className="w-full border-t">
      <div className="container mx-auto flex flex-col items-center gap-2 sm:flex-row py-6 px-4 lg:px-6">
        <p className="text-xs text-neutral-500 dark:text-neutral-400">
          © 2024 Web3 Sample App. All rights reserved.
        </p>
        <nav className="sm:ml-auto flex gap-4 sm:gap-6">
          <Link className="text-xs hover:underline underline-offset-4" href="#">
            Terms
          </Link>
          <Link className="text-xs hover:underline underline-offset-4" href="#">
            Privacy
          </Link>
        </nav>
      </div>
    </footer>
  );
}

export default Footer;
