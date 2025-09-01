"use client";

import React, { createContext, useContext, useState } from "react";

interface SidebarContextType {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  toggle: () => void;
}

// Valor padrão para o contexto
const defaultContextValue: SidebarContextType = {
  isOpen: false,
  setIsOpen: () => {},
  toggle: () => {},
};

// Criando o contexto com valor padrão
const SidebarContext = createContext<SidebarContextType>(defaultContextValue);

export function SidebarProvider({ children }: { children: React.ReactNode }) {
  // Estado inicial da sidebar como fechada (false)
  const [isOpen, setIsOpen] = useState(false);

  const toggle = () => {
    setIsOpen((prevState) => !prevState);
  };

  // Valor do contexto
  const contextValue: SidebarContextType = {
    isOpen,
    setIsOpen,
    toggle,
  };

  return (
    <SidebarContext.Provider value={contextValue}>
      {children}
    </SidebarContext.Provider>
  );
}

export function useSidebar() {
  const context = useContext(SidebarContext);
  if (!context) {
    throw new Error("useSidebar must be used within a SidebarProvider");
  }
  return context;
}
