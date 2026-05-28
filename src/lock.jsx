import React from "react";
import { Logo } from "./placeholder.jsx";

// lock.jsx. Password-gated landing splash. Shown until the correct
// password is entered, then dismisses for this device (localStorage).
//
// CHANGE THE PASSWORD HERE, keep it inside the EDITMODE markers so it's
// easy to find. The check is client-side only (this is a soft gate for a
// pitch document, not a security boundary).

const LOCK_CONFIG = /*EDITMODE-BEGIN*/{
  "password": "1820",
  "hint": "Year the canal opened.",
  "contact": "studio@coffeyarchitects.com"
}/*EDITMODE-END*/;

const LOCK_KEY = "twcf-unlocked-v1";

function isUnlocked() {
  try { return localStorage.getItem(LOCK_KEY) === "true"; } catch { return false; }
}
function setUnlocked() {
  try { localStorage.setItem(LOCK_KEY, "true"); } catch {}
}

function LockScreen({ onUnlock }) {
  const [value, setValue] = React.useState("");
  const [error, setError] = React.useState(false);
  const [showHint, setShowHint] = React.useState(false);
  const inputRef = React.useRef(null);

  React.useEffect(() => {
    if (inputRef.current) inputRef.current.focus();
  }, []);

  function tryUnlock(e) {
    if (e) e.preventDefault();
    if (value.trim().toLowerCase() === String(LOCK_CONFIG.password).toLowerCase()) {
      setUnlocked();
      onUnlock();
    } else {
      setError(true);
      // Shake animation by toggling class
      if (inputRef.current) {
        inputRef.current.classList.remove("lock__input--shake");
        // Force reflow so animation restarts
        void inputRef.current.offsetWidth;
        inputRef.current.classList.add("lock__input--shake");
      }
    }
  }

  function onChange(e) {
    setValue(e.target.value);
    if (error) setError(false);
  }

  return (
    <div className="lock">
      <div className="lock__bg"></div>
      <div className="lock__plate">
        <div className="lock__top">
          <Logo size="md" />
          <div className="lock__doc mono">Pitch document · May 2026</div>
        </div>

        <div className="lock__rule"></div>

        <div className="lock__title-block">
          <h1 className="lock__title">The<br/>crossing.</h1>
          <div className="lock__sub">1820 Goods Way · King's Cross · London N1C</div>
        </div>

        <form className="lock__form" onSubmit={tryUnlock}>
          <label className="lock__label mono">Access code</label>
          <div className="lock__input-row">
            <input
              ref={inputRef}
              type="password"
              className={"lock__input" + (error ? " lock__input--error" : "")}
              value={value}
              onChange={onChange}
              placeholder=", "
              autoComplete="off"
              spellCheck={false}
            />
            <button type="submit" className="lock__btn">
              Enter →
            </button>
          </div>
          <div className="lock__meta mono">
            {error
              ? <span className="lock__err">Incorrect access code. Try again.</span>
              : (
                <button
                  type="button"
                  className="lock__hint-btn"
                  onClick={() => setShowHint(!showHint)}
                >
                  {showHint ? LOCK_CONFIG.hint : "Forgotten the code?"}
                </button>
              )
            }
          </div>
        </form>

        <div className="lock__foot">
          <span className="mono">Access by invitation</span>
          <span className="mono">{LOCK_CONFIG.contact}</span>
        </div>
      </div>
    </div>
  );
}

export { LockScreen, isUnlocked };
