import React from "react";
import { createRoot } from "react-dom/client";
import { flushSync } from "react-dom";
import { Check, Search, X } from "lucide-react";
import "@fontsource-variable/geist/wght.css";
import "@fontsource-variable/geist-mono/wght.css";
import { Button, Input } from "./components";

function mount(element, component) {
  const root = createRoot(element);
  flushSync(() => root.render(component));
}

function SearchInput({ selector, placeholder }) {
  return (
    <span className="relative block">
      <Search aria-hidden="true" className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
      <Input type="search" className="pl-9" placeholder={placeholder} {...{ [selector]: "" }} />
    </span>
  );
}

function Facets({ groups }) {
  return groups.map(({ key, label, options }) => (
    <fieldset className="facet" key={key}>
      <legend>{label}</legend>
      <div>
        {options.map(([value, title]) => (
          <Button key={value} variant="outline" size="sm" data-facet={key} data-value={value} aria-pressed={false}>{title}</Button>
        ))}
      </div>
    </fieldset>
  ));
}

window.BookUI = {
  facets(element, groups) {
    mount(element, <Facets groups={groups} />);
  },
  completion(element, complete) {
    mount(element, <Button data-complete-toggle="" aria-pressed={complete}><Check aria-hidden="true" /><span>{complete ? "Mark incomplete" : "Mark complete"}</span></Button>);
  },
};

for (const element of document.querySelectorAll("[data-search-mount]")) {
  mount(element, <SearchInput selector={element.dataset.searchMount} placeholder={element.dataset.placeholder} />);
}
const reset = document.querySelector("[data-reset-mount]");
if (reset) mount(reset, <Button variant="ghost" size="sm" data-reset-filters="" hidden><X aria-hidden="true" />Clear filters</Button>);
