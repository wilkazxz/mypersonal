import { Route, Switch } from "wouter";
import Home from "./Home";
import Admin from "./Admin";
import Legal from "./Legal";
import "./styles.css";
import { useSite } from "./site";
import { useEffect, useState } from "react";

function NotFound() { return <Home />; }

function Splash({ src, onDone }: { src: string; onDone: () => void }) { useEffect(() => { const t = window.setTimeout(onDone, 1800); return () => window.clearTimeout(t); }, [onDone]); return <div className="splash-screen" onClick={onDone}><img src={src} alt="" /><div className="splash-screen__veil" /></div>; }

export default function App() {
  const { site } = useSite();
  const [showSplash, setShowSplash] = useState(false);
  useEffect(() => { if (!site.splash) return; try { if (sessionStorage.getItem("wilkaxyz:splash-seen") !== "1") { setShowSplash(true); sessionStorage.setItem("wilkaxyz:splash-seen", "1"); } } catch { setShowSplash(true); } }, [site.splash]);
  return <>{showSplash && site.splash && <Splash src={site.splash} onDone={() => setShowSplash(false)} />}<Switch>
    <Route path="/admin" component={Admin} />
    <Route path="/privacy">{() => <Legal type="privacy" />}</Route>
    <Route path="/terms">{() => <Legal type="terms" />}</Route>
    <Route path="/" component={Home} />
    <Route path="/:rest*" component={Home} />
    <Route component={NotFound} />
  </Switch></>;
}
