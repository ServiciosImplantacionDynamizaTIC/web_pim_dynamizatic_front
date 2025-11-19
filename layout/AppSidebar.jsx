"use client";
import Link from "next/link";
import AppMenu from "./AppMenu";
import { LayoutContext } from "./context/layoutcontext";
//import { MenuProvider } from "./context/menucontext";
import React, { useContext, useRef, useImperativeHandle, useState, useEffect } from 'react';
import { devuelveBasePath } from "@/app/utility/Utils";

const AppSidebar = () => {
  const { setLayoutState } = useContext(LayoutContext);

  const base = devuelveBasePath();
  const FALLBACK = `${base}/multimedia/Sistema/imagen-no-disponible.jpeg`;

  const [logoEmpresaUrl] = useState(
    typeof window !== "undefined" ? localStorage.getItem("logoEmpresaUrl") || "" : ""
  );
  const [srcLogo, setSrcLogo] = useState(FALLBACK);

  // Comprobación simple: si hay URL la probamos con HEAD; si falla -> fallback
  useEffect(() => {
    const candidate = logoEmpresaUrl && logoEmpresaUrl.trim()
      ? `${base}${logoEmpresaUrl}`
      : FALLBACK;

    if (candidate === FALLBACK) {
      setSrcLogo(FALLBACK);
      return;
    }

    fetch(candidate, { method: "HEAD" })
      .then((r) => setSrcLogo(r.ok ? candidate : FALLBACK))
      .catch(() => setSrcLogo(FALLBACK));
  }, [logoEmpresaUrl, base]);

  const anchor = () => {
    setLayoutState((prev) => ({ ...prev, anchored: !prev.anchored }));
  };

    return (
        <>
            <div className="sidebar-header">
                {logoEmpresaUrl && (
                    <Link href="/" className="app-logo">
                        <img
                            src={srcLogo}
                            alt="Logo"
                            className="app-logo-normal"
                            style={{ width: "200px", height: "80px" }}
                        />
                    </Link>
                )}
                <button
                    className="layout-sidebar-anchor p-link z-2 mb-2"
                    type="button"
                    onClick={anchor}
                ></button>
            </div>

            <div className="layout-menu-container">
                <AppMenu />
            </div>
        </>
    );
};

export default AppSidebar;
