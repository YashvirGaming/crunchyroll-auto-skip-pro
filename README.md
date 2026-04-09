<h1>🍿 Crunchyroll AutoSkip PRO v1.4</h1>

<p>
Automatically skips anime intros, recaps, and credits on Crunchyroll — universally across all series. Fully compatible with Chrome Manifest V3. Developed by <a href="https://www.facebook.com/yashvirgaming.info" target="_blank" rel="noopener">Yashvir Gaming</a>.
</p>

<h2>✨ Features in v1.4</h2>
<ul>
  <li><strong>Big Toggle Button:</strong> Enable or Disable Auto-Skip with one click. Button color indicates status (Green = Enabled, Red = Disabled).</li>
  <li><strong>Individual Toggles:</strong> Control:
    <ul>
      <li>Skip Intro</li>
      <li>Skip Recap</li>
      <li>Skip Credits</li>
      <li>Picture-in-Picture mode</li>
      <li>Debug Mode</li>
    </ul>
  </li>
  <li><strong>Hotkeys:</strong>
    <ul>
      <li><code>Alt + Shift + S</code> → Toggle Auto-Skip</li>
      <li><code>Alt + Shift + P</code> → Toggle Picture-in-Picture</li>
    </ul>
  </li>
  <li><strong>Visual Feedback:</strong> On-screen messages show when skipping occurs (e.g., "⏭ Skipped!").</li>
  <li><strong>Universal Detection:</strong> Works across all Crunchyroll series — detects every known skip button label including Intro, Recap, Opening, Prologue, Credits, Ending, Outro, Preview, and more.</li>
  <li><strong>SPA Navigation Aware:</strong> Detects episode changes without a page reload and resets state automatically for the next episode.</li>
  <li><strong>Seek-Aware:</strong> Dragging the video slider resets click state so Credits buttons always fire correctly from any position.</li>
  <li><strong>Lightweight & Local:</strong> Works entirely in your browser — no external APIs, AniSkip data, or servers required.</li>
  <li><strong>Manifest V3 Compatible:</strong> Fully functional with the latest Chrome extension requirements.</li>
</ul>

<h2>🆕 Changelog</h2>

<h3>v1.4 — Universal Detection Update</h3>
<ul>
  <li>Expanded keyword list: now covers <code>Skip Prologue</code>, <code>Skip Outro</code>, <code>Skip Branding</code>, <code>Skip Cold Open</code>, <code>Skip Sponsor</code></li>
  <li>Wider DOM selector: now detects skip buttons by <code>class</code> and <code>id</code> attributes in addition to text and ARIA labels</li>
  <li>Reads child <code>&lt;span&gt;</code> / <code>&lt;div&gt;</code> text so no button label is missed regardless of DOM structure</li>
  <li>Added <code>video ended</code> listener — resets click state cleanly when an episode finishes</li>
  <li>Unified <code>resetClickState()</code> called consistently on seek, navigation, new episode, and episode end</li>
</ul>

<h3>v1.3 — Recap → Intro Fix</h3>
<ul>
  <li>Fixed: clicking Skip Recap no longer blocks Skip Intro from firing seconds later</li>
  <li>Debounce is now <strong>per button type</strong> (intro vs ending) instead of one shared global timer</li>
</ul>

<h3>v1.2 — Core Reliability Fix</h3>
<ul>
  <li>Fixed: <code>WeakSet</code> replaced with expiring <code>Map</code> — clicked buttons are no longer permanently blacklisted across episodes</li>
  <li>Fixed: visibility check replaced — no longer falsely rejects buttons inside Crunchyroll's fixed-position player</li>
  <li>Fixed: Credits button now works after dragging the video slider to the end</li>
  <li>Fixed: SPA navigation detection added — re-attaches listeners when switching episodes without a page reload</li>
  <li>Fixed: duplicate <code>setInterval</code> race condition eliminated</li>
</ul>

<h2>📦 Installation</h2>
<ol>
  <li>Download and unzip the extension folder.</li>
  <li>Open <strong>chrome://extensions/</strong> in Chrome.</li>
  <li>Enable <strong>Developer mode</strong> in the top-right corner.</li>
  <li>Click <strong>Load unpacked</strong> and select the unzipped folder.</li>
  <li>Go to any Crunchyroll episode — Auto-Skip will activate automatically.</li>
</ol>

<h2>⚙️ Usage</h2>
<ul>
  <li>Click the big button in the popup to enable/disable all skipping.</li>
  <li>Use the checkboxes to toggle Skip Intro, Skip Credits, PiP, or Debug individually.</li>
  <li>Hotkeys:
    <ul>
      <li><code>Alt + Shift + S</code>: Enable/Disable Auto-Skip</li>
      <li><code>Alt + Shift + P</code>: Toggle Picture-in-Picture</li>
    </ul>
  </li>
  <li>Debug Mode logs detailed info to the browser console for troubleshooting.</li>
</ul>

<h2>💡 Notes</h2>
<ul>
  <li>Only activates on Crunchyroll pages (<code>*.crunchyroll.com</code>).</li>
  <li>Skip detection works by scanning the page for skip buttons — no external APIs are used.</li>
  <li>Best used with Chrome or any Chromium-based browser (Edge, Brave, Opera, etc.).</li>
  <li>If a skip button is not being detected, enable Debug Mode in the popup and check the browser console.</li>
</ul>

<h2>🔐 Privacy</h2>
<p>
Crunchyroll AutoSkip PRO does <strong>not</strong> collect, store, transmit, or sell any personal data.<br>
The extension runs entirely in the user's browser and only interacts with Crunchyroll pages to control video playback.
</p>

<h2>⚠️ Disclaimer</h2>
<p>
This extension is <strong>not affiliated with or endorsed by Crunchyroll</strong>.<br>
Crunchyroll is a registered trademark of its respective owners.
</p>

<h2>📬 Contact</h2>
<p>
Made by <strong>Yashvir Gaming</strong><br>
📧 Email: yashvirgamingext@aol.com
</p>

<h2>🔗 Credits</h2>
<p>Developed by <a href="https://www.facebook.com/yashvirgaming.info" target="_blank" rel="noopener">Yashvir Gaming</a>.</p>
