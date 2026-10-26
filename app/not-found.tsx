// Robtic landing: anything that doesn't match a page lands here and is sent home. nginx sends unknown
// sub-domains of robtic.org to this same site, so a stray host ends up here too and bounces to robtic.org/.
// Server-rendered so the message shows even with no JavaScript; the script sends the browser on after a beat.
export default function NotFound() {
    return (
        <section className="notfound">
            <div className="wrap">
                <img src="/rl/robtic/404.webp" alt="The Robtic robot, lost" width={520} height={520} />
                <h1>This page wandered off.</h1>
                <p>Taking you back to Robtic…</p>
                <a className="btn btn-primary btn-lg" href="/">Go home now</a>
            </div>
            <script
                dangerouslySetInnerHTML={{
                    __html: "setTimeout(function(){location.replace('/');},4000);",
                }}
            />
        </section>
    );
}
