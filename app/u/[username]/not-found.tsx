// An address with no account behind it: the profile's own look, and no sending people away by itself.
export default function ProfileNotFound() {
    return (
        <section className="pf">
            <div className="wrap pf-wrap pf-none">
                <img src="/rl/robtic/404.webp" alt="" width={170} height={170} />
                <h1>This account doesn’t exist</h1>
                <p>The name may be misspelled, or the account may have changed its name or been deleted.</p>
                <a className="btn btn-primary" href="/">Go home</a>
            </div>
        </section>
    );
}
