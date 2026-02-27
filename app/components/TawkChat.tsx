"use client";

import { useEffect } from "react";

export default function TawkChat() {
  useEffect(() => {
    // Check if script is already injected
    if (document.getElementById("tawk-script")) return;

    // Initialize Tawk_API globals
    // @ts-ignore
    window.Tawk_API = window.Tawk_API || {};
    // @ts-ignore
    window.Tawk_LoadStart = new Date();

    const s1 = document.createElement("script");
    s1.id = "tawk-script";
    s1.async = true;
    s1.src = "https://embed.tawk.to/69221b9f88c368196603e977/1jamjnqee";
    s1.charset = "UTF-8";
    s1.setAttribute("crossorigin", "*");

    document.body.appendChild(s1);
  }, []);

  return null;
}
