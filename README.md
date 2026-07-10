# Profile setup info

This is a static GitHub Pages profile.

## Files

- `index.html`: Main page.
- `style.css`: Visual styling.
- `script.js`: Click-to-enter, audio, site age, Discord presence, and view counter hook.
- `about.html`: Simple extra page.
- `assets/avatar.png`: Your profile image.
- `assets/background.mp4`: Your background video.
- `assets/song.mp3`: Your background audio.

## Setup on Fedora

```bash
sudo dnf install git
git clone https://github.com/SparkyFoxer/sparkyfoxer.github.io.git
cd sparkyfoxer.github.io
```

Copy these files into the root of the repo, then commit:

```bash
git add .
git commit -m "Update profile site"
git push
```

Your GitHub Pages user site should use `index.html` at the root.

## Discord presence

Open `script.js` and set:

```js
discordUserId: "YOUR_DISCORD_ID"
```

Lanyard presence only works after your Discord account is connected to Lanyard.

## Media

Replace these files with your own:

```text
assets/avatar.png
assets/background.mp4
assets/song.mp3
```

Keep the names the same, or update the paths in `index.html`.

## Custom domain

Create a file named `CNAME` in the root of the repo.

Example:

```text
sparkyfox.nz
```

Then set the DNS records with your domain provider.
