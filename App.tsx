import { useEffect } from "react";
import { Route, Switch } from "wouter";
import Home from "./Home";
import Admin from "./Admin";
import styles from "./styles";

function NotFound() { return <Home />; }

export default function App() {
  useEffect(() => {
    const style = document.createElement("style");
    style.dataset.wilkaxyz = "flat-styles";
    style.textContent = styles;
    document.head.appendChild(style);
    return () => style.remove();
  }, []);
  return <Switch>
    <Route path="/admin" component={Admin} />
    <Route path="/" component={Home} />
    <Route path="/:rest*" component={Home} />
    <Route component={NotFound} />
  </Switch>;
}
