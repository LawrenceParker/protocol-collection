// Shared by every page: creates the Supabase connection and the top navbar.
// Each page needs <div id="navbar"></div> as the first thing inside <body>,
// then calls Nav.init() and waits for it (it returns the logged-in user, or null).
//
// To add a page to the navbar, add one line to LINKS below.

const { SUPABASE_URL, SUPABASE_KEY } = window.APP_CONFIG;
const db = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

const Nav = {
  LINKS: [
    { href: "predictions.html", label: "Predictions" },
    { href: "collections.html", label: "Collections" },
    { href: "mycards.html", label: "My Cards" },
    { href: "leaderboard.html", label: "Leaderboard" }
  ],

  user: null,
  profile: null,
  credits: 0,
  creditsEl: null,
  rightEl: null,

  make(tag, className, text) {
    const e = document.createElement(tag);
    if (className) e.className = className;
    if (text !== undefined) e.textContent = text;
    return e;
  },

  async login() {
    const { error } = await db.auth.signInWithOAuth({
      provider: "discord",
      options: { redirectTo: window.location.origin + window.location.pathname }
    });
    if (error) alert("Login failed: " + error.message);
  },

  async logout() {
    await db.auth.signOut();
    window.location.href = "index.html";
  },

  async refreshCredits() {
    if (!this.user) return 0;
    const { data } = await db
      .from("profiles")
      .select("username, avatar_url, credits")
      .eq("id", this.user.id)
      .single();
    if (data) {
      this.profile = data;
      this.credits = data.credits;
      if (this.creditsEl) this.creditsEl.textContent = data.credits;
    }
    return this.credits;
  },

  build() {
    const bar = this.make("nav", "navbar");

    const brand = this.make("a", "brand", "Protocol Collection");
    brand.href = "index.html";
    bar.appendChild(brand);

    const links = this.make("div", "links");
    const here = window.location.pathname.split("/").pop();
    this.LINKS.forEach(l => {
      const a = this.make("a", null, l.label);
      a.href = l.href;
      if (here === l.href) a.classList.add("active");
      links.appendChild(a);
    });
    bar.appendChild(links);

    bar.appendChild(this.make("div", "spacer"));

    this.rightEl = this.make("div", "nav-right");
    bar.appendChild(this.rightEl);

    document.getElementById("navbar").replaceChildren(bar);
  },

  renderRight() {
    const right = this.rightEl;
    right.replaceChildren();

    if (!this.user) {
      const btn = this.make("button", "nav-btn", "Log in with Discord");
      btn.addEventListener("click", () => this.login());
      right.appendChild(btn);
      return;
    }

    const meta = this.user.user_metadata || {};
    const name = (this.profile && this.profile.username) || meta.full_name || "Player";
    const avatar = (this.profile && this.profile.avatar_url) || meta.avatar_url || "";

    const pill = this.make("div", "credits-pill");
    this.creditsEl = this.make("strong", null, String(this.credits));
    pill.appendChild(this.creditsEl);
    pill.appendChild(document.createTextNode(" credits"));
    right.appendChild(pill);

    if (avatar) {
      const img = this.make("img", "nav-avatar");
      img.src = avatar;
      img.alt = name;
      right.appendChild(img);
    }
    right.appendChild(this.make("span", "nav-name", name));

    const out = this.make("button", "nav-btn secondary", "Log out");
    out.addEventListener("click", () => this.logout());
    right.appendChild(out);
  },

  async init() {
    this.build();
    this.renderRight();
    const { data } = await db.auth.getSession();
    if (data.session) {
      this.user = data.session.user;
      await this.refreshCredits();
      this.renderRight();
    }
    return this.user;
  }
};
