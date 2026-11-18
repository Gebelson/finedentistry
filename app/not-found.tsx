import Link from "next/link";
export default function NotFound() {
  return (
    <main id="main" className="wrap section not-found">
      <p>404</p>
      <h1>Let’s find your way.</h1>
      <p>
        The page you’re looking for isn’t here. Explore our treatments or return
        home.
      </p>
      <Link className="button" href="/">
        Back to Fine Dentistry
      </Link>
    </main>
  );
}
